export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  priority: NotificationPriority;
  category: NotificationCategory;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationType {
  // Booking related
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // Listing related
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LISTING_EXPIRED = 'LISTING_EXPIRED',
  NEW_INQUIRY = 'NEW_INQUIRY',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  
  // Chat related
  NEW_MESSAGE = 'NEW_MESSAGE',
  CHAT_REQUEST = 'CHAT_REQUEST',
  
  // System related
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_REACTIVATED = 'ACCOUNT_REACTIVATED',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  
  // Recommendations
  NEW_RECOMMENDATIONS = 'NEW_RECOMMENDATIONS',
  PRICE_DROP = 'PRICE_DROP',
  SIMILAR_LISTING = 'SIMILAR_LISTING',
  
  // General
  WELCOME = 'WELCOME',
  NEWSLETTER = 'NEWSLETTER',
  MAINTENANCE = 'MAINTENANCE',
  FEATURE_UPDATE = 'FEATURE_UPDATE'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationCategory {
  BOOKING = 'BOOKING',
  LISTING = 'LISTING',
  CHAT = 'CHAT',
  SYSTEM = 'SYSTEM',
  RECOMMENDATION = 'RECOMMENDATION',
  MARKETING = 'MARKETING'
}

export interface NotificationPreferences {
  userId: string;
  
  // Email notifications
  emailEnabled: boolean;
  emailBookings: boolean;
  emailListings: boolean;
  emailMessages: boolean;
  emailRecommendations: boolean;
  emailMarketing: boolean;
  emailSecurity: boolean;
  
  // Push notifications
  pushEnabled: boolean;
  pushBookings: boolean;
  pushListings: boolean;
  pushMessages: boolean;
  pushRecommendations: boolean;
  pushMarketing: boolean;
  
  // In-app notifications
  inAppEnabled: boolean;
  inAppBookings: boolean;
  inAppListings: boolean;
  inAppMessages: boolean;
  inAppRecommendations: boolean;
  inAppMarketing: boolean;
  
  // SMS notifications (optional)
  smsEnabled: boolean;
  smsBookings: boolean;
  smsEmergency: boolean;
  
  // Timing preferences
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
  timezone: string;
  
  // Frequency settings
  digestEnabled: boolean;
  digestFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
  updatedAt: Date;
}

export interface NotificationTemplate {
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  
  // Template content
  titleTemplate: string;
  messageTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  pushTitleTemplate?: string;
  pushBodyTemplate?: string;
  
  // Delivery settings
  requiresEmail: boolean;
  requiresPush: boolean;
  requiresInApp: boolean;
  
  // Timing
  delayMinutes?: number;
  expiresAfterDays?: number;
  
  // Personalization
  variables: string[];
  actionUrl?: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  provider?: string;
  externalId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  byChannel: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  byType: Record<string, {
    sent: number;
    read: number;
    clicked: number;
  }>;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}