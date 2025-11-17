import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationCategory,
  NotificationPreferences,
  NotificationTemplate
} from './types';
import { prisma } from '@/lib/prisma';
import { emailService } from './email-service';
import { pushService } from './push-service';

export class NotificationService {
  private static instance: NotificationService;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  private constructor() {
    this.initializeTemplates();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeTemplates() {
    // Booking templates
    this.templates.set(NotificationType.BOOKING_CONFIRMED, {
      type: NotificationType.BOOKING_CONFIRMED,
      category: NotificationCategory.BOOKING,
      priority: NotificationPriority.HIGH,
      titleTemplate: 'Booking Confirmed!',
      messageTemplate: 'Your booking for {{listingTitle}} has been confirmed. Check-in: {{checkInDate}}',
      emailSubjectTemplate: 'Booking Confirmation - {{listingTitle}}',
      emailBodyTemplate: 'Dear {{userName}}, your booking has been confirmed...',
      pushTitleTemplate: 'Booking Confirmed',
      pushBodyTemplate: '{{listingTitle}} - {{checkInDate}}',
      requiresEmail: true,
      requiresPush: true,
      requiresInApp: true,
      variables: ['userName', 'listingTitle', 'checkInDate', 'totalAmount'],
      actionUrl: '/bookings/{{bookingId}}'
    });

    this.templates.set(NotificationType.NEW_MESSAGE, {
      type: NotificationType.NEW_MESSAGE,
      category: NotificationCategory.CHAT,
      priority: NotificationPriority.MEDIUM,
      titleTemplate: 'New Message',
      messageTemplate: 'You have a new message from {{senderName}}',
      pushTitleTemplate: 'New Message from {{senderName}}',
      pushBodyTemplate: '{{messagePreview}}',
      requiresEmail: false,
      requiresPush: true,
      requiresInApp: true,
      expiresAfterDays: 7,
      variables: ['senderName', 'messagePreview'],
      actionUrl: '/chat/{{threadId}}'
    });

    this.templates.set(NotificationType.LISTING_APPROVED, {
      type: NotificationType.LISTING_APPROVED,
      category: NotificationCategory.LISTING,
      priority: NotificationPriority.HIGH,
      titleTemplate: 'Listing Approved!',
      messageTemplate: 'Your listing "{{listingTitle}}" has been approved and is now live',
      emailSubjectTemplate: 'Listing Approved - {{listingTitle}}',
      requiresEmail: true,
      requiresPush: true,
      requiresInApp: true,
      variables: ['listingTitle'],
      actionUrl: '/listings/{{listingId}}'
    });

    this.templates.set(NotificationType.NEW_RECOMMENDATIONS, {
      type: NotificationType.NEW_RECOMMENDATIONS,
      category: NotificationCategory.RECOMMENDATION,
      priority: NotificationPriority.LOW,
      titleTemplate: 'New Recommendations Available',
      messageTemplate: 'We found {{count}} new rooms that match your preferences',
      requiresEmail: false,
      requiresPush: false,
      requiresInApp: true,
      expiresAfterDays: 3,
      variables: ['count'],
      actionUrl: '/recommendations'
    });
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, unknown> = {},
    options: {
      customTitle?: string;
      customMessage?: string;
      customActionUrl?: string;
      priority?: NotificationPriority;
      scheduleFor?: Date;
    } = {}
  ): Promise<Notification> {
    try {
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`No template found for notification type: ${type}`);
      }

      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(preferences, template.category)) {
        console.log(`Notification blocked by user preferences: ${type} for user ${userId}`);
        return this.createNotificationRecord(userId, type, template, data, options);
      }

      // Create notification record
      const notification = await this.createNotificationRecord(userId, type, template, data, options);

      // Send via different channels based on template and preferences
      const deliveryPromises: Promise<void>[] = [];

      // In-app notification (always create if enabled)
      if (template.requiresInApp && preferences.inAppEnabled) {
        // In-app notifications are stored in database, no external service needed
      }

      // Email notification
      if (template.requiresEmail && preferences.emailEnabled && this.shouldSendEmailForCategory(preferences, template.category)) {
        deliveryPromises.push(this.sendEmailNotification(notification, template, data));
      }

      // Push notification
      if (template.requiresPush && preferences.pushEnabled && this.shouldSendPushForCategory(preferences, template.category)) {
        deliveryPromises.push(this.sendPushNotification(notification, template, data));
      }

