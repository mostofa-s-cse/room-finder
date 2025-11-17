import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsPeriod, ChartType } from '@/lib/analytics/types';

// GET /api/analytics/charts - Generate chart data for analytics dashboards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';
    const period = (searchParams.get('period') as AnalyticsPeriod) || AnalyticsPeriod.LAST_30_DAYS;
    const userId = searchParams.get('userId');
    const chartType = (searchParams.get('chartType') as ChartType) || ChartType.LINE;

    // Generate chart data based on type
    const chartData = await analyticsService.generateChartData(
      type as 'revenue' | 'users' | 'listings' | 'bookings',
      period,
      userId || undefined
    );

    // Customize chart based on chart type
    if (chartType !== ChartType.LINE) {
      chartData.datasets = chartData.datasets.map(dataset => ({
        ...dataset,
        type: chartType,
      }));
    }

    return Response.json({
      success: true,
      data: chartData,
      meta: {
        type,
        period,
        chartType,
        userId,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Chart generation error:', error);
    return Response.json(
      { error: 'Failed to generate chart data' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/charts - Generate custom chart data with specific parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      period,
      userId,
      chartType = ChartType.LINE,
      // metrics = [], // Reserved for future use
      // groupBy = [], // Reserved for future use
      filters = {}
    } = body;

    if (!type) {
      return Response.json({ error: 'Chart type is required' }, { status: 400 });
    }

    // Generate base chart data
    const chartData = await analyticsService.generateChartData(type, period, userId);

    // Apply custom configurations
    const customizedChart = {
      ...chartData,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        type: chartType,
        // Apply custom styling based on filters
        backgroundColor: filters.color || dataset.backgroundColor,
        borderColor: filters.borderColor || dataset.borderColor,
      })),
      options: {
        ...chartData.options,
        plugins: {
          ...chartData.options?.plugins,
          title: {
            display: true,
            text: body.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Analytics`,
          },
        },
      },
    };

    return Response.json({
      success: true,
      data: customizedChart,
      meta: {
        type,
        period,
        chartType,
        customized: true,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Custom chart generation error:', error);
    return Response.json(
      { error: 'Failed to generate custom chart data' },
      { status: 500 }
    );
  }
}