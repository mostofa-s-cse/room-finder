import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { 
  checkBookingConflicts, 
  getAvailableDateRanges, 
  validateBookingDates 
} from '@/lib/bookings/conflict-checker';
import { z } from 'zod';

const availabilitySchema = z.object({
  listingId: z.string().min(1),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

// GET /api/bookings/availability?listingId=xxx&startDate=xxx&endDate=xxx
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // Note: This endpoint is public to allow checking availability from listing cards
  // For user-specific exclusions, we would need authentication, but for public availability
  // we just check all confirmed bookings
  
  const listingId = searchParams.get('listingId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  
  if (!listingId) {
    return successResponse({ error: 'listingId is required' }, 400);
  }

  // If date range provided, check availability for those dates
  if (startDateStr && endDateStr) {
    const { startDate, endDate } = availabilitySchema.parse({
      listingId,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    // Validate date range
    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.isValid) {
      return successResponse({ 
        available: false, 
        error: dateValidation.error,
        conflicts: []
      });
    }

    // Check for conflicts
    const conflicts = await checkBookingConflicts({
      listingId,
      startDate,
      endDate,
      // Don't exclude any user for public availability checks
      // This shows all confirmed bookings
    });

    return successResponse({
      available: conflicts.length === 0,
      conflicts: conflicts.map(c => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        bookedBy: c.user.name,
      })),
    });
  }

  // If no date range provided, get general availability ranges
  const availableRanges = await getAvailableDateRanges(listingId);
  
  return successResponse({
    availableRanges: availableRanges.map(range => ({
      start: range.start,
      end: range.end,
    })),
  });
});