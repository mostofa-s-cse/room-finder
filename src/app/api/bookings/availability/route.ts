import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, requireAuth } from '@/lib/api-utils';
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
  const session = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  
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
      excludeUserId: session.user.id,
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