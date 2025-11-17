import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  landlordId: string;
  landlord: {
    id: string;
    name: string;
    phone?: string;
    email: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ListingsState {
  listings: Listing[];
  featuredListings: Listing[];
  currentListing: Listing | null;
  searchResults: Listing[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: {
    location?: string;
    minRent?: number;
    maxRent?: number;
    roomType?: string;
    amenities?: string[];
  };
}

const initialState: ListingsState = {
  listings: [],
  featuredListings: [],
  currentListing: null,
  searchResults: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  filters: {},
};

export const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings: (state, action: PayloadAction<Listing[]>) => {
      state.listings = action.payload;
      state.error = null;
    },
    setFeaturedListings: (state, action: PayloadAction<Listing[]>) => {
      state.featuredListings = action.payload;
    },
    setCurrentListing: (state, action: PayloadAction<Listing | null>) => {
      state.currentListing = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<Listing[]>) => {
      state.searchResults = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ totalPages: number; currentPage: number }>) => {
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
    },
    setFilters: (state, action: PayloadAction<Partial<ListingsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setListings,
  setFeaturedListings,
  setCurrentListing,
  setSearchResults,
  setLoading,
  setError,
  setPagination,
  setFilters,
  clearFilters,
} = listingsSlice.actions;