import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { BookingStatus } from '@prisma/client';

// GET /api/listings/status?listingId=xxx
// Returns simple listing status: available or booked with dates
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return successResponse({ error: 'listingId is required' }, 400);
  }

  // Get the listing to check if it's published
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      isPublished: true,
      status: true,
      availableFrom: true,
    },
  });

  if (!listing) {
    return successResponse({ error: 'Listing not found' }, 404);
  }

  // Check if listing is published and active
  if (!listing.isPublished || listing.status !== 'PENDING') {
    return successResponse({
      listingId,
      status: 'unavailable',
      isAvailable: false,
      availableFrom: null,
      reason: !listing.isPublished ? 'Not published' : 'Listing is not active',
    });
  }

  // Get today's date at start of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if availableFrom date has passed
  if (listing.availableFrom) {
    const availableFromDate = new Date(listing.availableFrom);
    availableFromDate.setHours(0, 0, 0, 0);
    
    if (availableFromDate > today) {
      return successResponse({
        listingId,
        status: 'unavailable',
        isAvailable: false,
        availableFrom: availableFromDate.toISOString(),
        reason: 'Not yet available',
      });
    }
  }

  // Find all active bookings that overlap with today or future
  const activeBookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID],
      },
      // Only bookings that haven't ended yet
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
  let currentBooking = null;
  
  for (const booking of activeBookings) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    bookingStart.setHours(0, 0, 0, 0);
    bookingEnd.setHours(0, 0, 0, 0);

    // Check if today is within this booking period
    if (today >= bookingStart && today <= bookingEnd) {
      currentBooking = booking;
      break;
    }
  }

  // If currently booked, find the next available date
  if (currentBooking) {
    let nextAvailableDate = new Date(currentBooking.endDate);
    nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
    nextAvailableDate.setHours(0, 0, 0, 0);

    // Check for consecutive bookings
    let foundConsecutive = true;
    while (foundConsecutive) {
      foundConsecutive = false;
      
      for (const booking of activeBookings) {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        // Check if this booking starts on or before next available date
        if (bookingStart <= nextAvailableDate && bookingEnd >= nextAvailableDate) {
          nextAvailableDate = new Date(bookingEnd);
          nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
          nextAvailableDate.setHours(0, 0, 0, 0);
          foundConsecutive = true;
          break;
        }
      }
    }

    return successResponse({
      listingId,
      status: 'booked',
      isAvailable: false,
      availableFrom: nextAvailableDate.toISOString(),
      currentBookingEnds: new Date(currentBooking.endDate).toISOString(),
      reason: 'Currently booked',
    });
  }

  // Check if there's a future booking
  const futureBooking = activeBookings.find(booking => {
    const bookingStart = new Date(booking.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    return bookingStart > today;
  });

  if (futureBooking) {
    return successResponse({
      listingId,
      status: 'available',
      isAvailable: true,
      availableFrom: null,
      nextBookingStarts: new Date(futureBooking.startDate).toISOString(),
      reason: 'Available now (has future booking)',
    });
  }

  // Completely available
  return successResponse({
    listingId,
    status: 'available',
    isAvailable: true,
    availableFrom: null,
    nextBookingStarts: null,
    reason: 'Available',
  });
});
