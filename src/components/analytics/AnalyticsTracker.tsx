import React, { useEffect, useState } from 'react';

interface AnalyticsTrackerProps {
  userId?: string;
  userRole?: 'BACHELOR' | 'LANDLORD' | 'ADMIN';
  listingId?: string;
  children: React.ReactNode;
}

export function AnalyticsTracker({ userId, userRole, listingId, children }: AnalyticsTrackerProps) {
  const [sessionId] = useState(() => generateSessionId());

  // Track page views and user interactions
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'PAGE_VIEW',
            userId,
            userRole,
            listingId,
            sessionId,
            timestamp: new Date().toISOString(),
            metadata: {
              page: window.location.pathname,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [userId, userRole, listingId, sessionId]);

  // Track session duration
  useEffect(() => {
    const startTime = Date.now();

    const trackSessionEnd = async () => {
      const duration = Date.now() - startTime;
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'SESSION_END',
            userId,
            userRole,
            sessionId,
            timestamp: new Date().toISOString(),
            metadata: {
              duration,
              page: window.location.pathname,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to track session end:', error);
      }
    };

    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackSessionEnd();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackSessionEnd();
    };
  }, [userId, userRole, sessionId]);

  return <>{children}</>;
}

// Analytics event tracking functions
export const trackEvent = async (eventType: string, data: Record<string, unknown>) => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Specific tracking functions
export const trackSearch = async (query: string, filters: Record<string, unknown>, userId?: string) => {
  await trackEvent('SEARCH', {
    userId,
    metadata: {
      query,
      filters,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackListingView = async (listingId: string, userId?: string, duration?: number) => {
  await trackEvent('LISTING_VIEW', {
    userId,
    listingId,
    metadata: {
      duration,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackFavorite = async (listingId: string, userId?: string, action: 'ADD' | 'REMOVE' = 'ADD') => {
  await trackEvent('FAVORITE', {
    userId,
    listingId,
    metadata: {
      action,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackInquiry = async (listingId: string, userId?: string, landlordId?: string) => {
  await trackEvent('INQUIRY', {
    userId,
    listingId,
    metadata: {
      landlordId,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackBooking = async (
  listingId: string, 
  userId?: string, 
  amount?: number, 
  paymentMethod?: string
) => {
  await trackEvent('BOOKING', {
    userId,
    listingId,
    metadata: {
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackPayment = async (
  bookingId: string,
  amount: number,
  paymentMethod: string,
  userId?: string,
  status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'SUCCESS'
) => {
  await trackEvent('PAYMENT', {
    userId,
    metadata: {
      bookingId,
      amount,
      paymentMethod,
      status,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackListingCreate = async (listingId: string, userId?: string, listingData?: Record<string, unknown>) => {
  await trackEvent('LISTING_CREATE', {
    userId,
    listingId,
    metadata: {
      ...listingData,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackListingUpdate = async (listingId: string, userId?: string, changes?: Record<string, unknown>) => {
  await trackEvent('LISTING_UPDATE', {
    userId,
    listingId,
    metadata: {
      changes,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackUserRegistration = async (userId: string, userRole: string, registrationMethod?: string) => {
  await trackEvent('USER_REGISTRATION', {
    userId,
    metadata: {
      userRole,
      registrationMethod,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackUserLogin = async (userId: string, loginMethod?: string) => {
  await trackEvent('USER_LOGIN', {
    userId,
    metadata: {
      loginMethod,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackFilterChange = async (filters: Record<string, unknown>, userId?: string) => {
  await trackEvent('FILTER_CHANGE', {
    userId,
    metadata: {
      filters,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackSortChange = async (sortBy: string, sortOrder: string, userId?: string) => {
  await trackEvent('SORT_CHANGE', {
    userId,
    metadata: {
      sortBy,
      sortOrder,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackError = async (error: string, context: string, userId?: string) => {
  await trackEvent('ERROR', {
    userId,
    metadata: {
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
  });
};

// Helper function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// React Hook for analytics
export function useAnalytics(userId?: string, userRole?: 'BACHELOR' | 'LANDLORD' | 'ADMIN') {
  const [sessionId] = useState(() => generateSessionId());

  const track = (eventType: string, data: Record<string, unknown> = {}) => {
    trackEvent(eventType, {
      userId,
      userRole,
      sessionId,
      ...data,
    });
  };

  return {
    track,
    trackSearch: (query: string, filters: Record<string, unknown>) => 
      trackSearch(query, filters, userId),
    trackListingView: (listingId: string, duration?: number) => 
      trackListingView(listingId, userId, duration),
    trackFavorite: (listingId: string, action: 'ADD' | 'REMOVE' = 'ADD') => 
      trackFavorite(listingId, userId, action),
    trackInquiry: (listingId: string, landlordId?: string) => 
      trackInquiry(listingId, userId, landlordId),
    trackBooking: (listingId: string, amount?: number, paymentMethod?: string) => 
      trackBooking(listingId, userId, amount, paymentMethod),
    trackPayment: (bookingId: string, amount: number, paymentMethod: string, status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'SUCCESS') => 
      trackPayment(bookingId, amount, paymentMethod, userId, status),
    trackError: (error: string, context: string) => 
      trackError(error, context, userId),
  };
}