export interface UserPreferences {
  userId: string;
  income?: number;
  affordablePrice?: number;
  transportMode?: 'BIKE' | 'BUS' | 'WALK';
  preferredAmenities?: string[];
  preferredRoomTypes?: ('SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT')[];
  maxDistance?: number; // in kilometers
  workLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  priorityWeights?: {
    budget: number;      // 0-1, how important budget is
    distance: number;    // 0-1, how important proximity is
    amenities: number;   // 0-1, how important amenities are
    rating: number;      // 0-1, how important ratings are
  };
}

export interface ListingForRecommendation {
  id: string;
  title: string;
  description: string;
  price: number;
  lat: number;
  lng: number;
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  amenities: string[];
  ratingAvg: number;
  ratingCount: number;
  isPublished: boolean;
  createdAt: Date;
  landlord: {
    id: string;
    name: string;
  };
}

export interface RecommendationScore {
  listingId: string;
  totalScore: number;
  budgetScore: number;
  distanceScore: number;
  amenitiesScore: number;
  ratingScore: number;
  explanation: string[];
  reasons: RecommendationReason[];
}

export interface RecommendationReason {
  type: 'budget' | 'distance' | 'amenities' | 'rating' | 'roomType';
  score: number;
  message: string;
  isPositive: boolean;
}

export interface RecommendationResult {
  listing: ListingForRecommendation;
  score: RecommendationScore;
  distance?: number;
  travelTime?: number;
  budgetFit: 'excellent' | 'good' | 'fair' | 'poor';
  matchPercentage: number;
}

export interface RecommendationFilter {
  maxResults?: number;
  minScore?: number;
  budgetFlexibility?: number; // percentage above affordable price to consider
  maxDistance?: number;
  requiredAmenities?: string[];
  excludeListings?: string[];
}

export const DEFAULT_PRIORITY_WEIGHTS = {
  budget: 0.35,    // 35% - Budget is very important
  distance: 0.25,  // 25% - Location matters
  amenities: 0.20, // 20% - Amenities are important
  rating: 0.20     // 20% - Quality/rating matters
};

export const AMENITY_CATEGORIES = {
  essential: ['WiFi', 'Electricity', 'Water'],
  comfort: ['AC', 'Heating', 'Furnished'],
  convenience: ['Kitchen', 'Laundry', 'Parking'],
  security: ['Security', 'CCTV', 'Gated'],
  lifestyle: ['Gym', 'Pool', 'Garden', 'Balcony'],
  social: ['Common Area', 'Rooftop', 'Study Room']
};

export const TRANSPORT_SPEED_KMH = {
  WALK: 5,
  BIKE: 15,
  BUS: 25
};

export const BUDGET_THRESHOLDS = {
  EXCELLENT: 0.25, // ≤25% of income
  GOOD: 0.30,      // ≤30% of income
  FAIR: 0.35,      // ≤35% of income
  POOR: 0.40       // ≤40% of income
};