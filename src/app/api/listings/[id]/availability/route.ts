import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ApiErrorClass, withErrorHandling } from '@/lib/api-utils';

type RouteContext = { params: Record<string, string> } | { params: Promise<Record<string, string>> } | undefined;

// GET /api/listings/[id]/availability - Check listing availability
export const GET = withErrorHandling(async (request: NextRequest, context?: RouteContext) => {
  if (!context || !context.params) {
    throw new ApiErrorClass('Invalid route context', 'INVALID_CONTEXT', 400);
  }

  // Handle both sync and async params
  const params = await Promise.resolve(context.params);
  const { id } = params;

  if (!id) {
    throw new ApiErrorClass('Listing ID is required', 'MISSING_LISTING_ID', 400);
  }

  // Get listing with current bookings
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      availableFrom: true,
      isPublished: true,
      bookings: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          // Only get future bookings or current ones
          OR: [
            {
              startDate: {
                gte: new Date()
              }
            },
            {
              AND: [
                {
                  startDate: {
                    lte: new Date()
                  }
                },
                {
                  endDate: {
                    gte: new Date()
                  }
                }
              ]
            }
          ]
        },
        select: {
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

  if (!listing) {
    throw new ApiErrorClass('Listing not found', 'LISTING_NOT_FOUND', 404);
  }

  if (!listing.isPublished) {
    throw new ApiErrorClass('Listing is not published', 'LISTING_NOT_PUBLISHED', 404);
  }

  // Calculate real availability
  const now = new Date();
  const availableFromDate = listing.availableFrom ? new Date(listing.availableFrom) : new Date();
  
  // Check if listing is available by date
  const isAvailableByDate = availableFromDate <= now;
  
  // Check if there are any conflicting bookings
  const hasConflictingBookings = listing.bookings.length > 0;
  
  // Check if listing is marked as available (status should be APPROVED or ACTIVE)
  const isListingActive = listing.status === 'APPROVED' || listing.status === 'ACTIVE';
  
  // Determine final availability
  const isCurrentlyAvailable = isListingActive && isAvailableByDate && !hasConflictingBookings;
  
  // Get next available date if currently unavailable
  let nextAvailableDate = listing.availableFrom ? listing.availableFrom.toISOString() : new Date().toISOString();
  if (hasConflictingBookings) {
    // Find the latest end date from active bookings
    const latestBooking = listing.bookings[listing.bookings.length - 1];
    if (latestBooking) {
      nextAvailableDate = latestBooking.endDate.toISOString();
    }
  }

  const availabilityData = {
    isAvailable: isCurrentlyAvailable,
    availableFrom: nextAvailableDate,
    reason: !isListingActive 
      ? 'Listing is pending approval or inactive'
      : !isAvailableByDate
      ? 'Not yet available'
      : hasConflictingBookings
      ? 'Currently booked'
      : 'Available',
    bookings: listing.bookings.map((booking) => ({
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status
    }))
  };

  return successResponse(availabilityData);
});