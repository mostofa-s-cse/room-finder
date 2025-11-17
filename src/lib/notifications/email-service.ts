// Mock nodemailer for type safety - replace with actual import when package is installed
interface NodemailerTransporter {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId: string }>;
  verify(): Promise<boolean>;
}

const nodemailer = {
  createTransporter: (config: Record<string, unknown>): NodemailerTransporter => {
    console.log('Mock nodemailer transporter created with config:', config);
    return {
      async sendMail(options) {
        console.log('Mock email sent:', options);
        return { messageId: 'mock-message-id' };
      },
      async verify() {
        console.log('Mock email verification successful');
        return true;
      }
    };
  }
};

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: NodemailerTransporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const config = this.getEmailConfig();
    if (config) {
      this.transporter = nodemailer.createTransporter(config as unknown as Record<string, unknown>);
      this.isConfigured = true;
      
      // Verify connection
      try {
        await this.transporter.verify();
        console.log('Email service initialized successfully');
      } catch (error) {
        console.warn('Email verification failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('Email service not configured - notifications will be skipped');
    }
  }

  private getEmailConfig(): EmailConfig | null {
    const {
      EMAIL_SERVER_HOST,
      EMAIL_SERVER_PORT,
      EMAIL_SERVER_USER,
      EMAIL_SERVER_PASSWORD
    } = process.env;

    if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
      return null;
    }

    return {
      host: EMAIL_SERVER_HOST,
      port: parseInt(EMAIL_SERVER_PORT || '587'),
      secure: parseInt(EMAIL_SERVER_PORT || '587') === 465,
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD
      }
    };
  }

  async sendNotificationEmail(
    userId: string,
    subject: string,
    body: string,
    actionUrl?: string
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      console.log('Email service not configured, skipping email notification');
      return;
    }

    try {
      // Get user email from database
      const user = await this.getUserEmail(userId);
      if (!user?.email) {
        throw new Error('User email not found');
      }

      const template = this.generateEmailTemplate(subject, body, actionUrl);
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@roomfinder.com',
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      console.log(`Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendBookingConfirmationEmail(
    userEmail: string,
    userName: string,
    bookingDetails: {
      listingTitle: string;
      landlordName: string;
      checkInDate: string;
      checkOutDate: string;
      totalAmount: number;
      bookingId: string;
    }
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) return;

    const template = this.getBookingConfirmationTemplate(userName, bookingDetails);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@roomfinder.com',
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendListingApprovalEmail(
    userEmail: string,
    userName: string,
    listingTitle: string,
    listingId: string
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) return;

    const template = this.getListingApprovalTemplate(userName, listingTitle, listingId);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@roomfinder.com',
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) return;

    const template = this.getPasswordResetTemplate(userName, resetToken);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@roomfinder.com',
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) return;

    const template = this.getWelcomeTemplate(userName, userRole);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@roomfinder.com',
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  private async getUserEmail(userId: string): Promise<{ email: string } | null> {
    // This would typically use your database
    // For now, we'll use a placeholder
    try {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      return user;
    } catch (error) {
      console.error('Error fetching user email:', error);
      return null;
    }
  }

  private generateEmailTemplate(subject: string, body: string, actionUrl?: string): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Room Finder</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${body}</p>
            ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>This email was sent by Room Finder. If you have any questions, please contact us.</p>
            <p>&copy; 2025 Room Finder. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}
      
      ${body}
      
      ${actionUrl ? `View Details: ${actionUrl}` : ''}
      
      ---
      This email was sent by Room Finder.
      © 2025 Room Finder. All rights reserved.
    `;

    return { subject, html, text };
  }

  private getBookingConfirmationTemplate(userName: string, bookingDetails: {
    listingTitle: string;
    landlordName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    bookingId: string;
  }): EmailTemplate {
    const subject = `Booking Confirmation - ${bookingDetails.listingTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .booking-details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #16a34a; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Great news! Your booking has been confirmed. Here are the details:</p>
            
            <div class="booking-details">
              <h3>${bookingDetails.listingTitle}</h3>
              <div class="detail-row">
                <span>Landlord:</span>
                <span>${bookingDetails.landlordName}</span>
              </div>
              <div class="detail-row">
                <span>Check-in:</span>
                <span>${bookingDetails.checkInDate}</span>
              </div>
              <div class="detail-row">
                <span>Check-out:</span>
                <span>${bookingDetails.checkOutDate}</span>
              </div>
              <div class="detail-row">
                <span><strong>Total Amount:</strong></span>
                <span><strong>৳${bookingDetails.totalAmount.toLocaleString()}</strong></span>
              </div>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingDetails.bookingId}" class="button">
              View Booking Details
            </a>
            
            <p>We hope you have a wonderful stay!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Confirmed!
      
      Dear ${userName},
      
      Your booking has been confirmed:
      
      Property: ${bookingDetails.listingTitle}
      Landlord: ${bookingDetails.landlordName}
      Check-in: ${bookingDetails.checkInDate}
      Check-out: ${bookingDetails.checkOutDate}
      Total Amount: ৳${bookingDetails.totalAmount.toLocaleString()}
      
      View details: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingDetails.bookingId}
    `;

    return { subject, html, text };
  }

  private getListingApprovalTemplate(userName: string, listingTitle: string, listingId: string): EmailTemplate {
    const subject = `Listing Approved - ${listingTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #16a34a; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Listing Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Congratulations! Your listing "<strong>${listingTitle}</strong>" has been approved and is now live on Room Finder.</p>
            <p>Potential tenants can now discover and book your property. You'll receive notifications when someone shows interest.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/listings/${listingId}" class="button">
              View Your Listing
            </a>
            
            <p>Thank you for choosing Room Finder!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Listing Approved!
      
      Dear ${userName},
      
      Your listing "${listingTitle}" has been approved and is now live.
      
      View listing: ${process.env.NEXT_PUBLIC_APP_URL}/listings/${listingId}
    `;

    return { subject, html, text };
  }

  private getPasswordResetTemplate(userName: string, resetToken: string): EmailTemplate {
    const subject = 'Reset Your Password - Room Finder';
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #dc2626; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
          .warning { 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>You requested to reset your password for your Room Finder account.</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset - Room Finder
      
      Dear ${userName},
      
      You requested to reset your password.
      
      Reset your password: ${resetUrl}
      
      This link expires in 1 hour.
      If you didn't request this, please ignore this email.
    `;

    return { subject, html, text };
  }

  private getWelcomeTemplate(userName: string, userRole: string): EmailTemplate {
    const subject = 'Welcome to Room Finder!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
          .features { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 Welcome to Room Finder!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Welcome to Room Finder! We're excited to have you join our community as a ${userRole.toLowerCase()}.</p>
            
            <div class="features">
              <h3>What you can do:</h3>
              <ul>
                ${userRole === 'BACHELOR' 
                  ? `
                  <li>🔍 Search for rooms that match your budget and preferences</li>
                  <li>💡 Get personalized recommendations</li>
                  <li>💬 Chat directly with landlords</li>
                  <li>⭐ Read and write reviews</li>
                  <li>📱 Manage your bookings</li>
                  `
                  : `
                  <li>🏠 List your properties for rent</li>
                  <li>📊 Track your listing performance</li>
                  <li>💬 Communicate with potential tenants</li>
                  <li>💰 Manage bookings and payments</li>
                  <li>📈 Access analytics and insights</li>
                  `
                }
              </ul>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Get Started
            </a>
            
            <p>If you have any questions, don't hesitate to reach out to our support team.</p>
            <p>Happy room hunting!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Room Finder!
      
      Dear ${userName},
      
      Welcome to Room Finder! You've joined as a ${userRole.toLowerCase()}.
      
      Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
      
      If you need help, contact our support team.
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();