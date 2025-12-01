import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { bookingSchema } from '@/lib/validations';
import { UserRole, BookingStatus, Prisma } from '@prisma/client';
import { 
  checkBookingConflicts, 
  checkUserActiveBooking, 
  validateBookingDates,
  calculateBookingDuration
} from '@/lib/bookings/conflict-checker';

// GET /api/bookings - Get bookings for current user
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  
  const status = searchParams.get('status') as BookingStatus | null;

  const where: Prisma.BookingWhereInput = {
    userId: session.user.id,
    ...(status && { status }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            address: true,
            images: true,
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
    }),
    prisma.booking.count({ where }),
  ]);

  return paginatedSuccessResponse(bookings, total, page, limit);
});

// POST /api/bookings - Create new booking (bachelors only)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request, [UserRole.BACHELOR]);
  
  const body = await request.json();
  const validatedData = bookingSchema.parse(body);

  // Check if listing exists and is available
  const listing = await prisma.listing.findUnique({
    where: { 
      id: validatedData.listingId,
      isPublished: true,
    },
    select: {
      id: true,
      price: true,
      landlordId: true,
    },
  });

  if (!listing) {
    throw new ApiErrorClass('Listing not found or not available', 'LISTING_NOT_FOUND', 404);
  }

  // Validate date range
  const startDate = new Date(validatedData.startDate);
  const endDate = new Date(validatedData.endDate);
  
  const dateValidation = validateBookingDates(startDate, endDate);
  if (!dateValidation.isValid) {
    throw new ApiErrorClass(dateValidation.error!, 'INVALID_DATE_RANGE', 400);
  }

  // Check if user already has a pending/confirmed booking for this listing
  const hasActiveBooking = await checkUserActiveBooking(validatedData.listingId, session.user.id);
  if (hasActiveBooking) {
    throw new ApiErrorClass('You already have an active booking for this listing', 'BOOKING_EXISTS', 409);
  }

  // Check for overlapping bookings from other users (date conflict detection)
  const conflicts = await checkBookingConflicts({
    listingId: validatedData.listingId,
    startDate,
    endDate,
    excludeUserId: session.user.id,
  });

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    const conflictDetails = conflicts.map(c => ({
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      bookedBy: c.user.name,
    }));
    
    throw new ApiErrorClass(
      `This listing is already booked from ${conflict.startDate.toLocaleDateString()} to ${conflict.endDate.toLocaleDateString()}. Please choose different dates.`,
      'DATE_CONFLICT',
      409,
      { conflicts: conflictDetails }
    );
  }

  // Calculate booking duration for validation
  const duration = calculateBookingDuration(startDate, endDate);
  
  // Use transaction to prevent race conditions
  const booking = await prisma.$transaction(async (tx) => {
    // Double-check for conflicts within transaction to handle race conditions
    const lastMinuteConflicts = await checkBookingConflicts({
      listingId: validatedData.listingId,
      startDate,
      endDate,
      excludeUserId: session.user.id,
    });

    if (lastMinuteConflicts.length > 0) {
      throw new ApiErrorClass(
        `This listing was just booked by another user. Please choose different dates.`,
        'CONCURRENT_BOOKING',
        409
      );
    }

    // Create the booking
    return await tx.booking.create({
      data: {
        listingId: validatedData.listingId,
        userId: session.user.id,
        startDate,
        endDate,
        amount: validatedData.amount,
        totalAmount: validatedData.amount,
        status: BookingStatus.PENDING,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
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
    });
  });

  return successResponse(booking, 201);
});