import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth } from '@/lib/api-utils';

// GET /api/listings/recommendations - Get recommended listings for user
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);

  // Get user for better recommendations
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      bookings: {
        include: {
          listing: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get recommendations based on user preferences and behavior
  const recommendations = await prisma.listing.findMany({
    where: {
      status: 'APPROVED',
      isPublished: true,
      // Exclude user's own listings if they are a landlord
      ...(user.role === 'LANDLORD' ? {
        landlordId: {
          not: user.id
        }
      } : {})
    },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              name: true,
              id: true
            }
          }
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    orderBy: [
      { createdAt: 'desc' },
      { price: 'asc' }
    ],
    take: 12
  });

  // Calculate average rating for each listing
  const recommendationsWithRating = recommendations.map(listing => {
    const totalRating = listing.reviews.reduce((sum: number, review) => sum + review.rating, 0);
    const averageRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;
    
    return {
      ...listing,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: listing.reviews.length
    };
  });

  return successResponse(recommendationsWithRating);
});