import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { BookingStatus } from '@prisma/client';

// GET /api/bookings/status?listingId=xxx
// Returns current booking status: available, booked, or available from date
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return successResponse({ error: 'listingId is required' }, 400);
  }

  // Get today's date at start of day for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all active bookings for this listing
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID],
      },
      // Only get bookings that haven't ended yet
      endDate: {
        gte: today,
      },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Check if listing is currently booked (today falls within a booking)
  let isCurrentlyBooked = false;
  let currentBookingEndDate: Date | null = null;

  for (const booking of bookings) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    // Check if today is within this booking period
    if (today >= bookingStart && today <= bookingEnd) {
      isCurrentlyBooked = true;
      // Track the furthest end date in case of overlapping bookings
      if (!currentBookingEndDate || bookingEnd > currentBookingEndDate) {
        currentBookingEndDate = bookingEnd;
      }
    }
  }

  if (isCurrentlyBooked && currentBookingEndDate) {
    // Calculate next available date (day after booking ends)
    const nextAvailableDate = new Date(currentBookingEndDate);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
    nextAvailableDate.setHours(0, 0, 0, 0);

    // Check if there's another booking starting on or before the next available date
    // This handles consecutive bookings
    let finalAvailableDate = nextAvailableDate;
    let foundConsecutive = true;

    while (foundConsecutive) {
      foundConsecutive = false;
      for (const booking of bookings) {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        // Check if this booking starts on or before our current available date
        // and ends after it
        if (bookingStart <= finalAvailableDate && bookingEnd >= finalAvailableDate) {
          finalAvailableDate = new Date(bookingEnd);
          finalAvailableDate.setDate(finalAvailableDate.getDate() + 1);
          foundConsecutive = true;
          break;
        }
      }
    }

    return successResponse({
      status: 'booked',
      isAvailable: false,
      availableFrom: finalAvailableDate.toISOString(),
      currentBookingEnds: currentBookingEndDate.toISOString(),
    });
  }

  // Check if there's a future booking but available now
  const futureBookings = bookings.filter((b) => {
    const bookingStart = new Date(b.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    return bookingStart > today;
  });

  if (futureBookings.length > 0) {
    const nextBooking = futureBookings[0];
    return successResponse({
      status: 'available',
      isAvailable: true,
      nextBookingStarts: new Date(nextBooking.startDate).toISOString(),
    });
  }

  // No bookings - fully available
  return successResponse({
    status: 'available',
    isAvailable: true,
    nextBookingStarts: null,
  });
});

