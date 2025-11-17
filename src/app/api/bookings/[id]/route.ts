import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { updateBookingStatusSchema } from '@/lib/validations';
import { UserRole, BookingStatus } from '@prisma/client';

// GET /api/bookings/[id] - Get single booking
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Booking ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request);

    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        listing: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiErrorClass('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }

    // Check permissions - users can only view their own bookings, landlords can view bookings for their listings
    const canAccess = booking.userId === session.user.id ||
                     booking.listing.landlordId === session.user.id ||
                     session.user.role === UserRole.ADMIN;

    if (!canAccess) {
      throw new ApiErrorClass('You can only view your own bookings', 'FORBIDDEN', 403);
    }

    return successResponse(booking);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// PUT /api/bookings/[id] - Update booking status (landlords and admins)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Booking ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request);
    const body = await request.json();
    const validatedData = updateBookingStatusSchema.parse(body);

    // Get booking with listing info
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        listing: {
          select: {
            landlordId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new ApiErrorClass('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }

    // Check permissions - only landlord of the listing or admin can update status
    const canUpdate = booking.listing.landlordId === session.user.id || 
                     session.user.role === UserRole.ADMIN;

    if (!canUpdate) {
      throw new ApiErrorClass('You can only update bookings for your own listings', 'FORBIDDEN', 403);
    }

    // Validate status transitions
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.PAID, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.PAID, BookingStatus.CANCELLED],
      [BookingStatus.PAID]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [], // Cannot change from completed
      [BookingStatus.CANCELLED]: [], // Cannot change from cancelled
    };

    if (!validTransitions[booking.status].includes(validatedData.status)) {
      throw new ApiErrorClass(
        `Cannot change booking status from ${booking.status} to ${validatedData.status}`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: resolvedParams.id },
      data: {
        status: validatedData.status,
      },
      include: {
        listing: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return successResponse(updatedBooking);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// DELETE /api/bookings/[id] - Cancel booking (users only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Booking ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.BACHELOR, UserRole.LANDLORD]);
    
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      select: {
        userId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new ApiErrorClass('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }

    if (booking.userId !== session.user.id) {
      throw new ApiErrorClass('You can only cancel your own bookings', 'FORBIDDEN', 403);
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new ApiErrorClass('Only pending bookings can be cancelled', 'INVALID_BOOKING_STATUS', 400);
    }

    // Update booking status to cancelled
    const cancelledBooking = await prisma.booking.update({
      where: { id: resolvedParams.id },
      data: {
        status: BookingStatus.CANCELLED,
      },
      include: {
        listing: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return successResponse(cancelledBooking);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {     
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}