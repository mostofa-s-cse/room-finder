'use client';

import { useState, useCallback } from 'react';
import { RecommendationResult, UserPreferences } from '@/lib/recommendations/types';
import { MapLocation } from '@/lib/maps/types';

interface UseRecommendationsOptions {
  workLocation?: MapLocation & { address: string };
  preferredAmenities?: string[];
  preferredRoomTypes?: ('SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT')[];
  maxDistance?: number;
  maxResults?: number;
  budgetFlexibility?: number;
  priorityWeights?: {
    budget: number;
    distance: number;
    amenities: number;
    rating: number;
  };
}

interface RecommendationsState {
  recommendations: RecommendationResult[];
  loading: boolean;
  error: string | null;
  meta?: {
    totalListings: number;
    recommendationsCount: number;
    averageScore: number;
  };
}

interface QuickRecommendation {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  roomType: string;
  amenities: string[];
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  landlord: {
    id: string;
    name: string;
  };
  distance?: number;
  budgetFit: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  matchPercentage: number;
}

export function useRecommendations() {
  const [state, setState] = useState<RecommendationsState>({
    recommendations: [],
    loading: false,
    error: null
  });

  const [quickState, setQuickState] = useState<{
    recommendations: QuickRecommendation[];
    loading: boolean;
    error: string | null;
    meta?: {
      hasWorkLocation: boolean;
      userBudget?: number;
      totalResults: number;
    };
  }>({
    recommendations: [],
    loading: false,
    error: null
  });

  const generateRecommendations = useCallback(async (options: UseRecommendationsOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'PROFILE_INCOMPLETE') {
          throw new Error(data.error || 'Profile incomplete for recommendations');
        }
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      setState({
        recommendations: data.data.recommendations,
        loading: false,
        error: null,
        meta: data.data.meta
      });

      return data.data.recommendations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recommendations';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const getQuickRecommendations = useCallback(async (options: {
    limit?: number;
    workLocation?: MapLocation & { address: string };
  } = {}) => {
    setQuickState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      
      if (options.limit) {
        params.append('limit', options.limit.toString());
      }
      
      if (options.workLocation) {
        params.append('workLat', options.workLocation.lat.toString());
        params.append('workLng', options.workLocation.lng.toString());
        params.append('workAddress', options.workLocation.address);
      }

      const response = await fetch(`/api/recommendations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations');
      }

      setQuickState({
        recommendations: data.data.recommendations,
        loading: false,
        error: null,
        meta: data.data.meta
      });

      return data.data.recommendations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get recommendations';
      setQuickState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const clearRecommendations = useCallback(() => {
    setState({
      recommendations: [],
      loading: false,
      error: null
    });
  }, []);

  const clearQuickRecommendations = useCallback(() => {
    setQuickState({
      recommendations: [],
      loading: false,
      error: null
    });
  }, []);

  return {
    // Full recommendations
    recommendations: state.recommendations,
    loading: state.loading,
    error: state.error,
    meta: state.meta,
    generateRecommendations,
    clearRecommendations,
    
    // Quick recommendations
    quickRecommendations: quickState.recommendations,
    quickLoading: quickState.loading,
    quickError: quickState.error,
    quickMeta: quickState.meta,
    getQuickRecommendations,
    clearQuickRecommendations
  };
}

export function useRecommendationPreferences() {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const savePreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you might save preferences to user profile
      // For now, just store in localStorage
      localStorage.setItem('recommendationPreferences', JSON.stringify(preferences));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  const loadPreferences = useCallback(() => {
    try {
      const saved = localStorage.getItem('recommendationPreferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load saved preferences:', err);
    }
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({});
    localStorage.removeItem('recommendationPreferences');
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    savePreferences,
    loadPreferences,
    resetPreferences
  };
}