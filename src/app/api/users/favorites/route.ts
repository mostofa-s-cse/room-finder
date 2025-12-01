import { NextRequest } from 'next/server';
import { successResponse, requireAuth, withErrorHandling, ApiErrorClass } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const favoriteSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
});

const removeFavoriteSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
});

// GET /api/users/favorites - Get user favorites
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);

  const favorites = await prisma.userFavorite.findMany({
    where: { 
      userId: session.user.id 
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          city: true,
          address: true,
          images: true,
          roomType: true,
          averageRating: true,
          ratingCount: true,
          isPublished: true,
          createdAt: true,
          landlord: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(favorites);
});

// POST /api/users/favorites - Add to favorites
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  
  const body = await request.json();
  const { listingId } = favoriteSchema.parse(body);

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, isPublished: true },
  });

  if (!listing) {
    throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
  }

  if (!listing.isPublished) {
    throw new ApiErrorClass('Cannot favorite unpublished listing', 'LISTING_UNPUBLISHED', 400);
  }

  // Check if already favorited
  const existingFavorite = await prisma.userFavorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId,
      },
    },
  });

  if (existingFavorite) {
    throw new ApiErrorClass('Listing already in favorites', 'ALREADY_FAVORITED', 409);
  }

  // Add to favorites
  const favorite = await prisma.userFavorite.create({
    data: {
      userId: session.user.id,
      listingId,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });

  return successResponse(favorite, 201);
});

// DELETE /api/users/favorites - Remove from favorites
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);

  const body = await request.json();
  const { listingId } = removeFavoriteSchema.parse(body);

  // Check if favorite exists
  const favorite = await prisma.userFavorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId,
      },
    },
  });

  if (!favorite) {
    throw new ApiErrorClass('Favorite not found', 'FAVORITE_NOT_FOUND', 404);
  }

  // Remove from favorites
  await prisma.userFavorite.delete({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId,
      },
    },
  });

  return successResponse({ message: 'Removed from favorites' });
});