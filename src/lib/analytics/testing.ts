import { AnalyticsPeriod } from './types';

// Define UserRole locally since it's not exported from types
export enum UserRole {
  ADMIN = 'admin',
  LANDLORD = 'landlord',
  TENANT = 'tenant'
}

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  data?: unknown;
}

export interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
}

export class AnalyticsApiTester {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test a single API endpoint
   */
  async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>,
    headers: Record<string, string> = {}
  ): Promise<ApiTestResult> {
    const startTime = performance.now();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      return {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        responseTime,
        data,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        endpoint,
        method,
        status: 0,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test all analytics API endpoints
   */
  async testAllEndpoints(): Promise<ApiTestResult[]> {
    const endpoints = [
      '/api/analytics/overview?period=LAST_7_DAYS&role=admin',
      '/api/analytics/overview?period=LAST_30_DAYS&role=admin',
      '/api/analytics/overview?period=LAST_7_DAYS&role=landlord',
      '/api/analytics/user-behavior?period=LAST_7_DAYS',
      '/api/analytics/revenue?period=LAST_30_DAYS',
      '/api/analytics/listings?period=LAST_7_DAYS',
      '/api/analytics/bookings?period=LAST_7_DAYS',
    ];

    const results: ApiTestResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const result = await this.testEndpoint(endpoint);
        results.push(result);
        
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          endpoint,
          method: 'GET',
          status: 0,
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Load test a specific endpoint
   */
  async loadTestEndpoint(
    endpoint: string,
    options: {
      concurrentRequests?: number;
      totalRequests?: number;
      requestsPerSecond?: number;
    } = {}
  ): Promise<LoadTestResult> {
    const {
      concurrentRequests = 10,
      totalRequests = 100,
      requestsPerSecond = 10,
    } = options;

    const results: ApiTestResult[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    // Calculate delay between batches to maintain desired RPS
    const batchDelay = (concurrentRequests / requestsPerSecond) * 1000;

    for (let i = 0; i < totalRequests; i += concurrentRequests) {
      const batchStartTime = Date.now();
      const batchSize = Math.min(concurrentRequests, totalRequests - i);
      
      // Create batch of concurrent requests
      const batchPromises = Array.from({ length: batchSize }, () =>
        this.testEndpoint(endpoint)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Collect errors
        batchResults.forEach(result => {
          if (!result.success && result.error) {
            errors.push(result.error);
          }
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      // Maintain desired requests per second
      const batchDuration = Date.now() - batchStartTime;
      const remainingDelay = batchDelay - batchDuration;
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }
    }

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000; // in seconds

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const responseTimes = results.map(r => r.responseTime);

    return {
      endpoint,
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: results.length / totalDuration,
      errors: [...new Set(errors)], // Remove duplicates
    };
  }

  /**
   * Test endpoint with various parameters
   */
  async testEndpointVariations(baseEndpoint: string): Promise<ApiTestResult[]> {
    const variations = [
      // Different time periods
      ...Object.values(AnalyticsPeriod).map(period => 
        `${baseEndpoint}?period=${period}&role=admin`
      ),
      // Different roles
      ...Object.values(UserRole).map(role => 
        `${baseEndpoint}?period=LAST_7_DAYS&role=${role}`
      ),
      // Invalid parameters (should return 400)
      `${baseEndpoint}?period=INVALID&role=admin`,
      `${baseEndpoint}?period=LAST_7_DAYS&role=INVALID`,
      `${baseEndpoint}?period=&role=admin`,
      // Missing parameters
      `${baseEndpoint}?role=admin`,
      `${baseEndpoint}?period=LAST_7_DAYS`,
      baseEndpoint,
    ];

    const results: ApiTestResult[] = [];

    for (const endpoint of variations) {
      try {
        const result = await this.testEndpoint(endpoint);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        results.push({
          endpoint,
          method: 'GET',
          status: 0,
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Test API response data quality
   */
  async testDataQuality(endpoint: string): Promise<{
    endpoint: string;
    dataQualityScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    const result = await this.testEndpoint(endpoint);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let qualityScore = 100;

    if (!result.success) {
      issues.push(`Endpoint failed with status ${result.status}`);
      qualityScore -= 50;
    }

    if (result.data) {
      // Check for null values
      const nullCount = this.countNullValues(result.data);
      if (nullCount > 0) {
        issues.push(`Found ${nullCount} null values in response`);
        qualityScore -= Math.min(nullCount * 2, 20);
      }

      // Check for empty arrays
      const emptyArrayCount = this.countEmptyArrays(result.data);
      if (emptyArrayCount > 0) {
        issues.push(`Found ${emptyArrayCount} empty arrays in response`);
        qualityScore -= Math.min(emptyArrayCount * 5, 15);
      }

      // Check for missing expected fields
      const expectedFields = ['metrics', 'charts'];
      const dataObj = result.data as Record<string, unknown>;
      const missingFields = expectedFields.filter(field => !(field in dataObj));
      if (missingFields.length > 0) {
        issues.push(`Missing expected fields: ${missingFields.join(', ')}`);
        qualityScore -= missingFields.length * 10;
      }

      // Check data freshness (timestamps should be recent)
      if ('lastUpdated' in dataObj && dataObj.lastUpdated) {
        const lastUpdate = new Date(dataObj.lastUpdated as string);
        const hoursOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 24) {
          issues.push(`Data is ${hoursOld.toFixed(1)} hours old`);
          qualityScore -= Math.min(hoursOld, 20);
          recommendations.push('Consider implementing real-time data updates');
        }
      }

      // Check for reasonable data ranges
      if ('metrics' in dataObj && dataObj.metrics) {
        const metrics = dataObj.metrics as Record<string, unknown>;
        if (typeof metrics.totalUsers === 'number' && metrics.totalUsers < 0) {
          issues.push('Negative user count detected');
          qualityScore -= 15;
        }
        if (typeof metrics.totalRevenue === 'number' && metrics.totalRevenue < 0) {
          issues.push('Negative revenue detected');
          qualityScore -= 15;
        }
      }
    }

    // Response time quality
    if (result.responseTime > 2000) {
      issues.push(`Slow response time: ${result.responseTime.toFixed(0)}ms`);
      qualityScore -= 10;
      recommendations.push('Consider implementing caching or query optimization');
    }

    if (qualityScore < 80) {
      recommendations.push('Review data validation and error handling');
    }

    if (issues.length === 0) {
      recommendations.push('Data quality is good! Continue monitoring');
    }

    return {
      endpoint,
      dataQualityScore: Math.max(0, qualityScore),
      issues,
      recommendations,
    };
  }

  private countNullValues(obj: unknown, count = 0): number {
    if (obj === null) return count + 1;
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.reduce((acc: number, item: unknown) => acc + this.countNullValues(item), count);
      }
      return Object.values(obj as Record<string, unknown>).reduce((acc: number, value: unknown) => acc + this.countNullValues(value), count);
    }
    return count;
  }

  private countEmptyArrays(obj: unknown, count = 0): number {
    if (Array.isArray(obj)) {
      if (obj.length === 0) count++;
      return obj.reduce((acc: number, item: unknown) => acc + this.countEmptyArrays(item), count);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj as Record<string, unknown>).reduce((acc: number, value: unknown) => acc + this.countEmptyArrays(value), count);
    }
    return count;
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(
    apiResults: ApiTestResult[],
    loadTestResults?: LoadTestResult[],
    dataQualityResults?: Awaited<ReturnType<AnalyticsApiTester['testDataQuality']>>[]
  ): {
    summary: {
      totalEndpoints: number;
      successfulEndpoints: number;
      failedEndpoints: number;
      averageResponseTime: number;
      overallSuccessRate: number;
    };
    details: {
      apiResults: ApiTestResult[];
      loadTestResults?: LoadTestResult[];
      dataQualityResults?: Awaited<ReturnType<AnalyticsApiTester['testDataQuality']>>[];
    };
    recommendations: string[];
  } {
    const successful = apiResults.filter(r => r.success).length;
    const failed = apiResults.filter(r => !r.success).length;
    const avgResponseTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / apiResults.length;
    const successRate = (successful / apiResults.length) * 100;

    const recommendations: string[] = [];

    if (successRate < 90) {
      recommendations.push('Low API success rate detected. Review error handling and server stability.');
    }

    if (avgResponseTime > 1000) {
      recommendations.push('High average response time. Consider caching or query optimization.');
    }

    if (loadTestResults) {
      const poorPerformance = loadTestResults.filter(r => r.averageResponseTime > 2000);
      if (poorPerformance.length > 0) {
        recommendations.push('Some endpoints perform poorly under load. Consider scaling strategies.');
      }
    }

    if (dataQualityResults) {
      const lowQuality = dataQualityResults.filter(r => r.dataQualityScore < 80);
      if (lowQuality.length > 0) {
        recommendations.push('Data quality issues detected. Review data validation and integrity.');
      }
    }

    return {
      summary: {
        totalEndpoints: apiResults.length,
        successfulEndpoints: successful,
        failedEndpoints: failed,
        averageResponseTime: avgResponseTime,
        overallSuccessRate: successRate,
      },
      details: {
        apiResults,
        loadTestResults,
        dataQualityResults,
      },
      recommendations,
    };
  }
}