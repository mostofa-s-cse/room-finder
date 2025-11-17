// Export all analytics components
export { AnalyticsChart, RevenueChart, UserGrowthChart, ListingPerformanceChart, PaymentMethodChart, GeographicChart } from './AnalyticsChart';
export { MetricsCard, UserMetricCard, RevenueMetricCard, ListingMetricCard, BookingMetricCard, ConversionRateCard } from './MetricsCard';
export { AdminDashboard } from './AdminDashboard';
export { LandlordDashboard } from './LandlordDashboard';
export { BachelorDashboard } from './BachelorDashboard';
export { AnalyticsTracker, trackEvent, trackSearch, trackListingView, trackFavorite, trackInquiry, trackBooking, trackPayment, trackListingCreate, trackListingUpdate, trackUserRegistration, trackUserLogin, trackFilterChange, trackSortChange, trackError, useAnalytics } from './AnalyticsTracker';

// Re-export types
export type { MetricsCardProps } from './MetricsCard';

// Analytics utilities
export const formatCurrency = (amount: number, currency = '৳') => {
  return `${currency}${amount.toLocaleString()}`;
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number) => {
  return value.toLocaleString();
};

export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

export const getTrendDirection = (change: number): 'up' | 'down' | 'neutral' => {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
};

export const generateChartColors = (count: number) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(147, 51, 234, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(14, 165, 233, 0.8)',   // Sky
    'rgba(34, 197, 94, 0.8)',    // Emerald
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};