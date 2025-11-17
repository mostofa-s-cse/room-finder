import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartData, ChartType } from '@/lib/analytics/types';

interface AnalyticsChartProps {
  data: ChartData;
  type?: ChartType;
  height?: number;
  className?: string;
  title?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function AnalyticsChart({
  data,
  type = ChartType.LINE,
  height = 300,
  className = '',
  title
}: AnalyticsChartProps) {
  // Transform data for recharts format
  const transformedData = data.labels?.map((label, index) => {
    const item: Record<string, string | number> = { name: label };
    data.datasets.forEach((dataset, datasetIndex) => {
      item[dataset.label || `Series ${datasetIndex}`] = dataset.data[index];
    });
    return item;
  }) || [];

  const renderChart = () => {
    switch (type) {
      case ChartType.BAR:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Bar 
                  key={index}
                  dataKey={dataset.label || `Series ${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case ChartType.PIE:
        const pieData = data.datasets[0]?.data.map((value, index) => ({
          name: data.labels?.[index] || `Item ${index}`,
          value: value as number,
          fill: COLORS[index % COLORS.length]
        })) || [];
        
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case ChartType.AREA:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Area 
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `Series ${index}`}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case ChartType.LINE:
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Line 
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `Series ${index}`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {renderChart()}
      </div>
    </div>
  );
}

// Preset chart components for common analytics
export function RevenueChart({ data, className }: { data: ChartData; className?: string }) {
  return (
    <AnalyticsChart
      data={data}
      type={ChartType.AREA}
      title="Revenue Trends"
      className={className}
      height={350}
    />
  );
}

export function UserGrowthChart({ data, className }: { data: ChartData; className?: string }) {
  return (
    <AnalyticsChart
      data={data}
      type={ChartType.BAR}
      title="User Growth"
      className={className}
      height={300}
    />
  );
}

export function ListingPerformanceChart({ data, className }: { data: ChartData; className?: string }) {
  return (
    <AnalyticsChart
      data={data}
      type={ChartType.LINE}
      title="Listing Performance"
      className={className}
      height={320}
    />
  );
}

export function PaymentMethodChart({ data, className }: { data: ChartData; className?: string }) {
  return (
    <AnalyticsChart
      data={data}
      type={ChartType.PIE}
      title="Payment Methods Distribution"
      className={className}
      height={300}
    />
  );
}

export function GeographicChart({ data, className }: { data: ChartData; className?: string }) {
  return (
    <AnalyticsChart
      data={data}
      type={ChartType.BAR}
      title="Geographic Performance"
      className={className}
      height={320}
    />
  );
}