      // Execute all deliveries
      await Promise.allSettled(deliveryPromises);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    data: Record<string, unknown> = {}
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId => this.sendNotification(userId, type, data))
    );
    return notifications;
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      category?: NotificationCategory;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false, category } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.isRead = false;
    if (category) where.category = category;

    // Mock implementation - replace with actual Prisma when notification model is available
    const mockNotifications: Notification[] = [];
    const total = 0;
    const unreadCount = 0;
    
    console.log('Mock notification query:', { where, skip, take: limit });
    
    const [notifications] = await Promise.all([
      Promise.resolve(mockNotifications),
      Promise.resolve(total),
      Promise.resolve(unreadCount)
    ]);

    return {
      notifications: notifications as Notification[],
      total,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    console.log('Mock: Marking notification as read:', { notificationId, userId });
    // Mock implementation - replace with actual Prisma when notification model is available
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    console.log('Mock: Marking all notifications as read for user:', userId);
    // Mock implementation - replace with actual Prisma when notification model is available
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    console.log('Mock: Deleting notification:', { notificationId, userId });
    // Mock implementation - replace with actual Prisma when notification model is available
  }

  /**
   * Get or create user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId,
          emailEnabled: true,
          emailBookings: true,
          emailListings: true,
          emailMessages: false,
          emailRecommendations: true,
          emailMarketing: false,
          emailSecurity: true,
          pushEnabled: true,
          pushBookings: true,
          pushListings: true,
          pushMessages: true,
          pushRecommendations: false,
          pushMarketing: false,
          inAppEnabled: true,
          inAppBookings: true,
          inAppListings: true,
          inAppMessages: true,
          inAppRecommendations: true,
          inAppMarketing: false,
          smsEnabled: false,
          smsBookings: false,
          smsEmergency: true,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          timezone: 'Asia/Dhaka',
          digestEnabled: false,
          digestFrequency: 'WEEKLY'
        }
      });
    }

    return preferences as NotificationPreferences;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: { ...updates, updatedAt: new Date() },
      create: {
        userId,
        ...updates,
        // Set defaults for any missing fields
        emailEnabled: updates.emailEnabled ?? true,
        pushEnabled: updates.pushEnabled ?? true,
        inAppEnabled: updates.inAppEnabled ?? true,
        quietHoursStart: updates.quietHoursStart ?? '22:00',
        quietHoursEnd: updates.quietHoursEnd ?? '08:00',
        timezone: updates.timezone ?? 'Asia/Dhaka',
        digestFrequency: updates.digestFrequency ?? 'WEEKLY'
      }
    });

    return preferences as NotificationPreferences;
  }

  private async createNotificationRecord(
    userId: string,
    type: NotificationType,
    template: NotificationTemplate,
    data: Record<string, unknown>,
    options: {
      customTitle?: string;
      customMessage?: string;
      customActionUrl?: string;
      priority?: NotificationPriority;
      scheduleFor?: Date;
    }
  ): Promise<Notification> {
    const title = options.customTitle || this.processTemplate(template.titleTemplate, data);
    const message = options.customMessage || this.processTemplate(template.messageTemplate, data);
    const actionUrl = options.customActionUrl || (template.actionUrl ? this.processTemplate(template.actionUrl, data) : undefined);

    // Mock implementation - replace with actual Prisma when notification model is available
    const notification: Notification = {
      id: `mock-${Date.now()}`,
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      priority: options.priority || template.priority,
      category: template.category,
      actionUrl,
      expiresAt: template.expiresAfterDays ? new Date(Date.now() + template.expiresAfterDays * 24 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(),
      readAt: undefined
    };
    
    console.log('Mock notification created:', notification);
    return notification;
  }

  private async sendEmailNotification(
    notification: Notification,
    template: NotificationTemplate,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!template.emailSubjectTemplate) return;

    const subject = this.processTemplate(template.emailSubjectTemplate, data);
    const body = template.emailBodyTemplate ? this.processTemplate(template.emailBodyTemplate, data) : notification.message;

    await emailService.sendNotificationEmail(notification.userId, subject, body, notification.actionUrl);
    
    // Record delivery
    await this.recordDelivery(notification.id, 'EMAIL', 'SENT');
  }

  private async sendPushNotification(
    notification: Notification,
    template: NotificationTemplate,
    data: Record<string, unknown>
  ): Promise<void> {
    const title = template.pushTitleTemplate ? this.processTemplate(template.pushTitleTemplate, data) : notification.title;
    const body = template.pushBodyTemplate ? this.processTemplate(template.pushBodyTemplate, data) : notification.message;

    await pushService.sendToUser(notification.userId, {
      title,
      body,
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
        ...data
      }
    });

    // Record delivery
    await this.recordDelivery(notification.id, 'PUSH', 'SENT');
  }

  private async recordDelivery(
    notificationId: string,
    channel: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP',
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED'
  ): Promise<void> {
    console.log('Mock: Recording delivery:', { notificationId, channel, status });
    // Mock implementation - replace with actual Prisma when notificationDelivery model is available
  }

  private processTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  private shouldSendNotification(preferences: NotificationPreferences, category: NotificationCategory): boolean {
    if (!preferences.inAppEnabled && !preferences.emailEnabled && !preferences.pushEnabled) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHoursEnabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
      
      if (this.isInQuietHours(currentTime, preferences.quietHoursStart, preferences.quietHoursEnd)) {
        return false;
      }
    }

    // Use category for additional filtering if needed
    console.log('Notification allowed for category:', category);
    return true;
  }

  private shouldSendEmailForCategory(preferences: NotificationPreferences, category: NotificationCategory): boolean {
    switch (category) {
      case NotificationCategory.BOOKING: return preferences.emailBookings;
      case NotificationCategory.LISTING: return preferences.emailListings;
      case NotificationCategory.CHAT: return preferences.emailMessages;
      case NotificationCategory.RECOMMENDATION: return preferences.emailRecommendations;
      case NotificationCategory.MARKETING: return preferences.emailMarketing;
      case NotificationCategory.SYSTEM: return preferences.emailSecurity;
      default: return true;
    }
  }

  private shouldSendPushForCategory(preferences: NotificationPreferences, category: NotificationCategory): boolean {
    switch (category) {
      case NotificationCategory.BOOKING: return preferences.pushBookings;
      case NotificationCategory.LISTING: return preferences.pushListings;
      case NotificationCategory.CHAT: return preferences.pushMessages;
      case NotificationCategory.RECOMMENDATION: return preferences.pushRecommendations;
      case NotificationCategory.MARKETING: return preferences.pushMarketing;
      default: return true;
    }
  }

  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Quiet hours span midnight
      return current >= start || current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const notificationService = NotificationService.getInstance();