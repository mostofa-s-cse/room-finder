import React, { useEffect } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';


interface SearchAnalyticsWrapperProps {
  children: React.ReactNode;
  searchResults?: unknown[];
  searchQuery?: string;
  appliedFilters?: Record<string, unknown>;
}

export function SearchAnalyticsWrapper({ 
  children, 
  searchResults = [], 
  searchQuery = '',
  appliedFilters = {}
}: SearchAnalyticsWrapperProps) {
  const { trackSearch, trackInteraction } = useAnalyticsTracking();


  // Track search events
  useEffect(() => {
    if (searchQuery) {
      trackSearch(searchQuery, appliedFilters, searchResults.length);
    }
  }, [searchQuery, appliedFilters, searchResults.length, trackSearch]);

  // Track filter interactions
  const trackFilterChange = (filterType: string, filterValue: unknown) => {
    trackInteraction('search_filter', 'change', {
      filterType,
      filterValue: String(filterValue),
      totalFilters: Object.keys(appliedFilters).length,
    });
  };

  // Track search result interactions
  const trackResultClick = (listingId: string, position: number) => {
    trackInteraction('search_result', 'click', {
      listingId,
      position,
      query: searchQuery,
      resultsCount: searchResults.length,
      hasFilters: Object.keys(appliedFilters).length > 0,
    });
  };

  // Track pagination
  const trackPagination = (page: number) => {
    trackInteraction('search_pagination', 'click', {
      page,
      query: searchQuery,
      resultsCount: searchResults.length,
    });
  };

  // Provide context to children
  const contextValue = {
    trackFilterChange,
    trackResultClick,
    trackPagination,
  };

  return (
    <SearchAnalyticsContext.Provider value={contextValue}>
      {children}
    </SearchAnalyticsContext.Provider>
  );
}

// Context for search analytics
const SearchAnalyticsContext = React.createContext<{
  trackFilterChange: (filterType: string, filterValue: unknown) => void;
  trackResultClick: (listingId: string, position: number) => void;
  trackPagination: (page: number) => void;
}>({
  trackFilterChange: () => {},
  trackResultClick: () => {},
  trackPagination: () => {},
});

export const useSearchAnalytics = () => React.useContext(SearchAnalyticsContext);