'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsTestSuite } from '@/lib/analytics/validation';
import { AnalyticsApiTester } from '@/lib/analytics/testing';
import { AnalyticsPeriod } from '@/lib/analytics/types';

// Local interfaces for this component

interface ApiTestResult {
  endpoint: string;
  success: boolean;
  status: number;
  responseTime: number;
  error?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface LoadTestResult {
  requestsPerSecond: number;
  averageResponseTime: number;
  successfulRequests: number;
  totalRequests: number;
}

interface DataQualityResult {
  dataQualityScore: number;
}

interface TestResults {
  validation: {
    passed: number;
    failed: number;
    warnings: number;
    results: ValidationResult[];
  };
  api: ApiTestResult[];
  loadTest: LoadTestResult;
  dataQuality: DataQualityResult;
  timestamp: string;
}

interface MonitoringState {
  isRunning: boolean;
  currentTest: string;
  progress: number;
  results: TestResults | null;
  error: string | null;
}

export default function AnalyticsMonitoringDashboard() {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    isRunning: false,
    currentTest: '',
    progress: 0,
    results: null,
    error: null,
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'api' | 'performance' | 'validation'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const runComprehensiveTests = useCallback(async () => {
    // Sample data for testing - matches OverviewMetrics & { period, conversionRate }
    const sampleAnalyticsData = {
      totalUsers: 1250,
      activeUsers: 420,
      totalListings: 340,
      totalBookings: 890,
      totalRevenue: 145000,
      growthRate: 15.5,
      satisfactionScore: 4.2,
      period: AnalyticsPeriod.LAST_30_DAYS,
      conversionRate: 3.2,
    };
    setMonitoringState(prev => ({ ...prev, isRunning: true, progress: 0, error: null }));

    try {
      // Test 1: Data Validation (20%)
      setMonitoringState(prev => ({ ...prev, currentTest: 'Running data validation tests...', progress: 10 }));
      const testSuite = new AnalyticsTestSuite();
      const validationResults = await testSuite.runFullTestSuite(sampleAnalyticsData);
      
      // Test 2: API Testing (40%)
      setMonitoringState(prev => ({ ...prev, currentTest: 'Testing API endpoints...', progress: 30 }));
      const apiTester = new AnalyticsApiTester();
      const apiResults = await apiTester.testAllEndpoints();
      
      // Test 3: Load Testing (60%)
      setMonitoringState(prev => ({ ...prev, currentTest: 'Running load tests...', progress: 50 }));
      const loadTestResults = await apiTester.loadTestEndpoint('/api/analytics/overview', {
        concurrentRequests: 5,
        totalRequests: 20,
        requestsPerSecond: 10,
      });

      // Test 4: Data Quality Testing (80%)
      setMonitoringState(prev => ({ ...prev, currentTest: 'Analyzing data quality...', progress: 70 }));
      const dataQualityResults = await apiTester.testDataQuality('/api/analytics/overview?period=LAST_7_DAYS&role=admin');

      // Test 5: Performance Analysis (100%)
      setMonitoringState(prev => ({ ...prev, currentTest: 'Generating performance report...', progress: 90 }));
      
      const finalResults = {
        validation: validationResults,
        api: apiResults,
        loadTest: loadTestResults,
        dataQuality: dataQualityResults,
        timestamp: new Date().toISOString(),
      };

      setMonitoringState(prev => ({
        ...prev,
        isRunning: false,
        currentTest: 'Tests completed successfully',
        progress: 100,
        results: finalResults,
      }));

    } catch (error) {
      setMonitoringState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!monitoringState.isRunning) {
        runComprehensiveTests();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, monitoringState.isRunning, runComprehensiveTests]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600 bg-green-50';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <p className={`text-2xl font-bold ${monitoringState.results ? 'text-green-600' : 'text-yellow-600'}`}>
                {monitoringState.results ? 'Healthy' : 'Checking...'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${monitoringState.results ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">API Success Rate</p>
              <p className={`text-2xl font-bold ${getStatusColor(
(monitoringState.results?.api?.filter((r: ApiTestResult) => r.success).length || 0) / (monitoringState.results?.api?.length || 1) * 100,
                { good: 95, warning: 85 }
              )}`}>
                {monitoringState.results ? 
                  `${Math.round(monitoringState.results.api.filter((r: ApiTestResult) => r.success).length / monitoringState.results.api.length * 100)}%` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className={`text-2xl font-bold ${getStatusColor(
2000 - ((monitoringState.results?.api?.reduce((sum: number, r: ApiTestResult) => sum + r.responseTime, 0) || 0) / (monitoringState.results?.api?.length || 1)),
                { good: 1500, warning: 1000 }
              )}`}>
                {monitoringState.results ? 
                  `${Math.round(monitoringState.results.api.reduce((sum: number, r: ApiTestResult) => sum + r.responseTime, 0) / monitoringState.results.api.length)}ms` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Quality Score</p>
              <p className={`text-2xl font-bold ${getStatusColor(
                monitoringState.results?.dataQuality?.dataQualityScore || 0,
                { good: 90, warning: 75 }
              )}`}>
                {monitoringState.results ? 
                  `${monitoringState.results.dataQuality.dataQualityScore}/100` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Test Results */}
      {monitoringState.results && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Test Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Validation Tests</span>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅ {monitoringState.results.validation.passed} passed</span>
                <span className="text-red-600">❌ {monitoringState.results.validation.failed} failed</span>
                <span className="text-yellow-600">⚠️ {monitoringState.results.validation.warnings} warnings</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">API Endpoints</span>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅ {monitoringState.results.api.filter((r: ApiTestResult) => r.success).length} working</span>
                <span className="text-red-600">❌ {monitoringState.results.api.filter((r: ApiTestResult) => !r.success).length} failing</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Load Test Performance</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚡ {monitoringState.results.loadTest.requestsPerSecond.toFixed(1)} req/s</span>
                <span className="text-purple-600">📊 {monitoringState.results.loadTest.averageResponseTime.toFixed(0)}ms avg</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date(monitoringState.results.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics System Monitoring
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time monitoring and testing of analytics infrastructure
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Auto-refresh:</label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                  disabled={!autoRefresh}
                >
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>
              </div>

              {/* Run tests button */}
              <button
                onClick={runComprehensiveTests}
                disabled={monitoringState.isRunning}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {monitoringState.isRunning && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {monitoringState.isRunning ? 'Running Tests...' : 'Run Tests'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {monitoringState.isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{monitoringState.currentTest}</span>
                <span>{monitoringState.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${monitoringState.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {monitoringState.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">Error: {monitoringState.error}</p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'api', name: 'API Tests', icon: '🔗' },
              { id: 'performance', name: 'Performance', icon: '⚡' },
              { id: 'validation', name: 'Validation', icon: '✅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'api' | 'performance' | 'validation')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {selectedTab === 'overview' && renderOverviewTab()}
          
          {selectedTab === 'api' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoint Tests</h3>
              {monitoringState.results?.api ? (
                <div className="space-y-2">
                  {monitoringState.results.api.map((result: ApiTestResult, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{result.endpoint}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {result.status}
                          </span>
                          <span className="text-sm text-gray-600">{Math.round(result.responseTime)}ms</span>
                        </div>
                      </div>
                      {result.error && (
                        <p className="text-red-600 text-sm mt-1">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Run tests to see API endpoint results</p>
              )}
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              {monitoringState.results?.loadTest ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Requests Per Second</p>
                    <p className="text-2xl font-bold text-blue-900">{monitoringState.results.loadTest.requestsPerSecond.toFixed(1)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Average Response Time</p>
                    <p className="text-2xl font-bold text-green-900">{Math.round(monitoringState.results.loadTest.averageResponseTime)}ms</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.round((monitoringState.results.loadTest.successfulRequests / monitoringState.results.loadTest.totalRequests) * 100)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Run tests to see performance metrics</p>
              )}
            </div>
          )}

          {selectedTab === 'validation' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Validation Results</h3>
              {monitoringState.results?.validation ? (
                <div className="space-y-4">
                  {monitoringState.results.validation.results.map((result: ValidationResult, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border ${result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Validation Test {index + 1}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.isValid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {result.isValid ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-800">Errors:</p>
                          <ul className="text-sm text-red-700 ml-4">
                            {result.errors.map((error: string, i: number) => (
                              <li key={i}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                          <ul className="text-sm text-yellow-700 ml-4">
                            {result.warnings.map((warning: string, i: number) => (
                              <li key={i}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Run tests to see validation results</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}