'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Shield, 
  ArrowLeft,
  Filter,
  Eye,
  AlertTriangle,
  Activity,
  User,
  Settings,
  FileText,
  Search,
  Calendar,
  MapPin,
  Monitor,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  RotateCcw,
  Check
} from 'lucide-react';
import { redirect, useRouter } from 'next/navigation';

interface SecurityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTH' | 'USER_MANAGEMENT' | 'LISTING_MANAGEMENT' | 'SYSTEM' | 'SECURITY';
}

interface SecurityStats {
  total: number;
  today: number;
  thisWeek: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  categories: {
    AUTH: number;
    USER_MANAGEMENT: number;
    LISTING_MANAGEMENT: number;
    SYSTEM: number;
    SECURITY: number;
  };
}

interface SecurityLogsResponse {
  success: boolean;
  data: SecurityLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: SecurityStats;
  filters: {
    category?: string;
    severity?: string;
    userId?: string;
  };
}

export default function SecurityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 25,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [isViewingLog, setIsViewingLog] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sorting, setSorting] = useState({
    sortBy: 'timestamp',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  // Page size options
  const pageSizeOptions = [10, 25, 50, 100];
  
  // Clearing state for user feedback
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const fetchSecurityLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        ...(filters.category && { category: filters.category }),
        ...(filters.severity && { severity: filters.severity })
      });

      const response = await fetch(`/api/admin/security-logs?${params}`);
      
      if (response.ok) {
        const data: SecurityLogsResponse = await response.json();
        setLogs(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch security logs');
      }
    } catch (error) {
      console.error('Error fetching security logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, filters.category, filters.severity, sorting.sortBy, sorting.sortOrder]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      redirect('/auth/signin');
    }
    fetchSecurityLogs();
  }, [session, status, pagination.currentPage, pagination.itemsPerPage, filters.category, filters.severity, sorting.sortBy, sorting.sortOrder, fetchSecurityLogs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AUTH': return <User className="h-4 w-4" />;
      case 'USER_MANAGEMENT': return <Settings className="h-4 w-4" />;
      case 'LISTING_MANAGEMENT': return <FileText className="h-4 w-4" />;
      case 'SYSTEM': return <Monitor className="h-4 w-4" />;
      case 'SECURITY': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTH': return 'bg-blue-100 text-blue-800';
      case 'USER_MANAGEMENT': return 'bg-purple-100 text-purple-800';
      case 'LISTING_MANAGEMENT': return 'bg-emerald-100 text-emerald-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-800';
      case 'SECURITY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (field: string) => {
    if (sorting.sortBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sorting.sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const handleViewLog = (log: SecurityLog) => {
    setSelectedLog(log);
    setIsViewingLog(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage: newSize, currentPage: 1 }));
  };

  const handleSortChange = (field: string) => {
    setSorting(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when filtering
  };

  const clearFilters = async () => {
    console.log('Clearing all filters...');
    setIsClearing(true);
    setClearSuccess(false);
    
    try {
      // Reset all filter states
      setFilters({ category: '', severity: '', search: '' });
      setSorting({ sortBy: 'timestamp', sortOrder: 'desc' });
      setPagination(prev => ({ ...prev, currentPage: 1, itemsPerPage: 25 }));
      
      // Small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setClearSuccess(true);
      console.log('Filters cleared successfully');
      
      // Hide success message after 1.5 seconds
      setTimeout(() => setClearSuccess(false), 1500);
    } catch (error) {
      console.error('Error clearing filters:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Filter logs by search term (client-side filtering for search)
  const filteredLogs = filters.search 
    ? logs.filter(log => 
        log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(filters.search.toLowerCase())
      )
    : logs;

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading security logs..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Security Logs
            </h1>
            <p className="text-muted-foreground">Monitor system activities and security events</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {(filters.category || filters.severity || filters.search) && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {[filters.category, filters.severity, filters.search].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">Total Events</CardTitle>
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">{stats.total.toLocaleString()}</div>
              <p className="text-sm text-blue-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">Today</CardTitle>
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">{stats.today}</div>
              <p className="text-sm text-green-600 mt-1">{stats.thisWeek} this week</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700">Critical Events</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-800">{stats.critical}</div>
              <p className="text-sm text-orange-600 mt-1">{stats.high} high priority</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">Security Events</CardTitle>
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.categories.SECURITY}</div>
              <p className="text-sm text-purple-600 mt-1">Security category</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter security logs by category, severity, or search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="AUTH">Authentication</option>
                  <option value="USER_MANAGEMENT">User Management</option>
                  <option value="LISTING_MANAGEMENT">Listing Management</option>
                  <option value="SYSTEM">System</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Severity</label>
                <select 
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Items per page</label>
                <select 
                  value={pagination.itemsPerPage}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={isClearing || (!filters.category && !filters.severity && !filters.search && sorting.sortBy === 'timestamp' && sorting.sortOrder === 'desc' && pagination.itemsPerPage === 25)}
                className={`px-4 py-2 min-w-[160px] transition-colors duration-200 ${
                  clearSuccess ? 'bg-green-50 border-green-200 text-green-700' : ''
                }`}
              >
                {isClearing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Clearing...</span>
                  </div>
                ) : clearSuccess ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Cleared!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear All Filters</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Security Events</CardTitle>
          <CardDescription>
            {pagination.totalItems > 0 
              ? `Showing ${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of ${pagination.totalItems} events`
              : 'No security events found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="p-4 font-medium">
                    <button 
                      onClick={() => handleSortChange('timestamp')}
                      className="flex items-center gap-1 hover:text-blue-600 focus:outline-none"
                    >
                      Timestamp
                      {getSortIcon('timestamp')}
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button 
                      onClick={() => handleSortChange('userName')}
                      className="flex items-center gap-1 hover:text-blue-600 focus:outline-none"
                    >
                      User
                      {getSortIcon('userName')}
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button 
                      onClick={() => handleSortChange('action')}
                      className="flex items-center gap-1 hover:text-blue-600 focus:outline-none"
                    >
                      Action
                      {getSortIcon('action')}
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button 
                      onClick={() => handleSortChange('category')}
                      className="flex items-center gap-1 hover:text-blue-600 focus:outline-none"
                    >
                      Category
                      {getSortIcon('category')}
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button 
                      onClick={() => handleSortChange('severity')}
                      className="flex items-center gap-1 hover:text-blue-600 focus:outline-none"
                    >
                      Severity
                      {getSortIcon('severity')}
                    </button>
                  </th>
                  <th className="p-4 font-medium">IP Address</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      <div className="font-medium">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-sm">{log.userName}</div>
                        <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{log.action}</div>
                      <div className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.details}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getCategoryColor(log.category)} flex items-center gap-1 w-fit`}>
                        {getCategoryIcon(log.category)}
                        {log.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-mono">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {log.ipAddress}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewLog(log)}
                        title="View log details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} events
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center mt-6">
        <Button 
          onClick={fetchSecurityLogs}
          className="px-6 py-2"
          variant="outline"
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      {/* Log Details Modal */}
      {isViewingLog && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {getCategoryIcon(selectedLog.category)}
                    Security Event Details
                  </h2>
                  <p className="text-muted-foreground">Event ID: {selectedLog.id}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsViewingLog(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Event Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Action</h3>
                    <p className="font-medium">{selectedLog.action}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Timestamp</h3>
                    <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Details</h3>
                  <p className="p-3 bg-gray-50 rounded border">{selectedLog.details}</p>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">User</h3>
                    <p className="font-medium">{selectedLog.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">User ID</h3>
                    <p className="font-mono text-sm">{selectedLog.userId}</p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">IP Address</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{selectedLog.ipAddress}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">User Agent</h3>
                    <p className="text-sm font-mono p-2 bg-gray-50 rounded border break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Category</h3>
                    <Badge className={`${getCategoryColor(selectedLog.category)} flex items-center gap-1 w-fit`}>
                      {getCategoryIcon(selectedLog.category)}
                      {selectedLog.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Severity</h3>
                    <Badge className={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}