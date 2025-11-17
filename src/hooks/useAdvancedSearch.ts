import { useState, useCallback, useEffect } from 'react';
import { SearchFilters, SearchResult, SearchSuggestion, SearchSortOption } from '@/lib/search/types';

export function useAdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    city: '',
    amenities: [],
    sortBy: SearchSortOption.RELEVANCE,
    sortOrder: 'DESC',
    page: 1,
    limit: 20
  });

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  const performSearch = useCallback(async (searchFilters?: SearchFilters) => {
    const filtersToUse = searchFilters || filters;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filtersToUse),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const getSearchSuggestions = useCallback(async (query: string, type: 'location' | 'amenity' | 'all' = 'all') => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      location: '',
      city: '',
      amenities: [],
      sortBy: SearchSortOption.RELEVANCE,
      sortOrder: 'DESC',
      page: 1,
      limit: 20
    });
    setSearchResult(null);
  }, []);

  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  const changeSorting = useCallback((sortBy: SearchSortOption, sortOrder: 'ASC' | 'DESC' = 'DESC') => {
    updateFilters({ sortBy, sortOrder, page: 1 });
  }, [updateFilters]);

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.location || filters.city || (filters.amenities && filters.amenities.length > 0)) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, performSearch]);

  return {
    filters,
    searchResult,
    isLoading,
    error,
    suggestions,
    performSearch,
    getSearchSuggestions,
    updateFilters,
    resetFilters,
    goToPage,
    changeSorting
  };
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedSearches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSearch = useCallback(async (name: string, filters: SearchFilters) => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, filters }),
      });

      if (response.ok) {
        await loadSavedSearches(); // Reload the list
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save search:', err);
      return false;
    }
  }, [loadSavedSearches]);

  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  return {
    savedSearches,
    isLoading,
    saveSearch,
    loadSavedSearches
  };
}