'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Bell, 
  MessageCircle, 
  Calendar, 
  Home,
  Check,
  Trash2,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'system' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    fetchNotifications();
  }, [session, status]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Mock notifications for now - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'booking',
          title: 'Booking Confirmed',
          message: 'Your booking for "Cozy Studio in Dhanmondi" has been confirmed by the landlord.',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          actionUrl: '/dashboard/bachelor?tab=bookings',
          actionText: 'View Booking'
        },
        {
          id: '2',
          type: 'message',
          title: 'New Message',
          message: 'You have a new message from Ahmed Khan regarding your inquiry.',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          actionUrl: '/dashboard/bachelor?tab=chats',
          actionText: 'View Message'
        },
        {
          id: '3',
          type: 'reminder',
          title: 'Payment Reminder',
          message: 'Your monthly rent payment is due in 3 days.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          actionUrl: '/payments',
          actionText: 'Make Payment'
        },
        {
          id: '4',
          type: 'system',
          title: 'Profile Update',
          message: 'Please update your profile to get better room recommendations.',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          actionUrl: '/profile/edit',
          actionText: 'Update Profile'
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    // TODO: API call to mark as read
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    // TODO: API call to mark all as read
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    // TODO: API call to delete notification
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar;
      case 'message': return MessageCircle;
      case 'system': return Settings;
      case 'reminder': return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-500';
      case 'message': return 'text-green-500';
      case 'system': return 'text-purple-500';
      case 'reminder': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your room search and bookings
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Link href={`/dashboard/${session?.user.role?.toLowerCase()}`}>
            <Button size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You&apos;re all caught up! We&apos;ll notify you when there&apos;s something new.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type);
            
            return (
              <Card key={notification.id} className={`transition-all duration-200 hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-primary bg-accent/50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-full bg-accent ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-3 ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {notification.actionUrl && notification.actionText && (
                              <Link href={notification.actionUrl}>
                                <Button size="sm" variant="outline">
                                  {notification.actionText}
                                </Button>
                              </Link>
                            )}
                            {!notification.isRead && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark as read
                              </Button>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Empty State Message */}
      {notifications.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Notifications are automatically deleted after 30 days
          </p>
        </div>
      )}
    </div>
  );
}