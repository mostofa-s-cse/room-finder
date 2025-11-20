'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Settings as SettingsIcon,
  Shield,
  Bell,
  Server,
  Users,
  Globe,
  AlertTriangle,
  Save,
  RotateCcw,
  Check,
  Trash2,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminSettings {
  platform: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    approvalRequired: boolean;
    maxListingsPerUser: number;
    defaultCurrency: string;
    supportEmail: string;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactorAuth: boolean;
    allowPasswordReset: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    adminAlerts: boolean;
    newUserNotifications: boolean;
    reportNotifications: boolean;
    systemAlerts: boolean;
  };
  moderation: {
    autoApproveListings: boolean;
    autoModerateReviews: boolean;
    requirePhoneVerification: boolean;
    allowGuestBookings: boolean;
    flaggedContentThreshold: number;
    reviewModerationEnabled: boolean;
  };
  system: {
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    logRetentionDays: number;
    maxFileUploadSize: number;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    cacheTimeout: number;
  };
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeUsers: true,
    includeListings: true,
    includeBookings: true,
    includeAnalytics: true,
    exportType: 'full' as 'full' | 'users' | 'listings' | 'bookings' | 'analytics'
  });

  // Track original settings to detect changes
  const [originalSettings, setOriginalSettings] = useState<AdminSettings | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/settings', {
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
        setSettings(data.data);
        setOriginalSettings(JSON.parse(JSON.stringify(data.data)));
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // Fallback to default settings on error
      const defaultSettings: AdminSettings = {
        platform: {
          siteName: 'Room Finder BD',
          siteDescription: 'Find your perfect room in Bangladesh',
          maintenanceMode: false,
          registrationEnabled: true,
          approvalRequired: false,
          maxListingsPerUser: 10,
          defaultCurrency: 'BDT',
          supportEmail: 'support@roomfinder.com'
        },
        security: {
          passwordMinLength: 8,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          requireEmailVerification: true,
          enableTwoFactorAuth: false,
          allowPasswordReset: true,
          ipWhitelist: []
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          adminAlerts: true,
          newUserNotifications: true,
          reportNotifications: true,
          systemAlerts: true
        },
        moderation: {
          autoApproveListings: false,
          autoModerateReviews: true,
          requirePhoneVerification: false,
          allowGuestBookings: true,
          flaggedContentThreshold: 3,
          reviewModerationEnabled: true
        },
        system: {
          backupFrequency: 'daily',
          logRetentionDays: 90,
          maxFileUploadSize: 10,
          enableAnalytics: true,
          enableDebugMode: false,
          cacheTimeout: 3600
        }
      };

      setSettings(defaultSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(defaultSettings)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }
    fetchSettings();
  }, [session, status, fetchSettings, router]);

  // Check if settings have changed
  useEffect(() => {
    if (settings && originalSettings) {
      const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(hasChanged);
    }
  }, [settings, originalSettings]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const updateSetting = (category: keyof AdminSettings, key: string, value: string | number | boolean | string[]) => {
    if (!settings) return;
    
    setSettings(prev => {
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
    if (!settings) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasChanges(false);
        setSaveSuccess(true);
        setError(null); // Clear any previous errors
        
        setTimeout(() => setSaveSuccess(false), 3000);
        console.log('Settings saved successfully:', data.message);
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasChanges(false);
    }
    setShowResetDialog(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/delete-account', { 
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
        // Account successfully deleted
        console.log('Account deletion completed:', data);
        
        // Show success message
        showToast(`Account has been permanently deleted. You will now be signed out. Deleted at: ${new Date(data.deletedAt).toLocaleString()}`, 'success');
        
        // Wait a moment for user to see the message
        setTimeout(async () => {
          // Sign out and redirect to home page
          await signOut({ 
            callbackUrl: '/',
            redirect: true 
          });
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

  const handleDataExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setShowExportDialog(false);
    
    try {
      const response = await fetch('/api/admin/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      console.log('Data export completed successfully');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading admin settings..." />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Settings Not Available</h1>
          <p className="text-muted-foreground mb-4">Unable to load admin settings.</p>
          <Button onClick={fetchSettings}>Try Again</Button>
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
            Back to Dashboard
          </Button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Error Loading Settings</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                fetchSettings();
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
              Admin Settings
            </h1>
            <p className="text-muted-foreground">Configure platform settings and administrative preferences</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Platform Settings */}
          <TabsContent value="platform" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>
                  Basic platform settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.platform.siteName}
                      onChange={(e) => updateSetting('platform', 'siteName', e.target.value)}
                      placeholder="Enter site name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.platform.supportEmail}
                      onChange={(e) => updateSetting('platform', 'supportEmail', e.target.value)}
                      placeholder="Enter support email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={settings.platform.siteDescription}
                    onChange={(e) => updateSetting('platform', 'siteDescription', e.target.value)}
                    placeholder="Enter site description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxListings">Max Listings Per User</Label>
                    <Input
                      id="maxListings"
                      type="number"
                      value={settings.platform.maxListingsPerUser}
                      onChange={(e) => updateSetting('platform', 'maxListingsPerUser', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <select
                      id="currency"
                      value={settings.platform.defaultCurrency}
                      onChange={(e) => updateSetting('platform', 'defaultCurrency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Platform Controls</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable maintenance mode to restrict site access
                        </p>
                      </div>
                      <Switch
                        checked={settings.platform.maintenanceMode}
                        onCheckedChange={(checked) => updateSetting('platform', 'maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>User Registration</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow new users to register accounts
                        </p>
                      </div>
                      <Switch
                        checked={settings.platform.registrationEnabled}
                        onCheckedChange={(checked) => updateSetting('platform', 'registrationEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Listing Approval Required</Label>
                        <p className="text-sm text-muted-foreground">
                          Require admin approval for new listings
                        </p>
                      </div>
                      <Switch
                        checked={settings.platform.approvalRequired}
                        onCheckedChange={(checked) => updateSetting('platform', 'approvalRequired', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Security policies and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="passwordLength">Minimum Password Length</Label>
                    <Input
                      id="passwordLength"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value) || 8)}
                      min="6"
                      max="32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                      min="5"
                      max="1440"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                    min="3"
                    max="10"
                    className="w-48"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Security Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Verification Required</Label>
                        <p className="text-sm text-muted-foreground">
                          Require email verification for new accounts
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireEmailVerification}
                        onCheckedChange={(checked) => updateSetting('security', 'requireEmailVerification', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable 2FA for enhanced security
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.enableTwoFactorAuth}
                        onCheckedChange={(checked) => updateSetting('security', 'enableTwoFactorAuth', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Password Reset</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to reset their passwords
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.allowPasswordReset}
                        onCheckedChange={(checked) => updateSetting('security', 'allowPasswordReset', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure system notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.pushNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.smsNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alert Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Admin Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Important administrative notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.adminAlerts}
                        onCheckedChange={(checked) => updateSetting('notifications', 'adminAlerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New User Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when new users register
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.newUserNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'newUserNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Report Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when content is reported
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.reportNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'reportNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          System health and performance alerts
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.systemAlerts}
                        onCheckedChange={(checked) => updateSetting('notifications', 'systemAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Settings */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Content Moderation
                </CardTitle>
                <CardDescription>
                  Configure content moderation and approval settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="flagThreshold">Flagged Content Threshold</Label>
                  <Input
                    id="flagThreshold"
                    type="number"
                    value={settings.moderation.flaggedContentThreshold}
                    onChange={(e) => updateSetting('moderation', 'flaggedContentThreshold', parseInt(e.target.value) || 3)}
                    min="1"
                    max="10"
                    className="w-48"
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of reports before content is automatically flagged
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Automatic Moderation</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-approve Listings</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve new listings without manual review
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.autoApproveListings}
                        onCheckedChange={(checked) => updateSetting('moderation', 'autoApproveListings', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-moderate Reviews</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable automatic review moderation
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.autoModerateReviews}
                        onCheckedChange={(checked) => updateSetting('moderation', 'autoModerateReviews', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Review Moderation</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable manual review moderation
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.reviewModerationEnabled}
                        onCheckedChange={(checked) => updateSetting('moderation', 'reviewModerationEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Verification</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Phone Verification Required</Label>
                        <p className="text-sm text-muted-foreground">
                          Require phone number verification for new users
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.requirePhoneVerification}
                        onCheckedChange={(checked) => updateSetting('moderation', 'requirePhoneVerification', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Guest Bookings</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow non-registered users to make bookings
                        </p>
                      </div>
                      <Switch
                        checked={settings.moderation.allowGuestBookings}
                        onCheckedChange={(checked) => updateSetting('moderation', 'allowGuestBookings', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-600" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  System performance and maintenance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="backupFreq">Backup Frequency</Label>
                    <select
                      id="backupFreq"
                      value={settings.system.backupFrequency}
                      onChange={(e) => updateSetting('system', 'backupFrequency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logRetention">Log Retention (days)</Label>
                    <Input
                      id="logRetention"
                      type="number"
                      value={settings.system.logRetentionDays}
                      onChange={(e) => updateSetting('system', 'logRetentionDays', parseInt(e.target.value) || 90)}
                      min="7"
                      max="365"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="uploadSize">Max Upload Size (MB)</Label>
                    <Input
                      id="uploadSize"
                      type="number"
                      value={settings.system.maxFileUploadSize}
                      onChange={(e) => updateSetting('system', 'maxFileUploadSize', parseInt(e.target.value) || 10)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cacheTimeout">Cache Timeout (seconds)</Label>
                    <Input
                      id="cacheTimeout"
                      type="number"
                      value={settings.system.cacheTimeout}
                      onChange={(e) => updateSetting('system', 'cacheTimeout', parseInt(e.target.value) || 3600)}
                      min="300"
                      max="86400"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">System Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Analytics Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable system analytics and tracking
                        </p>
                      </div>
                      <Switch
                        checked={settings.system.enableAnalytics}
                        onCheckedChange={(checked) => updateSetting('system', 'enableAnalytics', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Debug Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable debug logging and detailed error messages
                        </p>
                      </div>
                      <Switch
                        checked={settings.system.enableDebugMode}
                        onCheckedChange={(checked) => updateSetting('system', 'enableDebugMode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600">Data Management</h3>
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Export Data</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Export all platform data including users, listings, bookings, and analytics for backup or migration purposes.
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
                              Export All Data
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
                        Permanently delete your admin account and all associated data. This action cannot be undone.
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
                {error && (
                  <div className="text-sm text-red-600 mt-2">
                    Failed to save: {error}
                  </div>
                )}
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
              This will discard all unsaved changes and restore the settings to their last saved state. 
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

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Admin Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action will <strong>permanently delete</strong> your admin account and all associated data including:
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
              <li>Admin profile and settings</li>
              <li>Activity logs and history</li>
              <li>System configurations</li>
              <li>All administrative privileges</li>
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

      {/* Export Options Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Download className="h-5 w-5" />
              Export Data Options
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Select the data categories you want to include in your export:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeUsers"
                  checked={exportOptions.includeUsers}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeUsers: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="includeUsers" className="text-sm font-medium">
                  Users Data (profiles, roles, registration info)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeListings"
                  checked={exportOptions.includeListings}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeListings: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="includeListings" className="text-sm font-medium">
                  Listings Data (properties, prices, amenities)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeBookings"
                  checked={exportOptions.includeBookings}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeBookings: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="includeBookings" className="text-sm font-medium">
                  Bookings Data (reservations, payments)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAnalytics"
                  checked={exportOptions.includeAnalytics}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="includeAnalytics" className="text-sm font-medium">
                  Analytics Data (usage statistics, metrics)
                </Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Export Format</Label>
              <select
                value={exportOptions.exportType}
                onChange={(e) => setExportOptions(prev => ({ ...prev, exportType: e.target.value as 'full' | 'users' | 'listings' | 'bookings' | 'analytics' }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full">Complete Export (JSON)</option>
                <option value="users">Users Only</option>
                <option value="listings">Listings Only</option>
                <option value="bookings">Bookings Only</option>
                <option value="analytics">Analytics Only</option>
              </select>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowExportDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDataExport}
              disabled={!exportOptions.includeUsers && !exportOptions.includeListings && !exportOptions.includeBookings && !exportOptions.includeAnalytics}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}