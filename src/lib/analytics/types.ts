// Analytics Data Types for Room Finder Platform

// User Behavior Analytics
export interface UserAnalytics {
  id: string;
  userId: string;
  sessionId: string;
  userAgent: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  device: DeviceType;
  browser: string;
  referrer?: string;
  landingPage: string;
  sessionDuration: number;
  pageViews: number;
  actionsPerformed: UserAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAction {
  id: string;
  type: ActionType;
  target: string; // listing ID, search query, etc.
  metadata?: Record<string, unknown>;
  timestamp: Date;
  page: string;
  duration?: number;
}

// Listing Performance Analytics
export interface ListingAnalytics {
  id: string;
  listingId: string;
  views: number;
  uniqueViews: number;
  inquiries: number;
  bookings: number;
  conversionRate: number;
  averageViewDuration: number;
  impressions: number;
  clickThroughRate: number;
  favoriteCount: number;
  shareCount: number;
  contactAttempts: number;
  photoViews: PhotoViewAnalytics[];
  searchRankings: SearchRankingData[];
  geographicViews: GeographicViewData[];
  timeBasedViews: TimeBasedViewData[];
  competitorAnalysis?: CompetitorAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoViewAnalytics {
  photoIndex: number;
  views: number;
  averageViewTime: number;
  clickThroughRate: number;
}

export interface SearchRankingData {
  searchQuery: string;
  ranking: number;
  impressions: number;
  clicks: number;
  date: Date;
}

export interface GeographicViewData {
  country: string;
  city: string;
  views: number;
  inquiries: number;
  bookings: number;
}

export interface TimeBasedViewData {
  hour: number;
  dayOfWeek: number;
  views: number;
  inquiries: number;
  bookings: number;
}

// Payment Analytics
export interface PaymentAnalytics {
  id: string;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
  paymentMethodDistribution: PaymentMethodStats[];
  monthlyRevenue: MonthlyRevenueData[];
  geographicRevenue: GeographicRevenueData[];
  userTypeRevenue: UserTypeRevenueData[];
  processingFees: number;
  netRevenue: number;
  period: AnalyticsPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
}

export interface MonthlyRevenueData {
  month: number;
  year: number;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

export interface GeographicRevenueData {
  city: string;
  area: string;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

export interface UserTypeRevenueData {
  userType: 'BACHELOR' | 'LANDLORD';
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

// Search Analytics
export interface SearchAnalytics {
  id: string;
  searchQuery: string;
  userId?: string;
  sessionId: string;
  filters: SearchFiltersAnalytics;
  resultsCount: number;
  clickedResults: string[]; // listing IDs
  bookingConversions: string[]; // booking IDs
  searchDuration: number;
  refinements: number;
  location: string;
  sortBy: string;
  noResultsReason?: string;
  timestamp: Date;
  userAgent: string;
  device: DeviceType;
}

export interface SearchFiltersAnalytics {
  priceRange?: [number, number];
  location?: string;
  roomType?: string;
  amenities?: string[];
  radius?: number;
  minRating?: number;
}

export interface PopularSearchTerm {
  term: string;
  count: number;
  conversionRate: number;
  averageResultsCount: number;
  trending: boolean;
  locations: string[];
}

// Geographic Analytics
export interface GeographicAnalytics {
  id: string;
  location: string;
  city: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  listingCount: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  demandLevel: DemandLevel;
  searchVolume: number;
  bookingRate: number;
  popularAmenities: string[];
  competitionLevel: CompetitionLevel;
  growthRate: number;
  trendingDirection: TrendDirection;
  demographics: DemographicData;
  marketInsights: MarketInsight[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DemographicData {
  ageGroups: AgeGroupData[];
  occupationTypes: OccupationData[];
  budgetRanges: BudgetRangeData[];
  preferredAmenities: string[];
}

export interface AgeGroupData {
  range: string;
  percentage: number;
  averageBudget: number;
}

export interface OccupationData {
  type: string;
  percentage: number;
  averageBudget: number;
}

export interface BudgetRangeData {
  range: string;
  percentage: number;
  demandLevel: DemandLevel;
}

export interface MarketInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: ImpactLevel;
  actionable: boolean;
  recommendation?: string;
}

// Admin Dashboard Analytics
export interface AdminAnalytics {
  id: string;
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  totalListings: number;
  activeListings: number;
  newListingsToday: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  platformGrowthRate: number;
  userRetentionRate: number;
  listingSuccessRate: number;
  customerSatisfactionScore: number;
  supportTickets: SupportTicketStats;
  topPerformingAreas: AreaPerformanceData[];
  userEngagementMetrics: UserEngagementData;
  systemHealthMetrics: SystemHealthData;
  period: AnalyticsPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  resolved: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
}

export interface AreaPerformanceData {
  area: string;
  listingCount: number;
  bookingRate: number;
  averagePrice: number;
  revenue: number;
  growth: number;
}

export interface UserEngagementData {
  dailyActiveUsers: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  returnVisitorRate: number;
}

export interface SystemHealthData {
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
  databasePerformance: number;
  apiLatency: number;
}

// Landlord Analytics
export interface LandlordAnalytics {
  id: string;
  landlordId: string;
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalInquiries: number;
  totalBookings: number;
  conversionRate: number;
  averageRating: number;
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
  responseTime: number;
  responseRate: number;
  customerSatisfaction: number;
  topPerformingListings: ListingPerformanceData[];
  monthlyMetrics: MonthlyLandlordData[];
  competitorComparison: CompetitorComparisonData;
  marketPosition: MarketPositionData;
  recommendations: LandlordRecommendation[];
  period: AnalyticsPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingPerformanceData {
  listingId: string;
  title: string;
  views: number;
  inquiries: number;
  bookings: number;
  revenue: number;
  rating: number;
  conversionRate: number;
}

export interface MonthlyLandlordData {
  month: number;
  year: number;
  revenue: number;
  bookings: number;
  views: number;
  newListings: number;
  occupancyRate: number;
}

export interface CompetitorComparisonData {
  averagePrice: number;
  marketAveragePrice: number;
  priceCompetitiveness: number;
  responseTimeComparison: number;
  ratingComparison: number;
  marketShare: number;
}

export interface MarketPositionData {
  ranking: number;
  totalCompetitors: number;
  strongPoints: string[];
  improvementAreas: string[];
  marketTrends: string[];
}

export interface LandlordRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  expectedImpact: string;
  actionSteps: string[];
  estimatedROI?: number;
}

// Aggregated Analytics Data
export interface AnalyticsSummary {
  overview: OverviewMetrics;
  userMetrics: UserMetrics;
  listingMetrics: ListingMetrics;
  paymentMetrics: PaymentMetrics;
  searchMetrics: SearchMetrics;
  geographicMetrics: GeographicMetrics;
  period: AnalyticsPeriod;
  comparisonPeriod?: AnalyticsSummary;
  trends: TrendData[];
  insights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
}

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  growthRate: number;
  satisfactionScore: number;
}

export interface UserMetrics {
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  engagementRate: number;
  retentionRate: number;
  churnRate: number;
}

export interface ListingMetrics {
  newListings: number;
  activeListings: number;
  averageViews: number;
  averageInquiries: number;
  conversionRate: number;
  averageRating: number;
}

export interface PaymentMetrics {
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  monthlyGrowth: number;
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueSearches: number;
  averageResultsPerSearch: number;
  clickThroughRate: number;
  conversionRate: number;
  popularSearchTerms: string[];
}

export interface GeographicMetrics {
  topCities: Array<{ city: string; count: number }>;
  countryDistribution: Array<{ country: string; count: number }>;
  regionGrowth: Array<{ region: string; growth: number }>;
  averagePriceByLocation: Array<{ location: string; price: number }>;
}

export interface TrendData {
  metric: string;
  direction: TrendDirection;
  change: number;
  significance: SignificanceLevel;
  period: string;
}

export interface AnalyticsInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  confidence: number;
  impact: ImpactLevel;
  actionable: boolean;
  recommendation?: string;
  relatedMetrics: string[];
  generatedAt: Date;
}

export interface AnalyticsAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric: string;
  threshold: number;
  actualValue: number;
  triggeredAt: Date;
  acknowledged: boolean;
  resolved: boolean;
}

// Chart and Visualization Data
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  type?: ChartType;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled: boolean;
      mode?: 'single' | 'point' | 'nearest';
    };
  };
  scales?: {
    x?: ScaleConfig;
    y?: ScaleConfig;
  };
}

