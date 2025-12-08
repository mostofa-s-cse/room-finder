import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { listingSchema } from '@/lib/validations';
import { UserRole } from '@prisma/client';

// GET /api/listings/[id] - Get single listing
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Listing ID is required', 'MISSING_PARAMETER', 400);
    }

    const listing = await prisma.listing.findUnique({
      where: { id: resolvedParams.id },
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePicture: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!listing) {
      throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
    }

    // Calculate average rating
    const avgRating = listing.reviews.length > 0
      ? listing.reviews.reduce((sum: number, review) => sum + review.rating, 0) / listing.reviews.length
      : 0;

    return successResponse({
      ...listing,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
    });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// PUT /api/listings/[id] - Update listing (landlords only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Listing ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.LANDLORD]);
    const body = await request.json();
    const validatedData = listingSchema.parse(body);

    // Check if listing exists and belongs to the user
    const existingListing = await prisma.listing.findUnique({
      where: { id: resolvedParams.id },
      select: {
        landlordId: true,
      },
    });

    if (!existingListing) {
      throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
    }

    if (existingListing.landlordId !== session.user.id) {
      throw new ApiErrorClass('You can only update your own listings', 'FORBIDDEN', 403);
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: resolvedParams.id },
      data: validatedData,
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    // Calculate average rating
    const avgRating = updatedListing.reviews.length > 0
      ? updatedListing.reviews.reduce((sum: number, review) => sum + review.rating, 0) / updatedListing.reviews.length
      : 0;

    return successResponse({
      ...updatedListing,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// DELETE /api/listings/[id] - Delete listing (landlords only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Listing ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.LANDLORD]);

    // Check if listing exists and belongs to the user
    const existingListing = await prisma.listing.findUnique({
      where: { id: resolvedParams.id },
      select: {
        landlordId: true,
      },
    });

    if (!existingListing) {
      throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
    }

    if (existingListing.landlordId !== session.user.id) {
      throw new ApiErrorClass('You can only delete your own listings', 'FORBIDDEN', 403);
    }

    // Check if there are any active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        listingId: resolvedParams.id,
        status: {
          in: ['PENDING', 'PAID'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new ApiErrorClass(
        'Cannot delete listing with active bookings',
        'LISTING_HAS_ACTIVE_BOOKINGS',
        400
      );
    }

    // Delete the listing (this will cascade delete related records)
    await prisma.listing.delete({
      where: { id: resolvedParams.id },
    });

    return successResponse({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}