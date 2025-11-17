export interface SearchFilters {
  // Location filters
  location?: string;
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  priceRange?: [number, number];
  
  // Room type filters
  roomType?: 'SINGLE' | 'SHARED';
  
  // Amenities filters
  amenities?: string[];
  requiredAmenities?: string[];
  
  // Property features
  hasWifi?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
  hasGenerator?: boolean;
  hasLift?: boolean;
  hasSecurity?: boolean;
  hasGym?: boolean;
  hasLaundry?: boolean;
  hasKitchen?: boolean;
  hasBalcony?: boolean;
  
  // Availability filters
  availableFrom?: Date;
  availableTo?: Date;
  minDuration?: number; // in months
  
  // Rating and quality filters
  minRating?: number;
  verifiedOnly?: boolean;
  newListingsOnly?: boolean;
  
  // Landlord preferences
  preferredLandlordGender?: 'MALE' | 'FEMALE' | 'ANY';
  landlordVerified?: boolean;
  
  // Sort options
  sortBy?: SearchSortOption;
  sortOrder?: 'ASC' | 'DESC';
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Advanced filters
  maxCommute?: number; // in minutes
  commuteDestination?: {
    lat: number;
    lng: number;
    name: string;
  };
  transportMode?: 'WALK' | 'BIKE' | 'BUS' | 'CAR';
  
  // Date range for analytics
  searchDate?: Date;
  userPreferences?: UserSearchPreferences;
}

export enum SearchSortOption {
  RELEVANCE = 'RELEVANCE',
  PRICE_LOW_TO_HIGH = 'PRICE_LOW_TO_HIGH',
  PRICE_HIGH_TO_LOW = 'PRICE_HIGH_TO_LOW',
  DISTANCE = 'DISTANCE',
  RATING = 'RATING',
  NEWEST = 'NEWEST',
  MOST_POPULAR = 'MOST_POPULAR',
  RECENTLY_UPDATED = 'RECENTLY_UPDATED'
}

export interface UserSearchPreferences {
  userId: string;
  preferredAreas: string[];
  maxBudget: number;
  preferredAmenities: string[];
  preferredRoomType: 'SINGLE' | 'SHARED' | 'ANY';
  maxCommuteTime: number;
  workLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  savedSearches: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alertEnabled: boolean;
  lastNotified?: Date;
  createdAt: Date;
}

export interface SearchResult {
  listings: SearchedListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  suggestions: SearchSuggestion[];
  searchId: string;
  searchTime: number; // in milliseconds
}

export interface SearchedListing {
  id: string;
  title: string;
  description: string;
  monthlyRent: number;
  location: string;
  city: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  roomType: 'SINGLE' | 'SHARED';
  amenities: string[];
  images: string[];
  averageRating: number;
  reviewCount: number;
  availableFrom: Date;
  isVerified: boolean;
  isNewListing: boolean;
  
  // Calculated fields
  distance?: number; // from search location
  commuteTime?: number; // to work location
  relevanceScore: number;
  priceScore: number;
  
  // Landlord info
  landlord: {
    id: string;
    name: string;
    rating: number;
    responseRate: number;
    isVerified: boolean;
    profilePicture?: string;
  };
  
  // Highlighted fields for search results
  highlights?: {
    title?: string;
    description?: string;
    location?: string;
  };
}

export interface SearchFacets {
  priceRanges: Array<{
    range: string;
    count: number;
    min: number;
    max: number;
  }>;
  
  locations: Array<{
    city: string;
    area: string;
    count: number;
  }>;
  
  amenities: Array<{
    name: string;
    count: number;
  }>;
  
  roomTypes: Array<{
    type: 'SINGLE' | 'SHARED';
    count: number;
  }>;
  
  ratings: Array<{
    rating: number;
    count: number;
  }>;
  
  availability: Array<{
    period: string;
    count: number;
  }>;
}

export interface SearchSuggestion {
  type: 'LOCATION' | 'AMENITY' | 'LISTING' | 'AREA';
  text: string;
  value: string;
  count?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SearchAnalytics {
  searchId: string;
  userId?: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  clickedListings: string[];
  searchTime: number;
  userAgent: string;
  ipAddress: string;
  sessionId: string;
  timestamp: Date;
}

export interface PopularSearch {
  query: string;
  count: number;
  avgResults: number;
  lastSearched: Date;
  trending: boolean;
}

export interface LocationSuggestion {
  name: string;
  type: 'CITY' | 'AREA' | 'LANDMARK';
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  listingCount: number;
  avgPrice: number;
}

export interface SearchConfig {
  maxRadius: number;
  defaultRadius: number;
  maxResults: number;
  defaultLimit: number;
  searchTimeout: number;
  cacheTimeout: number;
  enableFuzzySearch: boolean;
  enableAutoComplete: boolean;
  minQueryLength: number;
  maxSuggestions: number;
}

export interface AdvancedSearchOptions {
  includeNearbyAreas: boolean;
  fuzzyMatching: boolean;
  semanticSearch: boolean;
  personalizedResults: boolean;
  includeSimilarListings: boolean;
  boostNewListings: boolean;
  boostVerifiedListings: boolean;
  applyMLRanking: boolean;
}