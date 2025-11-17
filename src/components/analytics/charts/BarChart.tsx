'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartData } from '@/lib/analytics/types';

interface BarChartProps {
  data: ChartData;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  className?: string;
}

export function BarChart({ 
  data, 
  height = 300, 
  showGrid = true, 
  showLegend = true,
  horizontal = false,
  className = '' 
}: BarChartProps) {
  // Transform data for Recharts format
  const chartData = data.labels.map((label, index) => ({
    name: label,
    ...data.datasets.reduce((acc, dataset, datasetIndex) => ({
      ...acc,
      [`dataset_${datasetIndex}`]: dataset.data[index] || 0
    }), {})
  }));

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={chartData}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis 
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : 'name'} 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? 'name' : undefined}
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          {showLegend && <Legend />}
          {data.datasets.map((dataset, index) => (
            <Bar
              key={index}
              dataKey={`dataset_${index}`}
              fill={
                Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[0] || colors[index % colors.length]
                  : dataset.backgroundColor || colors[index % colors.length]
              }
              name={dataset.label}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}