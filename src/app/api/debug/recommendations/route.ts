import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, withErrorHandling, successResponse } from '@/lib/api-utils';

// GET /api/debug/recommendations - Debug recommendations data
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user } = await requireAuth(request);

  try {
    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        income: true,
        affordablePrice: true,
        transportMode: true,
        name: true,
        email: true
      }
    });

    // Get listings count
    const listingsCount = await prisma.listing.count({
      where: {
        isPublished: true
      }
    });

    // Get sample listings
    const sampleListings = await prisma.listing.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        price: true,
        city: true,
        roomType: true,
        amenities: true,
        ratingAvg: true,
        ratingCount: true
      },
      take: 3
    });

    return successResponse({
      user: userData,
      listingsCount,
      sampleListings: sampleListings.map(listing => ({
        ...listing,
        amenities: Array.isArray(listing.amenities) 
          ? listing.amenities 
          : JSON.parse(listing.amenities as string || '[]')
      })),
      debug: {
        hasIncome: !!userData?.income,
        hasAffordablePrice: !!userData?.affordablePrice,
        canGenerateRecommendations: !!(userData?.income || userData?.affordablePrice)
      }
    });

  } catch (error) {
    console.error('Debug recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug data' },
      { status: 500 }
    );
  }
});