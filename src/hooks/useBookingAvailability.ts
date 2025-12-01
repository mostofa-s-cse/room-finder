import { useState, useCallback } from 'react';
import { BookingStatus } from '@prisma/client';

interface BookingConflict {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  bookedBy: string;
}

interface AvailabilityData {
  available: boolean;
  conflicts?: BookingConflict[];
  error?: string;
}

interface AvailableRange {
  start: string;
  end: string;
}

interface AvailabilityRanges {
  availableRanges: AvailableRange[];
}

interface UseBookingAvailabilityReturn {
  checkAvailability: (listingId: string, startDate: Date, endDate: Date) => Promise<AvailabilityData>;
  getAvailableRanges: (listingId: string) => Promise<AvailableRange[]>;
  isLoading: boolean;
  error: string | null;
}

export function useBookingAvailability(): UseBookingAvailabilityReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (
    listingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityData> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        listingId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/bookings/availability?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check availability');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      return {
        available: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAvailableRanges = useCallback(async (
    listingId: string
  ): Promise<AvailableRange[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ listingId });
      const response = await fetch(`/api/bookings/availability?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get available ranges');
      }

      return (data.data as AvailabilityRanges).availableRanges;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get available ranges';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    checkAvailability,
    getAvailableRanges,
    isLoading,
    error,
  };
}

// Utility functions for date validation and formatting
export function validateBookingDates(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
  // Create yesterday at end of day for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  if (startDate >= endDate) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  if (startDate < yesterday) {
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

export function calculateBookingDuration(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const start = startDate.toLocaleDateString('en-US', options);
  const end = endDate.toLocaleDateString('en-US', options);
  
  return `${start} - ${end}`;
}

export function isDateRangeOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}