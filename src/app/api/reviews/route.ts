import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass, getPaginationParams, paginatedResponse } from '@/lib/api-utils';
import { reviewSchema } from '@/lib/validations';
import { UserRole, Prisma } from '@prisma/client';

// GET /api/reviews - Get reviews with pagination
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const listingId = searchParams.get('listingId');
  const reviewerId = searchParams.get('reviewerId');

  const where: Prisma.ReviewWhereInput = {};
  if (listingId) where.listingId = listingId;
  if (reviewerId) where.reviewerId = reviewerId;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return paginatedSuccessResponse(reviews, total, page, limit);
});

// POST /api/reviews - Create new review (bachelors only)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request, [UserRole.BACHELOR]);
  
  const body = await request.json();
  const validatedData = reviewSchema.parse(body);
  const { listingId, rating, comment } = validatedData;

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });

  if (!listing) {
    throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
  }

  // Check if user already reviewed this listing
  const existingReview = await prisma.review.findUnique({
    where: {
      listingId_reviewerId: {
        listingId,
        reviewerId: session.user.id,
      },
    },
  });

  if (existingReview) {
    throw new ApiErrorClass('You have already reviewed this listing', 'REVIEW_EXISTS', 409);
  }

  // Create review in a transaction to update listing rating
  const result = await prisma.$transaction(async (tx) => {
    // Create the review
    const review = await tx.review.create({
      data: {
        listingId,
        reviewerId: session.user.id,
        rating,
        comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update listing average rating
    const reviewStats = await tx.review.aggregate({
      where: { listingId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.listing.update({
      where: { id: listingId },
      data: {
        ratingAvg: reviewStats._avg.rating || 0,
        ratingCount: reviewStats._count.rating,
      },
    });

    return review;
  });

  return successResponse(result, 201);
});