import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/landlord/reviews - Get landlord's reviews
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, [UserRole.LANDLORD]);

    // Get all reviews for landlord's listings
    const reviews = await prisma.review.findMany({
      where: {
        listing: {
          landlordId: session.user.id,
        },
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

    // Count ratings by star level
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    const reviewsData = {
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
          email: review.reviewer.email,
        },
        listing: {
          id: review.listing.id,
          title: review.listing.title,
          address: review.listing.address,
        },
        response: null, // TODO: Add response field to review model
        respondedAt: null,
      })),
      statistics: {
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    };

    return successResponse(reviewsData);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}