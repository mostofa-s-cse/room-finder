import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ApiErrorClass, withErrorHandling } from '@/lib/api-utils';
import { BookingStatus } from '@prisma/client';

export interface ListingAvailabilityStatus {
  listingId: string;
  status: 'available' | 'booked' | 'unavailable';
  isAvailable: boolean;
  availableFrom: string | null;
  reason: string;
}

// GET /api/listings/availability?ids=id1,id2,id3 or POST with body { listingIds: [...] }
// Returns availability status for multiple listings in one call
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    throw new ApiErrorClass('Listing IDs are required (comma-separated)', 'MISSING_IDS', 400);
  }

  const listingIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);

  if (listingIds.length === 0) {
    throw new ApiErrorClass('At least one listing ID is required', 'MISSING_IDS', 400);
  }

  if (listingIds.length > 50) {
    throw new ApiErrorClass('Maximum 50 listings can be checked at once', 'TOO_MANY_IDS', 400);
  }

  const availabilityData = await getListingsAvailability(listingIds);
  return successResponse(availabilityData);
});

// POST /api/listings/availability - For bulk availability check
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { listingIds } = body;

  if (!Array.isArray(listingIds) || listingIds.length === 0) {
    throw new ApiErrorClass('listingIds array is required', 'MISSING_IDS', 400);
  }

  if (listingIds.length > 50) {
    throw new ApiErrorClass('Maximum 50 listings can be checked at once', 'TOO_MANY_IDS', 400);
  }

  const availabilityData = await getListingsAvailability(listingIds);
  return successResponse(availabilityData);
});

// Helper function to check availability for multiple listings
async function getListingsAvailability(listingIds: string[]): Promise<Record<string, ListingAvailabilityStatus>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all listings with their booking information
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: listingIds }
    },
    select: {
      id: true,
      status: true,
      isPublished: true,
      availableFrom: true,
      bookings: {
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID]
          },
          endDate: {
            gte: today
          }
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true
        },
        orderBy: {
          startDate: 'asc'
        }
      }
    }
  });

  const result: Record<string, ListingAvailabilityStatus> = {};

  for (const listing of listings) {
    const availability = calculateListingAvailability(listing, today);
    result[listing.id] = availability;
  }

  // For any listing IDs not found, mark as unavailable
  for (const id of listingIds) {
    if (!result[id]) {
      result[id] = {
        listingId: id,
        status: 'unavailable',
        isAvailable: false,
        availableFrom: null,
        reason: 'Listing not found'
      };
    }
  }

  return result;
}

interface ListingWithBookings {
  id: string;
  status: string;
  isPublished: boolean;
  availableFrom: Date | null;
  bookings: {
    id: string;
    startDate: Date;
    endDate: Date;
    status: BookingStatus;
  }[];
}

function calculateListingAvailability(
  listing: ListingWithBookings,
  today: Date
): ListingAvailabilityStatus {
  // Check if listing is published and active
  if (!listing.isPublished) {
    return {
      listingId: listing.id,
      status: 'unavailable',
      isAvailable: false,
      availableFrom: null,
      reason: 'Listing is not published'
    };
  }

  // Check listing's availableFrom date
  if (listing.availableFrom) {
    const availableFromDate = new Date(listing.availableFrom);
    availableFromDate.setHours(0, 0, 0, 0);
    
    if (availableFromDate > today) {
      return {
        listingId: listing.id,
        status: 'unavailable',
        isAvailable: false,
        availableFrom: availableFromDate.toISOString(),
        reason: 'Not yet available'
      };
    }
  }

  // Check for current bookings
  let isCurrentlyBooked = false;
  let currentBookingEndDate: Date | null = null;

  for (const booking of listing.bookings) {
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
    let finalAvailableDate = new Date(currentBookingEndDate);
    finalAvailableDate.setDate(finalAvailableDate.getDate() + 1);
    finalAvailableDate.setHours(0, 0, 0, 0);

    // Handle consecutive bookings
    let foundConsecutive = true;
    while (foundConsecutive) {
      foundConsecutive = false;
      for (const booking of listing.bookings) {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);

        if (bookingStart <= finalAvailableDate && bookingEnd >= finalAvailableDate) {
          finalAvailableDate = new Date(bookingEnd);
          finalAvailableDate.setDate(finalAvailableDate.getDate() + 1);
          foundConsecutive = true;
          break;
        }
      }
    }

    return {
      listingId: listing.id,
      status: 'booked',
      isAvailable: false,
      availableFrom: finalAvailableDate.toISOString(),
      reason: 'Currently booked'
    };
  }

  // Check for future bookings (but available now)
  const futureBookings = listing.bookings.filter(b => {
    const bookingStart = new Date(b.startDate);
    bookingStart.setHours(0, 0, 0, 0);
    return bookingStart > today;
  });

  if (futureBookings.length > 0) {
    return {
      listingId: listing.id,
      status: 'available',
      isAvailable: true,
      availableFrom: null,
      reason: 'Available now (has future bookings)'
    };
  }

  // Fully available
  return {
    listingId: listing.id,
    status: 'available',
    isAvailable: true,
    availableFrom: null,
    reason: 'Available'
  };
}