export interface ScaleConfig {
  display: boolean;
  title?: {
    display: boolean;
    text: string;
  };
  ticks?: {
    beginAtZero: boolean;
    callback?: (value: number) => string;
  };
}

// Enums and Constants
export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET'
}

export enum ActionType {
  PAGE_VIEW = 'PAGE_VIEW',
  LISTING_VIEW = 'LISTING_VIEW',
  SEARCH = 'SEARCH',
  FILTER_APPLIED = 'FILTER_APPLIED',
  CONTACT_LANDLORD = 'CONTACT_LANDLORD',
  SAVE_LISTING = 'SAVE_LISTING',
  SHARE_LISTING = 'SHARE_LISTING',
  BOOKING_INITIATED = 'BOOKING_INITIATED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  CHAT_STARTED = 'CHAT_STARTED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  LISTING_CREATED = 'LISTING_CREATED',
  LISTING_UPDATED = 'LISTING_UPDATED'
}

export enum DemandLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum CompetitionLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  SATURATED = 'SATURATED'
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE'
}

export enum InsightType {
  OPPORTUNITY = 'OPPORTUNITY',
  WARNING = 'WARNING',
  TREND = 'TREND',
  ANOMALY = 'ANOMALY',
  RECOMMENDATION = 'RECOMMENDATION'
}

export enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RecommendationType {
  PRICING = 'PRICING',
  MARKETING = 'MARKETING',
  LISTING_OPTIMIZATION = 'LISTING_OPTIMIZATION',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  EXPANSION = 'EXPANSION'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum SignificanceLevel {
  NEGLIGIBLE = 'NEGLIGIBLE',
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SIGNIFICANT = 'SIGNIFICANT',
  MAJOR = 'MAJOR'
}

export enum InsightCategory {
  USER_BEHAVIOR = 'USER_BEHAVIOR',
  LISTING_PERFORMANCE = 'LISTING_PERFORMANCE',
  MARKET_TRENDS = 'MARKET_TRENDS',
  REVENUE_OPTIMIZATION = 'REVENUE_OPTIMIZATION',
  OPERATIONAL_EFFICIENCY = 'OPERATIONAL_EFFICIENCY'
}

export enum AlertType {
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  THRESHOLD_EXCEEDED = 'THRESHOLD_EXCEEDED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  SCATTER = 'scatter'
}

export enum AnalyticsPeriod {
  LAST_24_HOURS = 'LAST_24_HOURS',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR',
  CUSTOM = 'CUSTOM'
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  sampleRate: number;
  dimensions: {
    user: boolean;
    listing: boolean;
    payment: boolean;
    search: boolean;
    geographic: boolean;
  };
  retention: {
    rawData: number; // days
    aggregatedData: number; // days
    reportData: number; // days
  };
  privacy: {
    anonymizeIPs: boolean;
    respectDNT: boolean;
    cookieConsent: boolean;
  };
  alerts: {
    enabled: boolean;
    thresholds: Record<string, number>;
    recipients: string[];
  };
}

// API Request/Response Types
export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  filters?: AnalyticsFilters;
  groupBy?: string[];
  metrics: string[];
  limit?: number;
  offset?: number;
}

export interface AnalyticsFilters {
  userId?: string;
  listingId?: string;
  location?: string;
  userType?: 'BACHELOR' | 'LANDLORD' | 'ADMIN';
  deviceType?: DeviceType;
  paymentMethod?: string;
  priceRange?: [number, number];
}

export interface AnalyticsResponse<T = unknown> {
  data: T;
  meta: {
    total: number;
    period: AnalyticsPeriod;
    generatedAt: Date;
    cacheStatus: 'HIT' | 'MISS';
    processingTime: number;
  };
  insights?: AnalyticsInsight[];
  recommendations?: LandlordRecommendation[];
}

// Competitor Analysis
export interface CompetitorAnalysis {
  competitorId: string;
  competitorName: string;
  listingCount: number;
  averagePrice: number;
  averageRating: number;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
}

