import { 
  PaymentRequest, 
  BookingPayment, 
  PaymentStatus, 
  RefundRequest, 
  RefundResponse,
  PaymentReport
} from './types';
import { sslCommerzService } from './ssl-commerce';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/notifications/notification-service';
import { NotificationType } from '@/lib/notifications/types';

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create a new payment for a booking
   */
  async createPayment(
    bookingId: string,
    userId: string,
    listingId: string,
    amount: number,
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
    }
  ): Promise<{ payment: BookingPayment; paymentUrl: string }> {
    try {
      // Get booking and listing details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          listing: {
            include: {
              landlord: true
            }
          },
          user: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.userId !== userId) {
        throw new Error('Unauthorized access to booking');
      }

      // Create payment record
      const payment = await prisma.bookingPayment.create({
        data: {
          bookingId,
          userId,
          listingId,
          amount,
          currency: 'BDT',
          status: PaymentStatus.PENDING
        }
      });

      // Prepare payment request for SSL Commerce
      const paymentRequest: PaymentRequest = {
        amount,
        currency: 'BDT',
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        productName: `Room Booking - ${booking.listing.title}`,
        productDescription: `Booking for ${booking.listing.title} from ${booking.startDate} to ${booking.endDate}`,
        bookingId: booking.id,
        userId,
        listingId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?booking=${bookingId}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?booking=${bookingId}`,
        failUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?booking=${bookingId}`
      };

      // Initiate payment with SSL Commerce
      const paymentResponse = await sslCommerzService.initiatePayment(paymentRequest);

      if (paymentResponse.status === 'SUCCESS') {
        // Update payment with session info
        await prisma.bookingPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PROCESSING,
            sessionkey: paymentResponse.sessionkey,
            sslTransactionId: paymentResponse.transactionId
          }
        });

        return {
          payment: payment as BookingPayment,
          paymentUrl: paymentResponse.redirectGatewayURL || ''
        };
      } else {
        // Update payment status to failed
        await prisma.bookingPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failedReason: paymentResponse.desc
          }
        });

        throw new Error(paymentResponse.desc || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment callback
   */
  async handlePaymentSuccess(
    transactionId: string,
    validationId: string,
    amount: number
  ): Promise<BookingPayment> {
    try {
      // Find payment record
      const payment = await prisma.bookingPayment.findFirst({
        where: { 
          OR: [
            { sslTransactionId: transactionId },
            { bookingId: transactionId }
          ]
        },
        include: {
          booking: {
            include: {
              listing: {
                include: {
                  landlord: true
                }
              },
              user: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      // Validate payment with SSL Commerce
      const validation = await sslCommerzService.validatePayment(validationId, amount);

      if (validation.status === 'VALID') {
        // Update payment record
        const updatedPayment = await prisma.bookingPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: validationId,
            bankTransactionId: validation.bankTransactionId,
            cardType: validation.cardType,
            cardNo: validation.cardNo,
            cardIssuer: validation.cardIssuer,
            paymentAt: new Date(),
            paymentMethod: validation.cardType || 'unknown'
          }
        });

        // Update booking status
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' }
        });

        // Send notifications
        await this.sendPaymentNotifications(payment, 'SUCCESS');

        return updatedPayment as BookingPayment;
      } else {
        // Invalid payment
        await prisma.bookingPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failedReason: 'Payment validation failed'
          }
        });

        throw new Error('Payment validation failed');
      }
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(
    transactionId: string,
    reason: string
  ): Promise<void> {
    try {
      const payment = await prisma.bookingPayment.findFirst({
        where: { 
          OR: [
            { sslTransactionId: transactionId },
            { bookingId: transactionId }
          ]
        },
        include: {
          booking: {
            include: {
              user: true
            }
          }
        }
      });

      if (payment) {
        await prisma.bookingPayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failedReason: reason
          }
        });

        // Keep booking in PENDING status to allow retry
        // Don't cancel the booking - user can retry payment
        // Only update the payment status to FAILED

        // Send failure notification
        await this.sendPaymentNotifications(payment, 'FAILED');
      }
    } catch (error) {
      console.error('Payment failure handling error:', error);
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentId: string,
    refundRequest: RefundRequest,
    requestedBy: string
  ): Promise<RefundResponse> {
    try {
      const payment = await prisma.bookingPayment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              listing: {
                include: {
                  landlord: true
                }
              },
              user: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Cannot refund incomplete payment');
      }

      if (!payment.bankTransactionId) {
        throw new Error('Bank transaction ID not available for refund');
      }

      // Check refund amount
      const alreadyRefunded = payment.refundAmount || 0;
      const totalRefundAmount = alreadyRefunded + refundRequest.amount;

      if (totalRefundAmount > payment.amount) {
        throw new Error('Refund amount exceeds original payment');
      }

      // Process refund with SSL Commerce
      const refundResponse = await sslCommerzService.processRefund({
        ...refundRequest,
        transactionId: payment.bankTransactionId
      });

      if (refundResponse.status === 'SUCCESS') {
        // Update payment record
        const newStatus = totalRefundAmount >= payment.amount 
          ? PaymentStatus.REFUNDED 
          : PaymentStatus.PARTIALLY_REFUNDED;

        await prisma.bookingPayment.update({
          where: { id: paymentId },
          data: {
            status: newStatus,
            refundAmount: totalRefundAmount,
            refundedAt: new Date(),
            refundTransactionId: refundResponse.refundTransactionId
          }
        });

        // Create refund log
        await prisma.refundLog.create({
          data: {
            paymentId,
            amount: refundRequest.amount,
            reason: refundRequest.reason,
            requestedBy: refundRequest.refundRequestBy,
            processedBy: requestedBy,
            transactionId: refundResponse.refundTransactionId || '',
            status: 'COMPLETED'
          }
        });

        // Update booking status if fully refunded
        if (newStatus === PaymentStatus.REFUNDED) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CANCELLED' }
          });
        }

        // Send refund notification
        await notificationService.sendNotification(
          payment.userId,
          NotificationType.PAYMENT_SUCCESS,
          {
            amount: refundRequest.amount,
            refundTransactionId: refundResponse.refundTransactionId,
            listingTitle: payment.booking?.listing.title
          }
        );

        return refundResponse;
      } else {
        // Log failed refund attempt
        await prisma.refundLog.create({
          data: {
            paymentId,
            amount: refundRequest.amount,
            reason: refundRequest.reason,
            requestedBy: refundRequest.refundRequestBy,
            processedBy: requestedBy,
            status: 'FAILED',
            failureReason: refundResponse.message
          }
        });

        return refundResponse;
      }
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string, userId?: string): Promise<BookingPayment | null> {
    const where: { id: string; userId?: string } = { id: paymentId };
    if (userId) where.userId = userId;

    const payment = await prisma.bookingPayment.findUnique({
      where,
      include: {
        booking: {
          include: {
            listing: {
              include: {
                landlord: true
              }
            },
            user: true
          }
        }
      }
    });

    return payment as BookingPayment | null;
  }

  /**
   * Get user payments
   */
  async getUserPayments(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: PaymentStatus;
    } = {}
  ): Promise<{ payments: BookingPayment[]; total: number }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: PaymentStatus } = { userId };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.bookingPayment.findMany({
        where,
        include: {
          booking: {
            include: {
              listing: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bookingPayment.count({ where })
    ]);

    return {
      payments: payments as BookingPayment[],
      total
    };
  }

  /**
   * Generate payment report
   */
  async generatePaymentReport(
    startDate: Date,
    endDate: Date,
    landlordId?: string
  ): Promise<PaymentReport> {
    const where: {
      createdAt: { gte: Date; lte: Date };
      booking?: { listing: { landlordId: string } };
    } = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (landlordId) {
      where.booking = {
        listing: {
          landlordId
        }
      };
    }

    const payments = await prisma.bookingPayment.findMany({
      where,
      include: {
        booking: {
          include: {
            listing: true
          }
        }
      }
    });

    const totalTransactions = payments.length;
    const totalAmount = payments.reduce((sum: number, p) => sum + p.amount, 0);
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);
    const successfulTransactions = successfulPayments.length;
    const successfulAmount = successfulPayments.reduce((sum: number, p) => sum + p.amount, 0);
    const refundedPayments = payments.filter(p => p.status === PaymentStatus.REFUNDED || p.status === PaymentStatus.PARTIALLY_REFUNDED);
    const refundedAmount = refundedPayments.reduce((sum: number, p) => sum + (p.refundAmount || 0), 0);

    // Group by payment method
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    successfulPayments.forEach(payment => {
      const method = payment.paymentMethod || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += payment.amount;
    });

    // Generate daily stats
    const dailyStats: Array<{ date: string; transactions: number; amount: number }> = [];
    const dailyMap = new Map<string, { transactions: number; amount: number }>();

    successfulPayments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { transactions: 0, amount: 0 });
      }
      const stats = dailyMap.get(date)!;
      stats.transactions++;
      stats.amount += payment.amount;
    });

    dailyMap.forEach((stats, date) => {
      dailyStats.push({ date, ...stats });
    });

    return {
      totalTransactions,
      totalRevenue: totalAmount,
      totalRefunds: refundedAmount,
      successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
      averageTransactionValue: successfulTransactions > 0 ? successfulAmount / successfulTransactions : 0,
      period: { start: new Date(startDate), end: new Date(endDate) }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendPaymentNotifications(payment: any, status: 'SUCCESS' | 'FAILED'): Promise<void> {
    try {
      if (status === 'SUCCESS') {
        // Notify customer
        await notificationService.sendNotification(
          payment.userId,
          NotificationType.PAYMENT_SUCCESS,
          {
            amount: payment.amount,
            listingTitle: payment.booking?.listing.title,
            bookingId: payment.bookingId
          }
        );

        // Notify landlord
        await notificationService.sendNotification(
          payment.booking?.listing.landlordId,
          NotificationType.BOOKING_CONFIRMED,
          {
            customerName: payment.booking?.user.name,
            listingTitle: payment.booking?.listing.title,
            amount: payment.amount,
            bookingId: payment.bookingId
          }
        );
      } else {
        // Notify customer of failure
        await notificationService.sendNotification(
          payment.userId,
          NotificationType.PAYMENT_FAILED,
          {
            amount: payment.amount,
            listingTitle: payment.booking?.listing.title,
            reason: payment.failedReason
          }
        );
      }
    } catch (error) {
      console.error('Error sending payment notifications:', error);
    }
  }
}

export const paymentService = PaymentService.getInstance();