import { useEffect, useRef, useCallback } from 'react';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { 
  ActionType
} from '@/lib/analytics/types';

interface UseAnalyticsTrackingOptions {
  enablePageViews?: boolean;
  enableUserInteractions?: boolean;
  enablePerformanceTracking?: boolean;
  debounceTime?: number;
}

export function useAnalyticsTracking(options: UseAnalyticsTrackingOptions = {}) {
  const {
    enablePageViews = true,
    enableUserInteractions = true,
    enablePerformanceTracking = true,
    debounceTime = 1000
  } = options;

  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sessionStartTime = useRef<number>(0);
  const pageLoadTime = useRef<number>(0);

  // Track page view
  const trackPageView = useCallback((pagePath: string, pageTitle?: string) => {
    if (!enablePageViews) return;

    const actionData = {
      sessionId: getSessionId(),
      type: ActionType.PAGE_VIEW,
      target: pagePath,
      page: pagePath,
      metadata: {
        title: pageTitle || document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        loadTime: Date.now() - pageLoadTime.current,
      },
    };

    analyticsService.trackUserAction(actionData);
  }, [enablePageViews]);

  // Track user interaction
  const trackInteraction = useCallback((
    element: string,
    action: string,
    properties?: Record<string, string | number | boolean>
  ) => {
    if (!enableUserInteractions) return;

    const key = `${element}-${action}`;
    
    // Debounce rapid interactions
    if (debounceTimers.current.has(key)) {
      clearTimeout(debounceTimers.current.get(key)!);
    }

    const timer = setTimeout(() => {
      const actionData = {
        sessionId: getSessionId(),
        type: ActionType.FILTER_APPLIED, // Generic interaction type
        target: element,
        page: window.location.pathname,
        metadata: {
          action,
          ...properties,
          sessionDuration: Date.now() - sessionStartTime.current,
        },
      };

      analyticsService.trackUserAction(actionData);
      debounceTimers.current.delete(key);
    }, debounceTime);

    debounceTimers.current.set(key, timer);
  }, [enableUserInteractions, debounceTime]);

  // Track search event
  const trackSearch = (query: string, filters?: Record<string, unknown>, results?: number) => {
    const actionData = {
      sessionId: getSessionId(),
      type: ActionType.SEARCH,
      target: query.trim(),
      page: window.location.pathname,
      metadata: {
        query: query.trim(),
        filters: filters || {},
        resultsCount: results || 0,
        queryLength: query.length,
        hasFilters: Boolean(filters && Object.keys(filters).length > 0),
      },
    };

    analyticsService.trackUserAction(actionData);
  };

  // Track listing view
  const trackListingView = (listingId: string, viewDuration?: number) => {
    const actionData = {
      sessionId: getSessionId(),
      type: ActionType.LISTING_VIEW,
      target: listingId,
      page: window.location.pathname,
      duration: viewDuration,
      metadata: {
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        scrollDepth: getScrollDepth(),
      },
    };

    analyticsService.trackUserAction(actionData);
  };

  // Track performance metrics
  const trackPerformance = useCallback(() => {
    if (!enablePerformanceTracking || !window.performance) return;

    try {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const actionData = {
          sessionId: getSessionId(),
          type: ActionType.PAGE_VIEW,
          target: 'performance_metrics',
          page: window.location.pathname,
          metadata: {
            pageLoadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstContentfulPaint: getFirstContentfulPaint(),
            timeToInteractive: perfData.loadEventEnd - perfData.loadEventStart,
          },
        };

        analyticsService.trackUserAction(actionData);
      }
    } catch (error) {
      console.warn('Performance tracking failed:', error);
    }
  }, [enablePerformanceTracking]);

  // Initialize timestamps and auto-track page views on mount
  useEffect(() => {
    // Initialize timestamps
    sessionStartTime.current = Date.now();
    pageLoadTime.current = Date.now();
    
    trackPageView(window.location.pathname);
    
    if (enablePerformanceTracking) {
      // Wait for page load to complete
      if (document.readyState === 'complete') {
        trackPerformance();
      } else {
        window.addEventListener('load', trackPerformance);
        return () => window.removeEventListener('load', trackPerformance);
      }
    }
  }, [enablePerformanceTracking, trackPageView, trackPerformance]);

  // Track scroll depth for engagement
  useEffect(() => {
    if (!enableUserInteractions) return;

    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollDepth = getScrollDepth();
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track scroll milestones
        if (scrollDepth >= 0.25 && scrollDepth < 0.5) {
          trackInteraction('page', 'scroll_25');
        } else if (scrollDepth >= 0.5 && scrollDepth < 0.75) {
          trackInteraction('page', 'scroll_50');
        } else if (scrollDepth >= 0.75 && scrollDepth < 0.9) {
          trackInteraction('page', 'scroll_75');
        } else if (scrollDepth >= 0.9) {
          trackInteraction('page', 'scroll_90');
        }
      }
    };

    const throttledTrackScroll = throttle(trackScroll, 500);
    window.addEventListener('scroll', throttledTrackScroll);
    
    return () => window.removeEventListener('scroll', throttledTrackScroll);
  }, [enableUserInteractions, trackInteraction]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return {
    trackPageView,
    trackInteraction,
    trackSearch,
    trackListingView,
    trackPerformance,
  };
}

// Helper functions
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

function getScrollDepth(): number {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  return documentHeight > 0 ? scrollTop / documentHeight : 0;
}

function getFirstContentfulPaint(): number {
  try {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  } catch {
    return 0;
  }
}

function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}