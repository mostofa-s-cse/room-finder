import React, { ComponentType, useEffect, useCallback } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

interface WithAnalyticsProps {
  trackPageView?: boolean;
  trackInteractions?: boolean;
  trackPerformance?: boolean;
  pageName?: string;
}

export function withAnalytics<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAnalyticsProps = {}
) {
  const {
    trackPageView = true,
    trackInteractions = true,
    trackPerformance = true,
    pageName
  } = options;

  const WithAnalyticsComponent = (props: P) => {
    const { trackPageView: trackPage, trackInteraction } = useAnalyticsTracking({
      enablePageViews: trackPageView,
      enableUserInteractions: trackInteractions,
      enablePerformanceTracking: trackPerformance,
    });

    useEffect(() => {
      if (trackPageView && pageName) {
        trackPage(window.location.pathname, pageName);
      }
    }, [trackPage]);

    // Add click tracking to all buttons and links
    useEffect(() => {
      if (!trackInteractions) return;

      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
          const elementText = target.textContent?.trim() || '';
          const elementId = target.id || '';
          const elementClass = target.className || '';
          
          trackInteraction(target.tagName.toLowerCase(), 'click', {
            text: elementText.substring(0, 50), // Limit text length
            id: elementId,
            className: elementClass,
            ...(target.tagName === 'A' && { href: (target as HTMLAnchorElement).href }),
          });
        }
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }, [trackInteraction]);

    return <WrappedComponent {...props} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAnalyticsComponent;
}

// Utility components for specific tracking
export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { trackInteraction } = useAnalyticsTracking();

  // Global error tracking
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackInteraction('error', 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackInteraction('error', 'unhandled_promise_rejection', {
        reason: event.reason?.toString() || 'Unknown error',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackInteraction]);

  return <>{children}</>;
};

// Component for tracking specific interactions
interface AnalyticsTrackerProps {
  event: string;
  element: string;
  properties?: Record<string, string | number | boolean>;
  children: React.ReactNode;
  trigger?: 'click' | 'hover' | 'focus' | 'view';
}

export const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({
  event,
  element,
  properties,
  children,
  trigger = 'click',
}) => {
  const { trackInteraction } = useAnalyticsTracking();

  const handleInteraction = useCallback(() => {
    trackInteraction(element, event, properties);
  }, [trackInteraction, element, event, properties]);

  const triggerProps = {
    [trigger === 'click' ? 'onClick' : 
     trigger === 'hover' ? 'onMouseEnter' : 
     trigger === 'focus' ? 'onFocus' : 'onClick']: handleInteraction,
  };

  // For view trigger, use intersection observer
  useEffect(() => {
    if (trigger !== 'view') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleInteraction();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.querySelector(`[data-analytics="${event}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [trigger, event, handleInteraction]);

  return (
    <div 
      {...(trigger === 'view' ? { 'data-analytics': event } : triggerProps)}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
};