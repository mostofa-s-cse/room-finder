# Analytics System Documentation

## Overview

The Room Finder Analytics System provides comprehensive tracking, reporting, and visualization capabilities for all platform activities. It includes role-based dashboards, real-time data tracking, and actionable insights for administrators, landlords, and bachelors.

## Architecture

### Core Components

1. **Analytics Service Layer** (`/src/lib/analytics/analytics-service.ts`)
   - Data collection and aggregation
   - Performance metrics calculation
   - Insights generation
   - Alert system management

2. **Dashboard Components** (`/src/components/analytics/`)
   - AdminDashboard: Platform-wide analytics
   - LandlordDashboard: Property and earnings analytics
   - BachelorDashboard: Search activity and preferences

3. **Analytics Tracker** (`/src/components/analytics/AnalyticsTracker.tsx`)
   - Real-time event tracking
   - User behavior monitoring
   - Session management

4. **API Endpoints** (`/src/app/api/analytics/`)
   - `/overview` - Dashboard data
   - `/track` - Event tracking
   - `/listings/[id]` - Listing analytics
   - `/search` - Search analytics
   - `/charts` - Chart data
   - `/insights` - Recommendations
   - `/alerts` - System alerts

## Usage

### 1. Dashboard Implementation

#### Admin Dashboard
```tsx
import { AdminDashboard } from '@/components/analytics';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <AdminDashboard />
    </div>
  );
}
```

#### Landlord Dashboard
```tsx
import { LandlordDashboard } from '@/components/analytics';

export default function LandlordAnalytics() {
  return (
    <div className="container mx-auto p-6">
      <LandlordDashboard landlordId={user.id} />
    </div>
  );
}
```

#### Bachelor Dashboard
```tsx
import { BachelorDashboard } from '@/components/analytics';

export default function MyActivity() {
  return (
    <div className="container mx-auto p-6">
      <BachelorDashboard bachelorId={user.id} />
    </div>
  );
}
```

### 2. Event Tracking

#### Using the Analytics Hook
```tsx
import { useAnalytics } from '@/components/analytics';

function SearchPage() {
  const { trackSearch, trackListingView } = useAnalytics(user.id, user.role);

  const handleSearch = (query: string, filters: any) => {
    // Track search event
    trackSearch(query, filters);
    
    // Perform search...
  };

  const handleListingClick = (listingId: string) => {
    // Track listing view
    trackListingView(listingId);
    
    // Navigate to listing...
  };

  return (
    // Your search component
  );
}
```

#### Using Direct Tracking Functions
```tsx
import { trackEvent, trackBooking, trackPayment } from '@/components/analytics';

// Track custom events
await trackEvent('CUSTOM_EVENT', {
  userId: user.id,
  metadata: { customData: 'value' }
});

// Track bookings
await trackBooking(listingId, user.id, amount, paymentMethod);

// Track payments
await trackPayment(bookingId, amount, paymentMethod, user.id, 'SUCCESS');
```

### 3. Analytics Tracker Wrapper

Wrap your app with the AnalyticsTracker to enable automatic tracking:

```tsx
import { AnalyticsTracker } from '@/components/analytics';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AnalyticsTracker userId={user?.id} userRole={user?.role}>
          {children}
        </AnalyticsTracker>
      </body>
    </html>
  );
}
```

## Features

### 1. Admin Analytics
- **Platform Overview**: Total users, revenue, listings, bookings
- **Growth Metrics**: User acquisition, platform growth rate
- **System Health**: Server uptime, API performance, error rates
- **User Analytics**: User types distribution, retention rates
- **Revenue Analytics**: Monthly revenue, booking values
- **Geographic Insights**: Performance by location

### 2. Landlord Analytics
- **Property Performance**: Views, inquiries, bookings per listing
- **Revenue Tracking**: Monthly earnings, booking trends
- **Market Position**: Rating comparison, pricing analysis
- **Response Metrics**: Response rate and time analysis
- **Recommendations**: Optimization suggestions
- **Competitive Analysis**: Market positioning insights

### 3. Bachelor Analytics
- **Search Activity**: Search patterns, preferences
- **Engagement Metrics**: Time on platform, session duration
- **Preference Analysis**: Budget distribution, location preferences
- **Activity Timeline**: Recent searches, favorites, inquiries
- **Personalized Recommendations**: Profile completion, alerts
- **Booking History**: Past bookings and experiences

