'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Home, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Ban,
  UnlockKeyhole,
  Calendar,
  MapPin,
  Edit
} from 'lucide-react';
import { redirect } from 'next/navigation';

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingReviews: number;
  reportedListings: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

interface UserManagementData {
  id: string;
  name: string;
  email: string;
  role: 'BACHELOR' | 'LANDLORD';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: string;
  lastLogin?: string;
  totalBookings?: number;
  totalListings?: number;
}

interface ListingModerationData {
  id: string;
  title: string;
  landlordName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPORTED';
  location: string;
  monthlyRent?: number;
  price?: number;
  createdAt: string;
  reportCount?: number;
  lastReported?: string;
}

interface ReviewModerationData {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  listingTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reportCount?: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserManagementData[]>([]);
  const [listings, setListings] = useState<ListingModerationData[]>([]);
  const [reviews, setReviews] = useState<ReviewModerationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const itemsPerPage = 10;

  // View states
  const [selectedListing, setSelectedListing] = useState<ListingModerationData | null>(null);
  const [isViewingListing, setIsViewingListing] = useState(false);

  // Confirmation states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | null;
    listingId: string;
    listingTitle: string;
  }>({ type: null, listingId: '', listingTitle: '' });

  // Date range export states
  const [showDateExport, setShowDateExport] = useState<{
    show: boolean;
    type: 'users' | 'listings' | 'reviews' | null;
  }>({ show: false, type: null });
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: '', endDate: '' });

  // User management states
  const [selectedUser, setSelectedUser] = useState<UserManagementData | null>(null);
  const [isViewingUser, setIsViewingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<{
    name: string;
    email: string;
    role: 'BACHELOR' | 'LANDLORD';
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    password: string;
    notes: string;
  }>({ name: '', email: '', role: 'BACHELOR', status: 'ACTIVE', password: '', notes: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmUserAction, setConfirmUserAction] = useState<{
    type: 'suspend' | 'activate' | 'ban' | 'reactivate' | null;
    userId: string;
    userName: string;
    userStatus: string;
  }>({ type: null, userId: '', userName: '', userStatus: '' });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      redirect('/auth/signin');
    }
    fetchAdminData();
  }, [session, status]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes, listingsRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/listings'),
        fetch('/api/admin/reviews')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (listingsRes.ok) setListings(await listingsRes.json());
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban' | 'reactivate') => {
    try {
      console.log('Sending user action request:', { userId, action });
      
      // Map reactivate to activate for API compatibility
      const apiAction = action === 'reactivate' ? 'activate' : action;
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction })
      });

      console.log('User action response status:', response.status);

      if (response.ok) {
        console.log('User action successful');
        fetchAdminData(); // Refresh data
      } else {
        const errorText = await response.text();
        console.error('User action failed:', {
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleListingAction = async (listingId: string, action: 'approve' | 'reject' | 'ban') => {
    try {
      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
        // Reset confirmation state
        setConfirmAction({ type: null, listingId: '', listingTitle: '' });
      }
    } catch (error) {
      console.error('Error updating listing:', error);
    }
  };

  const handleConfirmAction = (listingId: string, action: 'approve' | 'reject', listingTitle: string) => {
    setConfirmAction({ type: action, listingId, listingTitle });
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const exportToCSV = (data: Record<string, string | number>[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          // Create a normalized key from header (remove spaces, convert to lowercase)
          const normalizedKey = header.toLowerCase().replace(/\s+/g, '');
          const value = row[normalizedKey] || row[header] || '';
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
            ? `"${stringValue}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportUsers = (startDate?: string, endDate?: string) => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login', 'Total Bookings', 'Total Listings'];
    const filteredUsers = startDate || endDate ? filterDataByDateRange(users, startDate || '', endDate || '') : users;
    const exportData = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdat: new Date(user.createdAt).toLocaleDateString(),
      lastlogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      totalbookings: user.totalBookings || 0,
      totallistings: user.totalListings || 0
    }));
    const filename = startDate || endDate ? `users_export_${startDate || 'all'}_to_${endDate || 'now'}` : 'users_export';
    exportToCSV(exportData, filename, headers);
  };

  const handleExportListings = (startDate?: string, endDate?: string) => {
    const headers = ['Title', 'Landlord', 'Status', 'Monthly Rent', 'Location', 'Created At', 'Report Count'];
    const filteredListings = startDate || endDate ? filterDataByDateRange(listings, startDate || '', endDate || '') : listings;
    const exportData = filteredListings.map(listing => ({
      title: listing.title,
      landlord: listing.landlordName,
      status: listing.status,
      monthlyrent: listing.monthlyRent || 0,
      location: listing.location || 'Not specified',
      createdat: new Date(listing.createdAt).toLocaleDateString(),
      reportcount: listing.reportCount || 0
    }));
    const filename = startDate || endDate ? `listings_export_${startDate || 'all'}_to_${endDate || 'now'}` : 'listings_export';
    exportToCSV(exportData, filename, headers);
  };

  const handleExportReviews = (startDate?: string, endDate?: string) => {
    const headers = ['Reviewer', 'Rating', 'Comment', 'Listing Title', 'Status', 'Created At', 'Report Count'];
    const filteredReviews = startDate || endDate ? filterDataByDateRange(reviews, startDate || '', endDate || '') : reviews;
    const exportData = filteredReviews.map(review => ({
      reviewer: review.reviewerName,
      rating: review.rating,
      comment: review.comment,
      listingtitle: review.listingTitle,
      status: review.status,
      createdat: new Date(review.createdAt).toLocaleDateString(),
      reportcount: review.reportCount || 0
    }));
    const filename = startDate || endDate ? `reviews_export_${startDate || 'all'}_to_${endDate || 'now'}` : 'reviews_export';
    exportToCSV(exportData, filename, headers);
  };

  const handleShowDateExport = (type: 'users' | 'listings' | 'reviews') => {
    setShowDateExport({ show: true, type });
    setDateRange({ startDate: '', endDate: '' });
  };

  const handleDateExport = () => {
    if (showDateExport.type === 'users') {
      handleExportUsers(dateRange.startDate, dateRange.endDate);
    } else if (showDateExport.type === 'listings') {
      handleExportListings(dateRange.startDate, dateRange.endDate);
    } else if (showDateExport.type === 'reviews') {
      handleExportReviews(dateRange.startDate, dateRange.endDate);
    }
    setShowDateExport({ show: false, type: null });
  };

  const handleViewUser = async (userId: string) => {
    // First try to use existing user data from the list
    const existingUser = users.find(u => u.id === userId);
    if (existingUser) {
      setSelectedUser(existingUser);
      setIsViewingUser(true);
      return;
    }

    // Fallback: try to fetch from API if user not found in list
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setIsViewingUser(true);
      } else {
        console.error('User not found in API or list');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleEditUser = (user: UserManagementData) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '', // Leave empty for optional password change
      notes: '' // Admin notes for changes
    });
    setShowPassword(false); // Reset password visibility
    setIsViewingUser(false); // Close view modal if open
    setIsEditingUser(true);
  };

  const handleConfirmUserAction = (userId: string, action: 'suspend' | 'activate' | 'ban' | 'reactivate', userName: string, userStatus: string) => {
    setConfirmUserAction({ type: action, userId, userName, userStatus });
  };

  const executeUserAction = async () => {
    if (confirmUserAction.type && confirmUserAction.userId) {
      await handleUserAction(confirmUserAction.userId, confirmUserAction.type);
      setConfirmUserAction({ type: null, userId: '', userName: '', userStatus: '' });
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;

    try {
      console.log('Sending user update request:', {
        userId: selectedUser.id,
        data: {
          name: editUserData.name,
          email: editUserData.email,
          role: editUserData.role,
          status: editUserData.status,
          notes: editUserData.notes
        }
      });

      const requestBody: {
        name: string;
        email: string;
        role: string;
        status: string;
        notes: string;
        password?: string;
      } = {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        status: editUserData.status,
        notes: editUserData.notes
      };

      // Only include password if it's provided
      if (editUserData.password.trim()) {
        requestBody.password = editUserData.password;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (response.ok) {
        // Parse JSON if response is OK
        try {
          JSON.parse(responseData);
        } catch {
          console.log('Response is not JSON, treating as success');
        }

        // Update local user data
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, name: editUserData.name, email: editUserData.email, role: editUserData.role, status: editUserData.status }
            : user
        ));
        
        // Close edit modal and show success
        setIsEditingUser(false);
        setSelectedUser(null);
        console.log('User updated successfully');
        
        // Refresh data to get latest from server
        fetchAdminData();
      } else {
        let errorMessage = 'Failed to update user';
        try {
          const errorData = JSON.parse(responseData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = responseData || errorMessage;
        }
        console.error('Failed to update user:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        alert(`Failed to update user: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewListing = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        const listingData = data.data || data;
        
        // Convert to our interface format
        const formattedListing: ListingModerationData = {
          id: listingData.id,
          title: listingData.title,
          landlordName: listingData.landlord?.name || 'Unknown',
          status: listingData.status,
          location: listingData.location || listingData.address || listingData.city,
          monthlyRent: listingData.monthlyRent || listingData.price,
          price: listingData.price,
          createdAt: listingData.createdAt,
          reportCount: listingData.reportCount || 0
        };
        
        setSelectedListing(formattedListing);
        setIsViewingListing(true);
      }
    } catch (error) {
      console.error('Error fetching listing details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': case 'REJECTED': return 'bg-orange-100 text-orange-800';
      case 'BANNED': case 'REPORTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination helpers
  const getPaginatedData = <T,>(data: T[], currentPage: number): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const filterDataByDateRange = <T extends { createdAt: string }>(data: T[], startDate: string, endDate: string): T[] => {
    if (!startDate && !endDate) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
      
      return itemDate >= start && itemDate <= end;
    });
  };

  const PaginationControls = ({ currentPage, totalItems, onPageChange }: {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = getTotalPages(totalItems);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2)
              )
              .map((page, index, array) => {
                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                return (
                  <div key={page} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  </div>
                );
              })
            }
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, listings, and platform activities
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Security Logs
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newUsersThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalListings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.reportedListings} reported
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ৳{stats?.totalRevenue?.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting moderation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="listings">Listing Moderation</TabsTrigger>
          <TabsTrigger value="reviews">Review Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(listings) && listings.filter(l => l.status === 'PENDING').slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{listing.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {listing.landlordName}
                      </p>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {listing.status}
                    </Badge>
                  </div>
                ))}
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('listings')}
                  >
                    View All Pending
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users ({users.filter(u => u.status === 'ACTIVE').length} active)
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('listings')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Moderate Listings ({listings.filter(l => l.status === 'PENDING').length} pending)
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('reviews')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Review Comments ({reviews.filter(r => r.status === 'PENDING').length} pending)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-muted-foreground">
                Manage user accounts and permissions ({users.length} users loaded)
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleExportUsers()}>
                <Users className="h-4 w-4 mr-2" />
                Export All Users
              </Button>
              <Button variant="outline" onClick={() => handleShowDateExport('users')}>
                Export by Date
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Last Login</th>
                      <th className="p-4 font-medium">Activity</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedData(users, userPage).map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{user.role}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-4 text-sm">
                          {user.role === 'LANDLORD' 
                            ? `${user.totalListings || 0} listings`
                            : `${user.totalBookings || 0} bookings`
                          }
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                console.log('View user clicked:', user.id, user.name);
                                handleViewUser(user.id);
                              }}
                              title="View user details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                console.log('Edit user clicked:', user.id, user.name);
                                handleEditUser(user);
                              }}
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.status === 'ACTIVE' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleConfirmUserAction(user.id, 'suspend', user.name, user.status)}
                                title="Suspend user"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : user.status === 'SUSPENDED' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleConfirmUserAction(user.id, 'activate', user.name, user.status)}
                                title="Activate user"
                              >
                                <UnlockKeyhole className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleConfirmUserAction(user.id, 'reactivate', user.name, user.status)}
                                title="Reactivate user"
                              >
                                <UnlockKeyhole className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={userPage}
                totalItems={users.length}
                onPageChange={setUserPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listing Moderation Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Listing Moderation</h2>
              <p className="text-muted-foreground">Review and moderate property listings</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleExportListings()}>
                <Home className="h-4 w-4 mr-2" />
                Export All Listings
              </Button>
              <Button variant="outline" onClick={() => handleShowDateExport('listings')}>
                Export by Date
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Listing</th>
                      <th className="p-4 font-medium">Landlord</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Rent</th>
                      <th className="p-4 font-medium">Reports</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(listings) && getPaginatedData(listings, listingPage).map((listing) => (
                      <tr key={listing.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{listing.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.location || 'Location not specified'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{listing.landlordName}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(listing.status)}>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">
                          ৳{(listing.monthlyRent || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {listing.reportCount ? (
                            <Badge variant="destructive" className="text-xs">
                              {listing.reportCount} reports
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewListing(listing.id)}
                              title="View listing details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {listing.status === 'PENDING' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleConfirmAction(listing.id, 'approve', listing.title)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleConfirmAction(listing.id, 'reject', listing.title)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={listingPage}
                totalItems={listings.length}
                onPageChange={setListingPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Management Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Review Management</h2>
              <p className="text-muted-foreground">Moderate user reviews and ratings</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleExportReviews()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Export All Reviews
              </Button>
              <Button variant="outline" onClick={() => handleShowDateExport('reviews')}>
                Export by Date
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4">
              {getPaginatedData(reviews, reviewPage).map((review) => (
                <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.reviewerName}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <Badge className={getStatusColor(review.status)}>
                          {review.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Review for: {review.listingTitle}
                      </p>
                      <p className="text-sm">{review.comment}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {review.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleReviewAction(review.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReviewAction(review.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Submitted: {new Date(review.createdAt).toLocaleDateString()}</span>
                    {review.reportCount && (
                      <span className="text-red-600">
                        Reported {review.reportCount} times
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            {reviews.length > 0 && (
              <Card>
                <PaginationControls
                  currentPage={reviewPage}
                  totalItems={reviews.length}
                  onPageChange={setReviewPage}
                />
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Listing Details Modal */}
      {isViewingListing && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedListing.title}</h2>
                  <p className="text-muted-foreground">Listing Details</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsViewingListing(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Landlord</h3>
                    <p>{selectedListing.landlordName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                    <Badge className={getStatusColor(selectedListing.status)}>
                      {selectedListing.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Monthly Rent</h3>
                    <p className="text-lg font-semibold">৳{(selectedListing.monthlyRent || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Reports</h3>
                    <p className={selectedListing.reportCount ? 'text-red-600' : 'text-green-600'}>
                      {selectedListing.reportCount || 0} reports
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Location</h3>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedListing.location || 'Location not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Created</h3>
                  <p>{new Date(selectedListing.createdAt).toLocaleDateString()}</p>
                </div>

                {selectedListing.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        handleConfirmAction(selectedListing.id, 'approve', selectedListing.title);
                        setIsViewingListing(false);
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Listing
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        handleConfirmAction(selectedListing.id, 'reject', selectedListing.title);
                        setIsViewingListing(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Listing
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={confirmAction.type !== null} onOpenChange={() => setConfirmAction({ type: null, listingId: '', listingTitle: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === 'approve' ? 'Approve Listing?' : 'Reject Listing?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'approve' 
                ? `Are you sure you want to approve "${confirmAction.listingTitle}"? This will make the listing visible to all users.`
                : `Are you sure you want to reject "${confirmAction.listingTitle}"? This action will prevent the listing from being published.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction({ type: null, listingId: '', listingTitle: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction.type && confirmAction.listingId) {
                  handleListingAction(confirmAction.listingId, confirmAction.type);
                }
              }}
              className={confirmAction.type === 'reject' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              {confirmAction.type === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Date Export Modal */}
      <AlertDialog open={showDateExport.show} onOpenChange={() => setShowDateExport({ show: false, type: null })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Export {showDateExport.type ? showDateExport.type.charAt(0).toUpperCase() + showDateExport.type.slice(1) : 'Data'} by Date Range</AlertDialogTitle>
            <AlertDialogDescription>
              Select a date range to filter the export. Leave fields empty to include all dates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                placeholder="Select end date"
              />
            </div>
            {dateRange.startDate && dateRange.endDate && new Date(dateRange.startDate) > new Date(dateRange.endDate) && (
              <p className="text-sm text-red-600">Start date should be before end date</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDateExport({ show: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDateExport}
              disabled={!!(dateRange.startDate && dateRange.endDate && new Date(dateRange.startDate) > new Date(dateRange.endDate))}
            >
              Export Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details View Modal */}
      {isViewingUser && selectedUser && (
        // Debug: {console.log('Rendering user view modal:', { isViewingUser, selectedUser: selectedUser?.name })}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                  <p className="text-muted-foreground">User Details</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Closing user view modal');
                    setIsViewingUser(false);
                    setSelectedUser(null);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Email</h3>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Role</h3>
                    <Badge variant="outline">{selectedUser.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Last Login</h3>
                    <p>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Member Since</h3>
                    <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Activity</h3>
                    <p>
                      {selectedUser.role === 'LANDLORD' 
                        ? `${selectedUser.totalListings || 0} listings created`
                        : `${selectedUser.totalBookings || 0} bookings made`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      setIsViewingUser(false);
                      handleEditUser(selectedUser);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                  {selectedUser.status === 'ACTIVE' ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsViewingUser(false);
                        handleConfirmUserAction(selectedUser.id, 'suspend', selectedUser.name, selectedUser.status);
                      }}
                      className="flex-1"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  ) : selectedUser.status === 'SUSPENDED' ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsViewingUser(false);
                        handleConfirmUserAction(selectedUser.id, 'activate', selectedUser.name, selectedUser.status);
                      }}
                      className="flex-1"
                    >
                      <UnlockKeyhole className="h-4 w-4 mr-2" />
                      Activate User
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsViewingUser(false);
                        handleConfirmUserAction(selectedUser.id, 'reactivate', selectedUser.name, selectedUser.status);
                      }}
                      className="flex-1"
                    >
                      <UnlockKeyhole className="h-4 w-4 mr-2" />
                      Reactivate User
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {isEditingUser && selectedUser && (
        // Debug: {console.log('Rendering user edit modal:', { isEditingUser, selectedUser: selectedUser?.name })}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">Edit User</h2>
                  <p className="text-muted-foreground">{selectedUser.name}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Closing user edit modal');
                    setIsEditingUser(false);
                    setSelectedUser(null);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Editable user info fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input 
                      value={editUserData.name} 
                      onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                      placeholder="Enter user name"
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email"
                      value={editUserData.email} 
                      onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                      placeholder="Enter email address"
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="text-sm font-medium">Change Password (Optional)</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={editUserData.password} 
                      onChange={(e) => setEditUserData({...editUserData, password: e.target.value})}
                      placeholder="Enter new password (leave empty to keep current)"
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep the current password unchanged
                  </p>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <select 
                      value={editUserData.role}
                      onChange={(e) => setEditUserData({...editUserData, role: e.target.value as 'BACHELOR' | 'LANDLORD'})}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BACHELOR">Bachelor</option>
                      <option value="LANDLORD">Landlord</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select 
                      value={editUserData.status}
                      onChange={(e) => setEditUserData({...editUserData, status: e.target.value as 'ACTIVE' | 'SUSPENDED' | 'BANNED'})}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="BANNED">Banned</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <textarea 
                    value={editUserData.notes}
                    onChange={(e) => setEditUserData({...editUserData, notes: e.target.value})}
                    placeholder="Add notes about this change (optional)"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Current vs New comparison */}
                {(editUserData.name !== selectedUser.name || editUserData.email !== selectedUser.email || editUserData.role !== selectedUser.role || editUserData.status !== selectedUser.status || editUserData.password.trim()) && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Changes Preview:</h4>
                    <div className="text-xs space-y-1">
                      {editUserData.name !== selectedUser.name && (
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span>
                            <span className="text-gray-500">{selectedUser.name}</span>
                            <span className="mx-1">→</span>
                            <span className="text-blue-600 font-medium">{editUserData.name}</span>
                          </span>
                        </div>
                      )}
                      {editUserData.email !== selectedUser.email && (
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span>
                            <span className="text-gray-500">{selectedUser.email}</span>
                            <span className="mx-1">→</span>
                            <span className="text-blue-600 font-medium">{editUserData.email}</span>
                          </span>
                        </div>
                      )}
                      {editUserData.role !== selectedUser.role && (
                        <div className="flex justify-between">
                          <span>Role:</span>
                          <span>
                            <span className="text-gray-500">{selectedUser.role}</span>
                            <span className="mx-1">→</span>
                            <span className="text-blue-600 font-medium">{editUserData.role}</span>
                          </span>
                        </div>
                      )}
                      {editUserData.status !== selectedUser.status && (
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span>
                            <span className="text-gray-500">{selectedUser.status}</span>
                            <span className="mx-1">→</span>
                            <span className="text-blue-600 font-medium">{editUserData.status}</span>
                          </span>
                        </div>
                      )}
                      {editUserData.password.trim() && (
                        <div className="flex justify-between">
                          <span>Password:</span>
                          <span className="text-blue-600 font-medium">Will be updated</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Cancel edit user');
                      setIsEditingUser(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveUserChanges}
                    className="flex-1"
                    disabled={editUserData.name === selectedUser.name && editUserData.email === selectedUser.email && editUserData.role === selectedUser.role && editUserData.status === selectedUser.status && !editUserData.password.trim()}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Action Confirmation Dialog */}
      <AlertDialog open={confirmUserAction.type !== null} onOpenChange={() => setConfirmUserAction({ type: null, userId: '', userName: '', userStatus: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmUserAction.type === 'suspend' ? 'Suspend User?' : 
               confirmUserAction.type === 'activate' ? 'Activate User?' : 
               confirmUserAction.type === 'reactivate' ? 'Reactivate User?' :
               'Ban User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUserAction.type === 'suspend' ? 
                `Are you sure you want to suspend "${confirmUserAction.userName}"? They will be unable to access their account until reactivated.` :
               confirmUserAction.type === 'activate' ?
                `Are you sure you want to activate "${confirmUserAction.userName}"? They will regain access to their account.` :
               confirmUserAction.type === 'reactivate' ?
                `Are you sure you want to reactivate "${confirmUserAction.userName}"? This will restore their account access and set their status to active.` :
                `Are you sure you want to permanently ban "${confirmUserAction.userName}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmUserAction({ type: null, userId: '', userName: '', userStatus: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeUserAction}
              className={confirmUserAction.type === 'ban' || confirmUserAction.type === 'suspend' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              {confirmUserAction.type === 'suspend' ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend
                </>
              ) : confirmUserAction.type === 'activate' ? (
                <>
                  <UnlockKeyhole className="h-4 w-4 mr-2" />
                  Activate
                </>
              ) : confirmUserAction.type === 'reactivate' ? (
                <>
                  <UnlockKeyhole className="h-4 w-4 mr-2" />
                  Reactivate
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}