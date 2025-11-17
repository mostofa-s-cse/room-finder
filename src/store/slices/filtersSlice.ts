import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RoomType, TransportMode } from '@prisma/client';

export interface FilterState {
  search: {
    city: string;
    maxPrice: number | null;
    minPrice: number | null;
    roomType: RoomType | null;
    amenities: string[];
    maxDistance: number | null;
    minRating: number | null;
    sortBy: 'price' | 'rating' | 'distance' | 'newest';
    sortOrder: 'asc' | 'desc';
    userLocation: {
      lat: number | null;
      lng: number | null;
      address: string;
    };
  };
  recommendations: {
    maxBudgetPercentage: number;
    prioritizeDistance: boolean;
    prioritizeRating: boolean;
    transportMode: TransportMode | null;
  };
  map: {
    bounds: {
      north: number | null;
      south: number | null;
      east: number | null;
      west: number | null;
    };
    zoom: number;
    center: {
      lat: number;
      lng: number;
    };
    showHeatmap: boolean;
    priceRange: {
      min: number;
      max: number;
    };
  };
}

const initialState: FilterState = {
  search: {
    city: '',
    maxPrice: null,
    minPrice: null,
    roomType: null,
    amenities: [],
    maxDistance: null,
    minRating: null,
    sortBy: 'newest',
    sortOrder: 'desc',
    userLocation: {
      lat: null,
      lng: null,
      address: '',
    },
  },
  recommendations: {
    maxBudgetPercentage: 30,
    prioritizeDistance: true,
    prioritizeRating: true,
    transportMode: null,
  },
  map: {
    bounds: {
      north: null,
      south: null,
      east: null,
      west: null,
    },
    zoom: 12,
    center: {
      lat: 23.8103, // Dhaka default
      lng: 90.4125,
    },
    showHeatmap: false,
    priceRange: {
      min: 0,
      max: 50000,
    },
  },
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Search filters
    setCity: (state, action: PayloadAction<string>) => {
      state.search.city = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<{ min: number | null; max: number | null }>) => {
      state.search.minPrice = action.payload.min;
      state.search.maxPrice = action.payload.max;
    },
    setRoomType: (state, action: PayloadAction<RoomType | null>) => {
      state.search.roomType = action.payload;
    },
    setAmenities: (state, action: PayloadAction<string[]>) => {
      state.search.amenities = action.payload;
    },
    toggleAmenity: (state, action: PayloadAction<string>) => {
      const amenity = action.payload;
      const index = state.search.amenities.indexOf(amenity);
      if (index === -1) {
        state.search.amenities.push(amenity);
      } else {
        state.search.amenities.splice(index, 1);
      }
    },
    setMaxDistance: (state, action: PayloadAction<number | null>) => {
      state.search.maxDistance = action.payload;
    },
    setMinRating: (state, action: PayloadAction<number | null>) => {
      state.search.minRating = action.payload;
    },
    setSortBy: (state, action: PayloadAction<FilterState['search']['sortBy']>) => {
      state.search.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<FilterState['search']['sortOrder']>) => {
      state.search.sortOrder = action.payload;
    },
    setUserLocation: (state, action: PayloadAction<FilterState['search']['userLocation']>) => {
      state.search.userLocation = action.payload;
    },
    
    // Recommendation filters
    setMaxBudgetPercentage: (state, action: PayloadAction<number>) => {
      state.recommendations.maxBudgetPercentage = action.payload;
    },
    setPrioritizeDistance: (state, action: PayloadAction<boolean>) => {
      state.recommendations.prioritizeDistance = action.payload;
    },
    setPrioritizeRating: (state, action: PayloadAction<boolean>) => {
      state.recommendations.prioritizeRating = action.payload;
    },
    setTransportMode: (state, action: PayloadAction<TransportMode | null>) => {
      state.recommendations.transportMode = action.payload;
    },
    
    // Map filters
    setMapBounds: (state, action: PayloadAction<FilterState['map']['bounds']>) => {
      state.map.bounds = action.payload;
    },
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.map.zoom = action.payload;
    },
    setMapCenter: (state, action: PayloadAction<FilterState['map']['center']>) => {
      state.map.center = action.payload;
    },
    setShowHeatmap: (state, action: PayloadAction<boolean>) => {
      state.map.showHeatmap = action.payload;
    },
    setMapPriceRange: (state, action: PayloadAction<FilterState['map']['priceRange']>) => {
      state.map.priceRange = action.payload;
    },
    
    // Reset filters
    resetSearchFilters: (state) => {
      state.search = initialState.search;
    },
    resetRecommendationFilters: (state) => {
      state.recommendations = initialState.recommendations;
    },
    resetMapFilters: (state) => {
      state.map = initialState.map;
    },
    resetAllFilters: () => initialState,
  },
});

export const {
  setCity,
  setPriceRange,
  setRoomType,
  setAmenities,
  toggleAmenity,
  setMaxDistance,
  setMinRating,
  setSortBy,
  setSortOrder,
  setUserLocation,
  setMaxBudgetPercentage,
  setPrioritizeDistance,
  setPrioritizeRating,
  setTransportMode,
  setMapBounds,
  setMapZoom,
  setMapCenter,
  setShowHeatmap,
  setMapPriceRange,
  resetSearchFilters,
  resetRecommendationFilters,
  resetMapFilters,
  resetAllFilters,
} = filtersSlice.actions;