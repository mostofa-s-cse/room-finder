import { ChartData, ChartType, AnalyticsPeriod, OverviewMetrics } from './types';

// Temporary aliases for compatibility
type AnalyticsOverview = OverviewMetrics & { period: AnalyticsPeriod; conversionRate: number };
type TimePeriod = AnalyticsPeriod;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataPoints: number;
  chartType: ChartType;
}

export class AnalyticsValidator {
  /**
   * Validate chart data structure
   */
  static validateChartData(data: ChartData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required properties
    if (!data.labels || !Array.isArray(data.labels)) {
      errors.push('Chart data must have a labels array');
    }

    if (!data.datasets || !Array.isArray(data.datasets)) {
      errors.push('Chart data must have a datasets array');
    }

    if (data.datasets) {
      data.datasets.forEach((dataset, index) => {
        if (!dataset.label) {
          warnings.push(`Dataset ${index} missing label`);
        }
        if (!dataset.data || !Array.isArray(dataset.data)) {
          errors.push(`Dataset ${index} must have a data array`);
        }

        // Check data consistency
        if (data.labels && dataset.data && data.labels.length !== dataset.data.length) {
          errors.push(`Dataset ${index} data length (${dataset.data.length}) doesn't match labels length (${data.labels.length})`);
        }

        // Check for numeric data
        if (dataset.data) {
          dataset.data.forEach((value, dataIndex) => {
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`Dataset ${index}, data point ${dataIndex} is not a valid number`);
            }
          });
        }
      });
    }

    // Performance warnings
    if (data.labels && data.labels.length > 1000) {
      warnings.push(`Large dataset detected (${data.labels.length} points). Consider pagination or data aggregation for better performance.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate analytics overview data
   */
  static validateAnalyticsOverview(overview: AnalyticsOverview): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metrics (overview extends OverviewMetrics)
    // Check for negative values where they shouldn't exist
    if (overview.totalUsers < 0) errors.push('Total users cannot be negative');
    if (overview.totalRevenue < 0) errors.push('Total revenue cannot be negative');
    if (overview.totalListings < 0) errors.push('Total listings cannot be negative');
    if (overview.totalBookings < 0) errors.push('Total bookings cannot be negative');

    // Logical consistency checks
    if (overview.activeUsers > overview.totalUsers) {
      warnings.push('Active users count exceeds total users count');
    }

    if (overview.activeUsers > overview.totalListings) {
      warnings.push('Active listings count exceeds total listings count');
    }

    // Note: Chart validation should be done separately as AnalyticsOverview doesn't include charts

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Measure chart performance
   */
  static async measureChartPerformance(
    data: ChartData,
    chartType: ChartType,
    renderFn: () => Promise<void>
  ): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

    await renderFn();

    const endTime = performance.now();
    const endMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;

    return {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      dataPoints: data.labels?.length || 0,
      chartType,
    };
  }

  /**
   * Validate time period consistency
   */
  static validateTimePeriod(period: TimePeriod, data: ChartData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.labels || data.labels.length === 0) {
      errors.push('No data labels to validate against time period');
      return { isValid: false, errors, warnings };
    }

    const expectedDataPoints = this.getExpectedDataPoints(period);
    const actualDataPoints = data.labels.length;

    if (actualDataPoints !== expectedDataPoints) {
      warnings.push(
        `Expected ${expectedDataPoints} data points for ${period}, but got ${actualDataPoints}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get expected data points for a time period
   */
  private static getExpectedDataPoints(period: TimePeriod): number {
    switch (period) {
      case AnalyticsPeriod.LAST_7_DAYS:
        return 7;
      case AnalyticsPeriod.LAST_30_DAYS:
        return 30;
      case AnalyticsPeriod.LAST_90_DAYS:
        return 12; // Weekly data points
      case AnalyticsPeriod.LAST_6_MONTHS:
        return 24; // Bi-weekly data points
      case AnalyticsPeriod.LAST_YEAR:
        return 12; // Monthly data points
      default:
        return 0;
    }
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(metrics: PerformanceMetrics[]): {
    averageRenderTime: number;
    maxRenderTime: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    performanceByChartType: Record<ChartType, PerformanceMetrics[]>;
    recommendations: string[];
  } {
    if (metrics.length === 0) {
      return {
        averageRenderTime: 0,
        maxRenderTime: 0,
        averageMemoryUsage: 0,
        maxMemoryUsage: 0,
        performanceByChartType: {} as Record<ChartType, PerformanceMetrics[]>,
        recommendations: ['No performance data available'],
      };
    }

    const averageRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const maxRenderTime = Math.max(...metrics.map(m => m.renderTime));
    const averageMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const maxMemoryUsage = Math.max(...metrics.map(m => m.memoryUsage));

    // Group by chart type
    const performanceByChartType = metrics.reduce((acc, metric) => {
      if (!acc[metric.chartType]) {
        acc[metric.chartType] = [];
      }
      acc[metric.chartType].push(metric);
      return acc;
    }, {} as Record<ChartType, PerformanceMetrics[]>);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageRenderTime > 500) {
      recommendations.push('Average render time is high. Consider data aggregation or lazy loading.');
    }
    
    if (maxRenderTime > 1000) {
      recommendations.push('Some charts take over 1s to render. Optimize large datasets.');
    }
    
    if (averageMemoryUsage > 5000000) { // 5MB
      recommendations.push('High memory usage detected. Consider data pagination.');
    }

    // Chart-specific recommendations
    Object.entries(performanceByChartType).forEach(([chartType, chartMetrics]) => {
      const avgRenderTime = chartMetrics.reduce((sum, m) => sum + m.renderTime, 0) / chartMetrics.length;
      if (chartType === ChartType.PIE && avgRenderTime > 300) {
        recommendations.push('Pie charts are rendering slowly. Consider reducing data points.');
      }
      if (chartType === ChartType.LINE && avgRenderTime > 400) {
        recommendations.push('Line charts are rendering slowly. Consider data sampling for large datasets.');
      }
    });

    return {
      averageRenderTime,
      maxRenderTime,
      averageMemoryUsage,
      maxMemoryUsage,
      performanceByChartType,
      recommendations,
    };
  }

  /**
   * Validate API response structure
   */
  static validateApiResponse(response: Record<string, unknown>, expectedStructure: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    expectedStructure.forEach(field => {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check for unexpected null values
    Object.entries(response).forEach(([key, value]) => {
      if (value === null && expectedStructure.includes(key)) {
        warnings.push(`Field '${key}' is null`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Test data consistency across time periods
   */
  static validateDataConsistency(
    data7Days: ChartData,
    data30Days: ChartData,
    data3Months: ChartData
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that shorter periods are subsets of longer periods
    if (data7Days.datasets && data30Days.datasets && data7Days.datasets.length > 0 && data30Days.datasets.length > 0) {
      const sum7Days = data7Days.datasets[0].data?.reduce((sum: number, val: number) => sum + val, 0) || 0;
      const sum30Days = data30Days.datasets[0].data?.reduce((sum: number, val: number) => sum + val, 0) || 0;
      
      if (sum7Days > sum30Days) {
        warnings.push('7-day total exceeds 30-day total, which may indicate data inconsistency');
      }
    }

    // Check data freshness (last data point should be recent)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    [data7Days, data30Days, data3Months].forEach((data, index) => {
      const periodName = ['7-day', '30-day', '3-month'][index];
      if (data.labels && data.labels.length > 0) {
        const lastLabel = data.labels[data.labels.length - 1];
        const lastDate = new Date(lastLabel);
        
        if (isNaN(lastDate.getTime())) {
          warnings.push(`${periodName} data: Last label is not a valid date`);
        } else if (lastDate < oneDayAgo) {
          warnings.push(`${periodName} data appears stale (last data point: ${lastDate.toISOString()})`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Analytics Test Suite - Automated testing utilities
 */
export class AnalyticsTestSuite {
  private results: ValidationResult[] = [];

  async runFullTestSuite(
    analyticsData: AnalyticsOverview,
    performanceMetrics?: PerformanceMetrics[]
  ): Promise<{
    passed: number;
    failed: number;
    warnings: number;
    results: ValidationResult[];
    performanceReport?: ReturnType<typeof AnalyticsValidator.generatePerformanceReport>;
  }> {
    this.results = [];

    // Test 1: Analytics Overview Structure
    this.results.push(AnalyticsValidator.validateAnalyticsOverview(analyticsData));

    // Test 2: Individual Chart Data (charts should be passed separately)
    // Note: AnalyticsOverview doesn't include charts property
    // Chart validation should be done separately if needed

    // Test 3: Performance Analysis
    let performanceReport;
    if (performanceMetrics && performanceMetrics.length > 0) {
      performanceReport = AnalyticsValidator.generatePerformanceReport(performanceMetrics);
    }

    // Calculate summary
    const passed = this.results.filter(r => r.isValid).length;
    const failed = this.results.filter(r => !r.isValid).length;
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      passed,
      failed,
      warnings: totalWarnings,
      results: this.results,
      performanceReport,
    };
  }

  /**
   * Generate test report as HTML
   */
  generateHtmlReport(testResults: Awaited<ReturnType<AnalyticsTestSuite['runFullTestSuite']>>): string {
    const { passed, failed, warnings, results, performanceReport } = testResults;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-result.pass { border-left-color: #28a745; }
        .test-result.fail { border-left-color: #dc3545; }
        .performance { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Analytics System Test Report</h1>
    <div class="summary">
        <h2>Test Summary</h2>
        <p><span class="pass">✅ Passed: ${passed}</span></p>
        <p><span class="fail">❌ Failed: ${failed}</span></p>
        <p><span class="warning">⚠️ Warnings: ${warnings}</span></p>
    </div>
    
    <h2>Test Results</h2>
    ${results.map((result: ValidationResult, index: number) => `
        <div class="test-result ${result.isValid ? 'pass' : 'fail'}">
            <h3>Test ${index + 1}: ${result.isValid ? '✅ PASS' : '❌ FAIL'}</h3>
            ${result.errors.length > 0 ? `
                <h4>Errors:</h4>
                <ul>${result.errors.map((error: string) => `<li>${error}</li>`).join('')}</ul>
            ` : ''}
            ${result.warnings.length > 0 ? `
                <h4>Warnings:</h4>
                <ul>${result.warnings.map((warning: string) => `<li>${warning}</li>`).join('')}</ul>
            ` : ''}
        </div>
    `).join('')}
    
    ${performanceReport ? `
        <div class="performance">
            <h2>Performance Report</h2>
            <p><strong>Average Render Time:</strong> ${performanceReport.averageRenderTime.toFixed(2)}ms</p>
            <p><strong>Max Render Time:</strong> ${performanceReport.maxRenderTime.toFixed(2)}ms</p>
            <p><strong>Average Memory Usage:</strong> ${(performanceReport.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB</p>
            <p><strong>Max Memory Usage:</strong> ${(performanceReport.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB</p>
            
            <h3>Recommendations:</h3>
            <ul>${performanceReport.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
        </div>
    ` : ''}
    
    <footer>
        <p><em>Generated on ${new Date().toISOString()}</em></p>
    </footer>
</body>
</html>
    `;
  }
}