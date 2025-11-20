import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// POST /api/landlord/reviews/[reviewId]/respond - Respond to a review
export async function POST(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.reviewId) {
      throw new ApiErrorClass('Review ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.LANDLORD]);
    const body = await request.json();
    const { response } = body;

    if (!response) {
      throw new ApiErrorClass('Response is required', 'MISSING_PARAMETER', 400);
    }

    // Check if review exists and belongs to landlord's listing
    const review = await prisma.review.findUnique({
      where: { id: resolvedParams.reviewId },
      include: {
        listing: {
          select: {
            landlordId: true,
          },
        },
      },
    });

    if (!review) {
      throw new ApiErrorClass('Review not found', 'REVIEW_NOT_FOUND', 404);
    }

    if (review.listing.landlordId !== session.user.id) {
      throw new ApiErrorClass('You can only respond to reviews for your own listings', 'FORBIDDEN', 403);
    }

    // For now, just return success since we don't have response field in review model yet
    // TODO: Add response field to review model and update the review
    const reviewResponse = {
      id: resolvedParams.reviewId,
      response,
      respondedAt: new Date().toISOString(),
    };

    return successResponse(reviewResponse);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}