### 4. Real-time Tracking
- **Page Views**: Automatic page view tracking
- **User Sessions**: Session duration and engagement
- **Search Behavior**: Query analysis and filter usage
- **Listing Interactions**: Views, favorites, inquiries
- **Booking Flow**: Complete booking funnel tracking
- **Payment Events**: Transaction success/failure tracking

## Data Models

### Analytics Tables
- `UserAnalytics`: User-specific metrics and behavior
- `ListingAnalytics`: Property performance data
- `PaymentAnalytics`: Transaction and revenue data
- `SearchAnalytics`: Search patterns and preferences
- `GeographicAnalytics`: Location-based insights
- `AdminAnalytics`: Platform-wide metrics
- `LandlordAnalytics`: Property owner insights

### Key Metrics
- **User Metrics**: Registration, retention, engagement
- **Listing Metrics**: Views, conversion rates, performance
- **Revenue Metrics**: Bookings, payments, growth
- **Search Metrics**: Queries, filters, results
- **Geographic Metrics**: Area performance, trends

## Configuration

### Analytics Settings
```typescript
const analyticsConfig = {
  enabled: true,
  trackingId: 'your-tracking-id',
  sampleRate: 1.0, // 100% tracking
  dimensions: {
    user: true,
    listing: true,
    payment: true,
    search: true,
    geographic: true,
  },
  privacy: {
    anonymizeIPs: true,
    respectDNT: true,
    cookieConsent: true,
  }
};
```

### Chart Configuration
The system uses Chart.js for visualizations with these chart types:
- Line charts for trends (revenue, user growth)
- Bar charts for comparisons (bookings, views)
- Pie/Doughnut charts for distributions (user types, ratings)
- Geographic charts for location data

## API Reference

### GET /api/analytics/overview
Get dashboard analytics data.

**Parameters:**
- `period`: Time period (LAST_7_DAYS, LAST_30_DAYS, etc.)
- `role`: User role (admin, landlord, bachelor)
- `userId`: Specific user ID (optional)

**Response:**
```json
{
  "data": {
    "totalUsers": 965,
    "totalRevenue": 125000,
    "activeListings": 234,
    "completedBookings": 156
  },
  "meta": {
    "period": "LAST_30_DAYS",
    "generatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/analytics/track
Track user events and interactions.

**Body:**
```json
{
  "eventType": "SEARCH",
  "userId": "user-id",
  "listingId": "listing-id",
  "metadata": {
    "query": "rooms in dhaka",
    "filters": {"maxPrice": 20000}
  }
}
```

### GET /api/analytics/charts
Get chart data for visualizations.

**Parameters:**
- `type`: Chart type (revenue, users, listings, etc.)
- `period`: Time period
- `userId`: User ID (optional)

## Testing

The analytics system includes a test page at `/test/analytics` that demonstrates:
- All dashboard components with sample data
- Chart visualizations and interactions
- Responsive design across different screen sizes
- Error handling and loading states

## Performance Considerations

1. **Data Aggregation**: Analytics data is pre-aggregated for faster queries
2. **Caching**: Dashboard data is cached with appropriate TTL
3. **Pagination**: Large datasets are paginated for performance
4. **Background Processing**: Heavy analytics computations run in background
5. **Efficient Queries**: Optimized database queries with proper indexing

## Privacy & Compliance

- **Data Anonymization**: Personal data is anonymized in analytics
- **GDPR Compliance**: Respects user privacy preferences
- **Opt-out Support**: Users can opt out of analytics tracking
- **Data Retention**: Configurable data retention policies
- **Secure Storage**: Analytics data is encrypted at rest

## Troubleshooting

### Common Issues

1. **Charts not rendering**: Ensure Chart.js is properly installed
2. **API errors**: Check authentication and permissions
3. **Missing data**: Verify tracking is enabled and events are firing
4. **Performance issues**: Check database indexes and query optimization

### Debug Mode
Enable debug logging by setting `ANALYTICS_DEBUG=true` in environment variables.

## Future Enhancements

1. **Machine Learning**: Predictive analytics and recommendations
2. **Real-time Dashboards**: WebSocket-based live updates
3. **Advanced Segmentation**: User cohort analysis
4. **Export Capabilities**: PDF/CSV report generation
5. **Third-party Integrations**: Google Analytics, Mixpanel integration
6. **Custom Dashboards**: User-configurable dashboard layouts
7. **A/B Testing**: Built-in experimentation framework