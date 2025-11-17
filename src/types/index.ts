// User Types
export enum UserRole {
  BACHELOR = 'BACHELOR',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN'
}

export enum TransportMode {
  BIKE = 'BIKE',
  BUS = 'BUS',
  WALK = 'WALK'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  income?: number;
  affordablePrice?: number;
  transportMode?: TransportMode;
  createdAt: Date;
  updatedAt: Date;
}

// Listing Types
export enum RoomType {
  SINGLE = 'SINGLE',
  SHARED = 'SHARED'
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Listing {
  id: string;
  landlordId: string;
  landlord?: User;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  roomType: RoomType;
  amenities: string[];
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  reviews?: Review[];
}

// Review Types
export interface Review {
  id: string;
  listingId: string;
  listing?: Listing;
  authorId: string;
  author?: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Booking Types
export enum BookingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface Booking {
  id: string;
  listingId: string;
  listing?: Listing;
  userId: string;
  user?: User;
  amount: number;
  currency: string;
  status: BookingStatus;
  stripeSessionId?: string;
  createdAt: Date;
}

// Chat Types
export interface ChatThread {
  id: string;
  userId: string;
  user?: User;
  landlordId: string;
  landlord?: User;
  createdAt: Date;
  messages?: ChatMessage[];
  lastMessage?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  thread?: ChatThread;
  senderId: string;
  sender?: User;
  content: string;
  createdAt: Date;
}

// Search and Filter Types
export interface SearchFilters {
  city?: string;
  maxPrice?: number;
  minPrice?: number;
  roomType?: RoomType;
  amenities?: string[];
  maxDistance?: number;
  minRating?: number;
  sortBy?: 'price' | 'rating' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends SearchFilters {
  page?: number;
  limit?: number;
  userLat?: number;
  userLng?: number;
}

export interface SearchResults {
  listings: (Listing & { distance?: number })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Map Types
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  price: number;
  title: string;
  roomType: RoomType;
  images: string[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Recommendation Types
export interface RecommendationScore {
  budgetScore: number;
  amenityScore: number;
  distanceScore: number;
  ratingScore: number;
  totalScore: number;
}

export interface RecommendedListing extends Listing {
  distance?: number;
  score: RecommendationScore;
  recommendations: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
}

export interface ProfileFormData {
  name: string;
  phone?: string;
  income?: number;
  affordablePrice?: number;
  transportMode?: TransportMode;
}

export interface ListingFormData {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  roomType: RoomType;
  amenities: string[];
  images: File[];
}

// Utility Types
export type UserWithoutPassword = Omit<User, 'passwordHash'>;
export type CreateListingData = Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'ratingAvg' | 'ratingCount'>;
export type UpdateListingData = Partial<CreateListingData>;