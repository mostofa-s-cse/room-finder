import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withErrorHandling, successResponse } from '@/lib/api-utils';
import { RecommendationEngine } from '@/lib/recommendations/engine';
import { UserPreferences, RecommendationFilter } from '@/lib/recommendations/types';

// POST /api/recommendations - Generate personalized recommendations
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);

  try {
    const body = await request.json();
    const {
      workLocation,
      preferredAmenities = [],
      preferredRoomTypes = [],
      maxDistance = 25,
      maxResults = 10,
      budgetFlexibility = 0.1,
      priorityWeights
    } = body;

    // Get user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        income: true,
        affordablePrice: true,
        transportMode: true
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build user preferences
    const userPreferences: UserPreferences = {
      userId: user.id,
      income: userData.income || undefined,
      affordablePrice: userData.affordablePrice || undefined,
      transportMode: userData.transportMode || undefined,
      preferredAmenities,
      preferredRoomTypes,
      maxDistance,
      workLocation,
      priorityWeights
    };

    // Get all published listings
    const listings = await prisma.listing.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        lat: true,
        lng: true,
        roomType: true,
        amenities: true,
        ratingAvg: true,
        ratingCount: true,
        isPublished: true,
        createdAt: true,
        landlord: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Convert Prisma result to our format
    const listingsForRecommendation = listings.map(listing => ({
      ...listing,
      amenities: Array.isArray(listing.amenities) 
        ? listing.amenities as string[]
        : JSON.parse(listing.amenities as string || '[]'),
      roomType: listing.roomType as 'SINGLE' | 'SHARED'
    }));

    // Generate recommendations
    const filter: RecommendationFilter = {
      maxResults,
      minScore: 0.2,
      budgetFlexibility,
      maxDistance
    };

    const recommendations = await RecommendationEngine.generateRecommendations(
      userPreferences,
      listingsForRecommendation,
      filter
    );

    return successResponse({
      recommendations,
      userPreferences: {
        ...userPreferences,
        // Don't send sensitive data back
        income: userData.income ? '***' : null,
        affordablePrice: userData.affordablePrice
      },
      meta: {
        totalListings: listings.length,
        recommendationsCount: recommendations.length,
        averageScore: recommendations.length > 0 
          ? recommendations.reduce((sum, r) => sum + r.score.totalScore, 0) / recommendations.length
          : 0
      }
    });

  } catch (error) {
    console.error('Recommendations generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
});

// GET /api/recommendations - Get cached or quick recommendations
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  const workLat = searchParams.get('workLat');
  const workLng = searchParams.get('workLng');

  try {
    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        income: true,
        affordablePrice: true,
        transportMode: true
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Simple budget-based filtering
    let maxPrice = userData.affordablePrice;
    if (!maxPrice && userData.income) {
      maxPrice = userData.income * 0.35; // Max 35% of income
    }

    const whereCondition: {
      isPublished: boolean;
      price?: { lte: number };
    } = {
      isPublished: true
    };

    if (maxPrice) {
      whereCondition.price = { lte: maxPrice * 1.2 }; // 20% flexibility
    }

    // Get listings with basic filtering
    const listings = await prisma.listing.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        city: true,
        address: true,
        lat: true,
        lng: true,
        roomType: true,
        amenities: true,
        ratingAvg: true,
        ratingCount: true,
        images: true,
        landlord: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { ratingAvg: 'desc' },
        { ratingCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit * 2 // Get more to allow for filtering
    });

    // Calculate distances if work location provided
    let recommendedListings = listings;
    if (workLat && workLng) {
      const workLocation = {
        lat: parseFloat(workLat),
        lng: parseFloat(workLng)
      };

      recommendedListings = listings
        .map(listing => {
          const distance = Math.sqrt(
            Math.pow(listing.lat - workLocation.lat, 2) + 
            Math.pow(listing.lng - workLocation.lng, 2)
          ) * 111; // Rough km conversion
          
          return { ...listing, distance };
        })
        .sort((a, b) => {
          // Score based on rating and proximity
          const listingWithDistance = a as typeof a & { distance: number };
          const listingWithDistanceB = b as typeof b & { distance: number };
          const scoreA = a.ratingAvg * 0.7 + (1 / (1 + listingWithDistance.distance * 0.1)) * 0.3;
          const scoreB = b.ratingAvg * 0.7 + (1 / (1 + listingWithDistanceB.distance * 0.1)) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, limit);
    } else {
      recommendedListings = listings.slice(0, limit);
    }

    // Format response
    const formattedListings = recommendedListings.map(listing => ({
      ...listing,
      amenities: Array.isArray(listing.amenities) 
        ? listing.amenities 
        : JSON.parse(listing.amenities as string || '[]'),
      budgetFit: maxPrice ? (
        listing.price <= maxPrice * 0.8 ? 'excellent' :
        listing.price <= maxPrice ? 'good' :
        listing.price <= maxPrice * 1.1 ? 'fair' : 'poor'
      ) : 'unknown',
      matchPercentage: Math.round(
        (listing.ratingAvg / 5) * 100 * 0.6 + // 60% from rating
        (maxPrice ? Math.max(0, 100 - ((listing.price / maxPrice) * 100)) : 40) * 0.4 // 40% from budget fit
      )
    }));

    return successResponse({
      recommendations: formattedListings,
      meta: {
        hasWorkLocation: !!(workLat && workLng),
        userBudget: maxPrice,
        totalResults: formattedListings.length
      }
    });

  } catch (error) {
    console.error('Quick recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
});