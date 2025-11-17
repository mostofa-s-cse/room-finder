import React from 'react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  valueFormatter?: (value: string | number) => string;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  description,
  className = '',
  valueFormatter = (val) => val.toString(),
}: MetricsCardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 0H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0 0h10" />
          </svg>
        );
      case 'neutral':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-blue-600">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="flex items-baseline gap-3">
            <p className="text-2xl font-bold text-gray-900">
              {valueFormatter(value)}
            </p>
            
            {change && (
              <div className={`flex items-center gap-1 ${getTrendColor(change.trend)}`}>
                {getTrendIcon(change.trend)}
                <span className="text-sm font-medium">
                  {Math.abs(change.percentage)}%
                </span>
              </div>
            )}
          </div>
          
          {change && (
            <p className="text-sm text-gray-500 mt-1">
              {change.trend === 'up' ? '+' : change.trend === 'down' ? '-' : ''}
              {Math.abs(change.value)} from last period
            </p>
          )}
          
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Preset metric cards for common analytics
export function UserMetricCard({ userCount, change }: { 
  userCount: number; 
  change?: MetricsCardProps['change'] 
}) {
  return (
    <MetricsCard
      title="Total Users"
      value={userCount}
      change={change}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      }
      valueFormatter={(val) => val.toLocaleString()}
    />
  );
}

export function RevenueMetricCard({ revenue, change }: { 
  revenue: number; 
  change?: MetricsCardProps['change'] 
}) {
  return (
    <MetricsCard
      title="Total Revenue"
      value={revenue}
      change={change}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      }
      valueFormatter={(val) => `৳${Number(val).toLocaleString()}`}
    />
  );
}

export function ListingMetricCard({ listingCount, change }: { 
  listingCount: number; 
  change?: MetricsCardProps['change'] 
}) {
  return (
    <MetricsCard
      title="Active Listings"
      value={listingCount}
      change={change}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
      valueFormatter={(val) => val.toLocaleString()}
    />
  );
}

export function BookingMetricCard({ bookingCount, change }: { 
  bookingCount: number; 
  change?: MetricsCardProps['change'] 
}) {
  return (
    <MetricsCard
      title="Total Bookings"
      value={bookingCount}
      change={change}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      }
      valueFormatter={(val) => val.toLocaleString()}
    />
  );
}

export function ConversionRateCard({ rate, change }: { 
  rate: number; 
  change?: MetricsCardProps['change'] 
}) {
  return (
    <MetricsCard
      title="Conversion Rate"
      value={rate}
      change={change}
      icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
      valueFormatter={(val) => `${Number(val).toFixed(1)}%`}
    />
  );
}