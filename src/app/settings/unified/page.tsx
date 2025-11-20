'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  ArrowLeft, 
  User, 
  Save, 
  Check, 
  RotateCcw,
  AlertTriangle,
  MapPin,
  Calendar,
  Shield,
  Download,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';

interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | '';
    nationalId: string;
  };
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
    allowMessages: boolean;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    addressVerified: boolean;
  };
}

export default function UserSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/users/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setOriginalProfile(JSON.parse(JSON.stringify(data.data)));
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Fallback to default profile on error
      const defaultProfile: UserProfile = {
        personal: {
          firstName: session?.user?.name?.split(' ')[0] || '',
          lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
          email: session?.user?.email || '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          nationalId: ''
        },
        address: {
          street: '',
          city: '',
          district: '',
          postalCode: '',
          country: 'Bangladesh'
        },
        preferences: {
          language: 'en',
          currency: 'BDT',
          timezone: 'Asia/Dhaka',
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false
        },
        privacy: {
          profileVisibility: 'public',
          showPhone: false,
          showEmail: false,
          showAddress: false,
          allowMessages: true
        },
        verification: {
          emailVerified: false,
          phoneVerified: false,
          identityVerified: false,
          addressVerified: false
        }
      };

      setProfile(defaultProfile);
      setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, [session, status, fetchProfile, router]);

  // Check if profile has changed
  useEffect(() => {
    if (profile && originalProfile) {
      const hasChanged = JSON.stringify(profile) !== JSON.stringify(originalProfile);
      setHasChanges(hasChanged);
    }
  }, [profile, originalProfile]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const updateProfile = (category: keyof UserProfile, key: string, value: string | boolean) => {
    if (!profile) return;
    
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOriginalProfile(JSON.parse(JSON.stringify(profile)));
        setHasChanges(false);
        setSaveSuccess(true);
        setError(null);
        
        setTimeout(() => setSaveSuccess(false), 3000);
        showToast('Settings saved successfully!', 'success');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      showToast(`Failed to save settings: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalProfile) {
      setProfile(JSON.parse(JSON.stringify(originalProfile)));
      setHasChanges(false);
    }
    setShowResetDialog(false);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setShowExportDialog(false);
    
    try {
      const response = await fetch('/api/users/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `my-data-export-${new Date().toISOString().split('T')[0]}.json`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      showToast('Your data has been exported successfully!', 'success');
      setTimeout(() => setExportSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Export failed: ${errorMessage}`);
      showToast(`Export failed: ${errorMessage}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/delete-account', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmText: deleteConfirmText
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        showToast(`Account has been permanently deleted. You will now be signed out.`, 'success');
        
        // Wait a moment for user to see the message
        setTimeout(() => {
          router.push('/');
        }, 3000);
        
      } else {
        throw new Error(data.message || 'Account deletion failed');
      }
      
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Account deletion failed: ${errorMessage}`);
      showToast(`Failed to delete account: ${errorMessage}`, 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Settings Not Available</h1>
          <p className="text-muted-foreground mb-4">Unable to load your settings.</p>
          <Button onClick={fetchProfile}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            Back
          </Button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                fetchProfile();
              }}
              className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Unsaved changes
              </Badge>
            )}
            {saveSuccess && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <Check className="h-5 w-5 text-green-600" />}
            {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {toast.type === 'info' && <SettingsIcon className="h-5 w-5 text-blue-600" />}
            <div className="flex-1">
              <p className="font-medium text-sm">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="space-y-6">
        {isLoading || !profile ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-muted-foreground">Loading your settings...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile?.personal?.firstName || ''}
                      onChange={(e) => updateProfile('personal', 'firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile?.personal?.lastName || ''}
                      onChange={(e) => updateProfile('personal', 'lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.personal?.email || ''}
                      onChange={(e) => updateProfile('personal', 'email', e.target.value)}
                      placeholder="Enter your email"
                    />
                    {profile?.verification?.emailVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.personal?.phone || ''}
                      onChange={(e) => updateProfile('personal', 'phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                    {profile?.verification?.phoneVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile?.personal?.dateOfBirth || ''}
                      onChange={(e) => updateProfile('personal', 'dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={profile?.personal?.gender || ''}
                      onChange={(e) => updateProfile('personal', 'gender', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID Number</Label>
                  <Input
                    id="nationalId"
                    value={profile?.personal?.nationalId || ''}
                    onChange={(e) => updateProfile('personal', 'nationalId', e.target.value)}
                    placeholder="Enter your national ID"
                  />
                  {profile?.verification?.identityVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Information */}
          <TabsContent value="address" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Your current address and location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={profile?.address?.street || ''}
                    onChange={(e) => updateProfile('address', 'street', e.target.value)}
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile?.address?.city || ''}
                      onChange={(e) => updateProfile('address', 'city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={profile?.address?.district || ''}
                      onChange={(e) => updateProfile('address', 'district', e.target.value)}
                      placeholder="Enter your district"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={profile?.address?.postalCode || ''}
                      onChange={(e) => updateProfile('address', 'postalCode', e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      value={profile?.address?.country || 'Bangladesh'}
                      onChange={(e) => updateProfile('address', 'country', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="India">India</option>
                      <option value="Pakistan">Pakistan</option>
                    </select>
                  </div>
                </div>

                {profile?.verification?.addressVerified && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-4 w-4 mr-1" />
                      Address Verified
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your app experience and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={profile?.preferences?.language || 'en'}
                      onChange={(e) => updateProfile('preferences', 'language', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="bn">Bengali</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={profile?.preferences?.currency || 'BDT'}
                      onChange={(e) => updateProfile('preferences', 'currency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={profile?.preferences?.timezone || 'Asia/Dhaka'}
                      onChange={(e) => updateProfile('preferences', 'timezone', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Dhaka">Dhaka (GMT+6)</option>
                      <option value="Asia/Kolkata">Kolkata (GMT+5:30)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates via email
                        </p>
                      </div>
                      <Switch
                        checked={profile?.preferences?.emailNotifications || false}
                        onCheckedChange={(checked) => updateProfile('preferences', 'emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive urgent alerts via SMS
                        </p>
                      </div>
                      <Switch
                        checked={profile?.preferences?.smsNotifications || false}
                        onCheckedChange={(checked) => updateProfile('preferences', 'smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive promotional offers and updates
                        </p>
                      </div>
                      <Switch
                        checked={profile?.preferences?.marketingEmails || false}
                        onCheckedChange={(checked) => updateProfile('preferences', 'marketingEmails', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information and contact you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <select
                    id="profileVisibility"
                    value={profile?.privacy?.profileVisibility || 'public'}
                    onChange={(e) => updateProfile('privacy', 'profileVisibility', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public - Anyone can see</option>
                    <option value="private">Private - Only you can see</option>
                    <option value="friends">Friends - Only connections can see</option>
                  </select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Information Visibility</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Phone Number</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to see your phone number
                        </p>
                      </div>
                      <Switch
                        checked={profile?.privacy?.showPhone || false}
                        onCheckedChange={(checked) => updateProfile('privacy', 'showPhone', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to see your email address
                        </p>
                      </div>
                      <Switch
                        checked={profile?.privacy?.showEmail || false}
                        onCheckedChange={(checked) => updateProfile('privacy', 'showEmail', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Address</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to see your location
                        </p>
                      </div>
                      <Switch
                        checked={profile?.privacy?.showAddress || false}
                        onCheckedChange={(checked) => updateProfile('privacy', 'showAddress', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to send you messages
                        </p>
                      </div>
                      <Switch
                        checked={profile?.privacy?.allowMessages || false}
                        onCheckedChange={(checked) => updateProfile('privacy', 'allowMessages', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export your data or delete your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600">Export Data</h3>
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Export Your Data</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Download a complete copy of your personal data including profile, listings, bookings, and activity history.
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowExportDialog(true)}
                          disabled={isExporting}
                          className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          {isExporting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Export My Data
                            </>
                          )}
                        </Button>
                        {exportSuccess && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Export completed successfully!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Delete Account</h4>
                      </div>
                      <p className="text-sm text-red-700">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setShowDeleteDialog(true);
                            setError(null);
                            setDeleteConfirmText('');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={() => setShowResetDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Changes
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`flex items-center gap-2 min-w-[120px] ${
                    saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all unsaved changes and restore your settings to their last saved state. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Reset Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Download className="h-5 w-5" />
              Export Your Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will download a JSON file containing all your personal data including profile information, 
              listings, bookings, and activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExportData}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action will <strong>permanently delete</strong> your account and all associated data including:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="px-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">Error</span>
                </div>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            )}
            
            <ul className="text-sm list-disc list-inside space-y-1 text-gray-700">
              <li>Profile and personal information</li>
              <li>Listings and property details</li>
              <li>Booking history and transactions</li>
              <li>Reviews and ratings</li>
              <li>All account preferences</li>
            </ul>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ This action is irreversible!
              </p>
              <p className="text-xs text-red-700">
                Type <strong>DELETE</strong> below to confirm:
              </p>
            </div>
          </div>
          
          <div className="px-6 pb-4">
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="border-red-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmText('');
                setShowDeleteDialog(false);
                setError(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Forever
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}