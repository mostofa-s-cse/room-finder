import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  role: z.enum(['BACHELOR', 'LANDLORD'], {
    message: 'Please select your role',
  }),
  phone: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  phone: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number').optional().or(z.literal('')),
  income: z.number().min(0, 'Income must be a positive number').optional(),
  affordablePrice: z.number().min(0, 'Affordable price must be a positive number').optional(),
  transportMode: z.enum(['BIKE', 'BUS', 'WALK']).optional(),
});

export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must be less than 1000 characters'),
  price: z.number().min(1000, 'Price must be at least 1000 BDT').max(100000, 'Price must be less than 100,000 BDT'),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  roomType: z.enum(['SINGLE', 'SHARED'], {
    message: 'Please select room type',
  }),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  availableFrom: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // If it's already a proper date string, return it
    if (val.includes('T')) return val;
    // Convert date string to ISO format for database
    return new Date(val).toISOString();
  }),
  rules: z.array(z.string()).optional().default([]),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

export const reviewSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(500, 'Comment must be less than 500 characters'),
});

export const searchSchema = z.object({
  city: z.string().optional(),
  maxPrice: z.number().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  roomType: z.enum(['SINGLE', 'SHARED']).optional(),
  amenities: z.array(z.string()).optional(),
  maxDistance: z.number().min(0).optional(),
  minRating: z.number().min(1).max(5).optional(),
  sortBy: z.enum(['price', 'rating', 'distance', 'newest']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  userLat: z.number().optional(),
  userLng: z.number().optional(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters'),
});

export const bookingSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  amount: z.number().min(0, 'Amount must be positive'),
});

// Extended API validation schemas
export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED']),
  message: z.string().max(500).optional(),
});

export const createChatThreadSchema = z.object({
  participantId: z.string().uuid('Invalid participant ID'),
  listingId: z.string().uuid('Invalid listing ID').optional(),
  initialMessage: z.string().min(1, 'Initial message is required').max(1000),
});

export const adminUserUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['BACHELOR', 'LANDLORD', 'ADMIN']).optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  notes: z.string().max(1000).optional(),
});

export const paymentInitiationSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(200).optional(),
});

export const imageUploadSchema = z.object({
  folder: z.enum(['listings', 'avatars', 'documents']).default('listings'),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Type inference from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateChatThreadInput = z.infer<typeof createChatThreadSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type PaymentInitiationInput = z.infer<typeof paymentInitiationSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;