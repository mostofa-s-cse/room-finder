import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export interface BookingConflictCheck {
  listingId: string;
  startDate: Date;
  endDate: Date;
  excludeBookingId?: string; // For updates, exclude the current booking
  excludeUserId?: string; // For checking conflicts excluding specific user
}

export interface BookingConflict {
  id: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  user: {
    name: string;
  };
}

/**
 * Check for booking conflicts with overlapping date ranges
 */
export async function checkBookingConflicts({
  listingId,
  startDate,
  endDate,
  excludeBookingId,
  excludeUserId,
}: BookingConflictCheck): Promise<BookingConflict[]> {
  // Validate date range
  if (startDate >= endDate) {
    throw new Error('End date must be after start date');
  }

  const conflicts = await prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID],
      },
      // Exclude specific booking (for updates)
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      // Exclude specific user (for checking other users' conflicts)
      ...(excludeUserId && { userId: { not: excludeUserId } }),
      // Date overlap conditions
      OR: [
        // New booking starts during an existing booking
        {
          startDate: { lte: startDate },
          endDate: { gt: startDate },
        },
        // New booking ends during an existing booking
        {
          startDate: { lt: endDate },
          endDate: { gte: endDate },
        },
        // New booking completely contains an existing booking
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
        // Existing booking completely contains the new booking
        {
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  return conflicts;
}

/**
 * Check if a user already has an active booking for a listing
 */
export async function checkUserActiveBooking(
  listingId: string,
  userId: string,
  excludeBookingId?: string
): Promise<boolean> {
  const existingBooking = await prisma.booking.findFirst({
    where: {
      listingId,
      userId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID],
      },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
    },
  });

  return !!existingBooking;
}

/**
 * Get available date ranges for a listing
 */
export async function getAvailableDateRanges(
  listingId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<{ start: Date; end: Date }[]> {
  const today = new Date();
  const searchStart = fromDate || today;
  const searchEnd = toDate || new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  // Get all confirmed bookings for the listing in the date range
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PAID],
      },
      OR: [
        {
          startDate: { gte: searchStart, lte: searchEnd },
        },
        {
          endDate: { gte: searchStart, lte: searchEnd },
        },
        {
          startDate: { lte: searchStart },
          endDate: { gte: searchEnd },
        },
      ],
    },
    select: {
      startDate: true,
      endDate: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Calculate available ranges between bookings
  const availableRanges: { start: Date; end: Date }[] = [];
  let currentStart = searchStart;

  for (const booking of bookings) {
    // If there's a gap before this booking, add it as available
    if (currentStart < booking.startDate) {
      availableRanges.push({
        start: new Date(currentStart),
        end: new Date(booking.startDate),
      });
    }
    
    // Move the current start to after this booking
    currentStart = new Date(Math.max(currentStart.getTime(), booking.endDate.getTime()));
  }

  // Add remaining time after all bookings
  if (currentStart < searchEnd) {
    availableRanges.push({
      start: new Date(currentStart),
      end: new Date(searchEnd),
    });
  }

  return availableRanges;
}

/**
 * Validate booking dates
 */
export function validateBookingDates(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
  const now = new Date();
  // Set yesterday at end of day to allow booking for today
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

  if (startDate >= endDate) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  if (startDate <= yesterday) {
    return {
      isValid: false,
      error: 'Start date cannot be in the past',
    };
  }

  // Minimum booking duration (1 day)
  const minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  if (endDate.getTime() - startDate.getTime() < minDuration) {
    return {
      isValid: false,
      error: 'Minimum booking duration is 1 day',
    };
  }

  // Maximum booking duration (1 year)
  const maxDuration = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
  if (endDate.getTime() - startDate.getTime() > maxDuration) {
    return {
      isValid: false,
      error: 'Maximum booking duration is 1 year',
    };
  }

  return { isValid: true };
}

/**
 * Calculate booking duration in days
 */
export function calculateBookingDuration(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}