import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Listing } from '@prisma/client';

export interface ListingsState {
  listings: Listing[];
  currentListing: Listing | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchResults: {
    listings: Listing[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
  };
}

const initialState: ListingsState = {
  listings: [],
  currentListing: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  searchResults: {
    listings: [],
    loading: false,
    error: null,
    hasMore: true,
  },
};

export const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings: (state, action: PayloadAction<Listing[]>) => {
      state.listings = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentListing: (state, action: PayloadAction<Listing | null>) => {
      state.currentListing = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setPagination: (state, action: PayloadAction<Partial<ListingsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addListing: (state, action: PayloadAction<Listing>) => {
      state.listings.unshift(action.payload);
    },
    updateListing: (state, action: PayloadAction<Listing>) => {
      const index = state.listings.findIndex(listing => listing.id === action.payload.id);
      if (index !== -1) {
        state.listings[index] = action.payload;
      }
      if (state.currentListing?.id === action.payload.id) {
        state.currentListing = action.payload;
      }
    },
    removeListing: (state, action: PayloadAction<string>) => {
      state.listings = state.listings.filter(listing => listing.id !== action.payload);
      if (state.currentListing?.id === action.payload) {
        state.currentListing = null;
      }
    },
    setSearchResults: (state, action: PayloadAction<Listing[]>) => {
      state.searchResults.listings = action.payload;
      state.searchResults.loading = false;
      state.searchResults.error = null;
    },
    appendSearchResults: (state, action: PayloadAction<Listing[]>) => {
      state.searchResults.listings.push(...action.payload);
      state.searchResults.hasMore = action.payload.length === state.pagination.limit;
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchResults.loading = action.payload;
    },
    setSearchError: (state, action: PayloadAction<string | null>) => {
      state.searchResults.error = action.payload;
      state.searchResults.loading = false;
    },
    clearSearchResults: (state) => {
      state.searchResults = {
        listings: [],
        loading: false,
        error: null,
        hasMore: true,
      };
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      // This will be implemented when we add favorites functionality
      const listingId = action.payload;
      // For now, just log the action
      console.log('Toggle favorite for listing:', listingId);
    },
  },
});

export const {
  setListings,
  setCurrentListing,
  setLoading,
  setError,
  setPagination,
  addListing,
  updateListing,
  removeListing,
  setSearchResults,
  appendSearchResults,
  setSearchLoading,
  setSearchError,
  clearSearchResults,
  toggleFavorite,
} = listingsSlice.actions;