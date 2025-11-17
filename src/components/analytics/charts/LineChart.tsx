'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartData, ChartDataset } from '@/lib/analytics/types';

interface LineChartProps {
  data: ChartData;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function LineChart({ 
  data, 
  height = 300, 
  showGrid = true, 
  showLegend = true,
  className = '' 
}: LineChartProps) {
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
        <RechartsLineChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis 
            dataKey="name" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
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
            <Line
              key={index}
              type="monotone"
              dataKey={`dataset_${index}`}
              stroke={dataset.borderColor || colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: dataset.borderColor || colors[index % colors.length], strokeWidth: 2 }}
              name={dataset.label}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}