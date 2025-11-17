// Mock web-push for type safety - replace with actual import when package is installed
interface WebPushResult {
  statusCode: number;
}

const webpush = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => {
    console.log('Mock VAPID details set:', { subject, publicKey: publicKey.substring(0, 10) + '...', privateKeyLength: privateKey.length });
  },
  sendNotification: async (subscription: { endpoint: string }, payload: string): Promise<WebPushResult> => {
    console.log('Mock push notification sent:', { endpoint: subscription.endpoint, payload: JSON.parse(payload).title });
    return { statusCode: 200 };
  },
  generateVAPIDKeys: () => ({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key'
  })
};

interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushService {
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const vapidDetails = this.getVapidDetails();
    if (vapidDetails) {
      webpush.setVapidDetails(
        vapidDetails.subject,
        vapidDetails.publicKey,
        vapidDetails.privateKey
      );
      this.isConfigured = true;
      console.log('Push service initialized successfully');
    } else {
      console.warn('Push service not configured - push notifications will be skipped');
    }
  }

  private getVapidDetails() {
    const {
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    } = process.env;

    if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return null;
    }

    return {
      subject: VAPID_SUBJECT,
      publicKey: VAPID_PUBLIC_KEY,
      privateKey: VAPID_PRIVATE_KEY
    };
  }

  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    if (!this.isConfigured) {
      console.log('Push service not configured, skipping push notification');
      return;
    }

    try {
      const subscriptions = await this.getUserSubscriptions(userId);
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title: message.title,
        body: message.body,
        icon: message.icon || '/icons/notification-icon.png',
        badge: message.badge || '/icons/badge-icon.png',
        image: message.image,
        data: message.data || {},
        actions: message.actions || [],
        tag: message.tag,
        requireInteraction: message.requireInteraction || false,
        timestamp: Date.now()
      });

      const promises = subscriptions.map(subscription => 
        this.sendToSubscription(subscription, payload)
      );

      const results = await Promise.allSettled(promises);
      
      // Handle failed subscriptions
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send push to subscription ${index}:`, result.reason);
          // Remove invalid subscriptions
          this.removeInvalidSubscription(subscriptions[index]);
        }
      });

      console.log(`Push notification sent to ${results.filter(r => r.status === 'fulfilled').length}/${subscriptions.length} subscriptions`);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(userIds: string[], message: PushMessage): Promise<void> {
    const promises = userIds.map(userId => this.sendToUser(userId, message));
    await Promise.allSettled(promises);
  }

  async sendBookingNotification(userId: string, bookingDetails: {
    id: string;
    listingTitle: string;
  }): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Booking Confirmed',
      body: `Your booking for ${bookingDetails.listingTitle} has been confirmed`,
      icon: '/icons/booking-icon.png',
      data: {
        type: 'booking',
        bookingId: bookingDetails.id,
        url: `/bookings/${bookingDetails.id}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Booking'
        }
      ],
      tag: `booking-${bookingDetails.id}`,
      requireInteraction: true
    });
  }

  async sendMessageNotification(userId: string, messageDetails: {
    senderName: string;
    preview: string;
    threadId: string;
  }): Promise<void> {
    await this.sendToUser(userId, {
      title: `New message from ${messageDetails.senderName}`,
      body: messageDetails.preview,
      icon: '/icons/message-icon.png',
      data: {
        type: 'message',
        threadId: messageDetails.threadId,
        url: `/chat/${messageDetails.threadId}`
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply'
        },
        {
          action: 'view',
          title: 'View Chat'
        }
      ],
      tag: `message-${messageDetails.threadId}`
    });
  }

  async sendListingNotification(userId: string, listingDetails: {
    id: string;
    title: string;
    status: string;
  }): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Listing Update',
      body: `Your listing "${listingDetails.title}" has been ${listingDetails.status.toLowerCase()}`,
      icon: '/icons/listing-icon.png',
      data: {
        type: 'listing',
        listingId: listingDetails.id,
        url: `/listings/${listingDetails.id}`
      },
      tag: `listing-${listingDetails.id}`
    });
  }

  async sendRecommendationNotification(userId: string, count: number): Promise<void> {
    await this.sendToUser(userId, {
      title: 'New Recommendations',
      body: `We found ${count} new rooms that match your preferences`,
      icon: '/icons/recommendation-icon.png',
      data: {
        type: 'recommendation',
        url: '/recommendations'
      },
      actions: [
        {
          action: 'view',
          title: 'View Recommendations'
        }
      ],
      tag: 'recommendations'
    });
  }

  async saveSubscription(userId: string, subscription: PushSubscription, userAgent?: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      await prisma.pushSubscription.upsert({
        where: {
          endpoint: subscription.endpoint
        },
        update: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true,
          lastUsed: new Date()
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          isActive: true
        }
      });

      console.log(`Push subscription saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      await prisma.pushSubscription.updateMany({
        where: { userId, endpoint },
        data: { isActive: false }
      });

      console.log(`Push subscription removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing push subscription:', error);
    }
  }

  private async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId, isActive: true },
        select: {
          endpoint: true,
          p256dh: true,
          auth: true
        }
      });

      return subscriptions.map(sub => ({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }));
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }
  }

  private async sendToSubscription(subscription: PushSubscription, payload: string): Promise<void> {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error: unknown) {
      // Check if subscription is invalid
      const err = error as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        throw new Error('Invalid subscription');
      }
      throw error;
    }
  }

  private async removeInvalidSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      await prisma.pushSubscription.updateMany({
        where: { endpoint: subscription.endpoint },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error removing invalid subscription:', error);
    }
  }

  // Generate VAPID keys (run this once to generate keys for your app)
  static generateVapidKeys() {
    const vapidKeys = webpush.generateVAPIDKeys();
    console.log('VAPID Keys generated:');
    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);
    return vapidKeys;
  }
}

export const pushService = new PushService();