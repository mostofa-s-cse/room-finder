'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  price?: number;
  city?: string;
  address?: string;
  images: string[];
  roomType: string;
}

interface Favorite {
  id: string;
  listingId: string;
  userId: string;
  createdAt: string;
  listing?: Listing;
}

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!session?.user) {
      setFavorites([]);
      setInitialLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/favorites');
      
      if (response.ok) {
        const favoritesResponse = await response.json();
        const favoritesData = favoritesResponse.data || favoritesResponse;
        setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
      } else {
        console.error('Failed to fetch favorites:', response.status, response.statusText);
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Check if a specific listing is favorited
  const isFavorited = (listingId: string): boolean => {
    return favorites.some(fav => fav.listingId === listingId);
  };

  // Toggle favorite status
  const toggleFavorite = async (listingId: string): Promise<boolean> => {
    if (!session?.user) {
      toast.error('Please sign in to save favorites');
      // Redirect to sign in with return URL
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return false;
    }

    const currentlyFavorited = isFavorited(listingId);
    const method = currentlyFavorited ? 'DELETE' : 'POST';

    try {
      setLoading(true);
      console.log(`Making ${method} request to /api/users/favorites with listingId:`, listingId);
      
      const response = await fetch('/api/users/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      });

      console.log('API Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to update favorites';
        try {
          const error = await response.json();
          console.error('API Error response:', error);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('API Success response:', result);

      // Update local state
      if (currentlyFavorited) {
        // Remove from favorites
        setFavorites(prev => prev.filter(fav => fav.listingId !== listingId));
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const newFavorite: Favorite = {
          id: result.data?.id || Date.now().toString(),
          listingId,
          userId: session.user.id!,
          createdAt: new Date().toISOString(),
          listing: result.data?.listing
        };
        setFavorites(prev => [...prev, newFavorite]);
        toast.success('Added to favorites');
      }

      return !currentlyFavorited;
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites');
      return currentlyFavorited;
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites when session changes
  useEffect(() => {
    fetchFavorites();
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    favorites,
    loading,
    initialLoading,
    isFavorited,
    toggleFavorite,
    refetch: fetchFavorites
  };
}

// Hook specifically for checking if a single listing is favorited
export function useIsFavorited(listingId: string) {
  const { isFavorited, toggleFavorite, loading, initialLoading } = useFavorites();
  
  return {
    isFavorited: isFavorited(listingId),
    toggleFavorite: () => toggleFavorite(listingId),
    loading,
    initialLoading
  };
}