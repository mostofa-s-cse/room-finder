import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { bookingSchema } from '@/lib/validations';
import { UserRole, BookingStatus, Prisma } from '@prisma/client';

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

  // Check if user already has a pending/confirmed booking for this listing
  const existingBooking = await prisma.booking.findFirst({
    where: {
      listingId: validatedData.listingId,
      userId: session.user.id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.PAID],
      },
    },
  });

  if (existingBooking) {
    throw new ApiErrorClass('You already have an active booking for this listing', 'BOOKING_EXISTS', 409);
  }

  const booking = await prisma.booking.create({
    data: {
      listingId: validatedData.listingId,
      userId: session.user.id,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      amount: validatedData.amount,
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

  return successResponse(booking, 201);
});