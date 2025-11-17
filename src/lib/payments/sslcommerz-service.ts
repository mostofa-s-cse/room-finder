import { PrismaClient } from '@prisma/client';
import {
  PaymentProvider,
  PaymentStatus,
  Currency,
  PaymentRequest,
  PaymentResponse,
  PaymentValidation,
  CreatePaymentIntentRequest,
  PaymentIntent
} from './types';

// Type interface for SSLCommerzPayment
interface SSLCommerzPaymentInterface {
  init(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  validate(data: { tran_id: string }): Promise<Record<string, unknown>>;
  refund(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  transactionQueryByTransactionId(data: { tran_id: string }): Promise<Record<string, unknown>>;
  refundQuery(data: { refund_ref_id: string }): Promise<Record<string, unknown>>;
}

// Mock SSLCommerz implementation for type safety
class MockSSLCommerzPayment implements SSLCommerzPaymentInterface {
  constructor(private storeId: string, private storePassword: string, private isLive: boolean) {}

  async init(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // This would normally use the real sslcommerz-lts library
    console.log('SSLCommerz init called with:', { storeId: this.storeId, isLive: this.isLive, data });
    return {
      status: 'SUCCESS',
      sessionkey: 'mock-session-key',
      redirectGatewayURL: 'https://sandbox.sslcommerz.com/EasyCheckOut/testchecout?sid=mock-session-key'
    };
  }

  async validate(data: { tran_id: string }): Promise<Record<string, unknown>> {
    console.log('SSLCommerz validate called with:', data);
    return {
      status: 'VALID',
      tran_id: data.tran_id,
      amount: '100.00',
      currency: 'BDT'
    };
  }

  async refund(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log('SSLCommerz refund called with:', data);
    return { status: 'success', refund_ref_id: 'mock-refund-id' };
  }

  async transactionQueryByTransactionId(data: { tran_id: string }): Promise<Record<string, unknown>> {
    console.log('SSLCommerz transaction query called with:', data);
    return { status: 'SUCCESS', tran_id: data.tran_id };
  }

  async refundQuery(data: { refund_ref_id: string }): Promise<Record<string, unknown>> {
    console.log('SSLCommerz refund query called with:', data);
    return { status: 'success', refund_ref_id: data.refund_ref_id };
  }
}

// Use mock for now - replace with actual import when sslcommerz-lts types are available
const SSLCommerzPayment = MockSSLCommerzPayment;

const prisma = new PrismaClient();

export class SSLCommerzService {
  private sslcz?: SSLCommerzPaymentInterface;
  private storeId: string;
  private storePassword: string;
  private isLive: boolean;

  constructor() {
    this.storeId = process.env.SSLCOMMERZ_STORE_ID || '';
    this.storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || '';
    this.isLive = process.env.NODE_ENV === 'production';

    // Initialize SSLCommerz only if credentials are available
    if (this.storeId && this.storePassword && SSLCommerzPayment) {
      this.sslcz = new SSLCommerzPayment(this.storeId, this.storePassword, this.isLive);
    }
  }

  private validateConfiguration(): void {
    if (!this.storeId || !this.storePassword) {
      throw new Error('SSLCommerz credentials not configured');
    }
    if (!this.sslcz) {
      throw new Error('SSLCommerz service not initialized');
    }
  }

  /**
   * Create a payment session with SSLCommerz
   */
  async createPaymentSession(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validateConfiguration();
      
      const data = {
        total_amount: request.amount,
        currency: request.currency,
        tran_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique transaction ID
        success_url: request.successUrl,
        fail_url: request.failUrl,
        cancel_url: request.cancelUrl,
        ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/sslcommerz/ipn`, // Instant Payment Notification
        
        // Customer information
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_add1: request.customerAddress,
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: request.customerPhone,
        cus_fax: request.customerPhone,

        // Product information
        product_name: request.productName,
        product_category: 'Room Booking',
        product_profile: 'general',

        // Shipping information (required)
        ship_name: request.customerName,
        ship_add1: request.customerAddress,
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: '1000',
        ship_country: 'Bangladesh',

        // Additional data
        value_a: request.bookingId,
        value_b: request.userId,
        value_c: request.listingId,
        value_d: request.productDescription || '',
      };

      const apiResponse = await this.sslcz!.init(data);

      // Create payment intent record in database
      await this.createPaymentIntent({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: Currency.BDT,
        description: request.productDescription,
        bookingId: request.bookingId,
        listingId: request.listingId,
        metadata: {
          sslTransactionId: data.tran_id,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
        },
      }, request.userId);

      if (apiResponse.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          transactionId: data.tran_id,
          sessionkey: apiResponse.sessionkey as string,
          redirectGatewayURL: apiResponse.redirectGatewayURL as string,
          directPaymentURLBank: apiResponse.directPaymentURLBank as string,
          directPaymentURLCard: apiResponse.directPaymentURLCard as string,
          directPaymentURL: apiResponse.directPaymentURL as string,
          redirectGatewayURLFailed: apiResponse.redirectGatewayURLFailed as string,
          GWs: apiResponse.GWs as never,
          desc: apiResponse.desc as string,
          is_direct_pay_enable: apiResponse.is_direct_pay_enable as string,
        };
      } else {
        throw new Error(`SSLCommerz initialization failed: ${apiResponse.failedreason}`);
      }
    } catch (error) {
      console.error('SSLCommerz payment session creation failed:', error);
      throw new Error(`Payment session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate payment after completion
   */
  async validatePayment(transactionId: string): Promise<PaymentValidation> {
    try {
      this.validateConfiguration();
      const validation = await this.sslcz!.validate({ tran_id: transactionId });

      if (validation.status === 'VALID') {
        // Update payment intent and create transaction record
        await this.handleSuccessfulPayment(validation);

        return {
          status: 'VALID',
          transactionId: validation.tran_id as string,
          amount: parseFloat((validation.amount as string) || '0'),
          currency: (validation.currency as string) || 'BDT',
          bankTransactionId: validation.bank_tran_id as string,
          cardType: validation.card_type as string,
          cardNo: validation.card_no as string,
          cardIssuer: validation.card_issuer as string,
          cardBrand: validation.card_brand as string,
          cardIssuerCountry: validation.card_issuer_country as string,
          cardIssuerCountryCode: validation.card_issuer_country_code as string,
          storeAmount: parseFloat((validation.store_amount as string) || '0'),
          verifySign: (validation.verify_sign as string) || '',
          verifyKey: (validation.verify_key as string) || '',
          riskLevel: validation.risk_level ? parseInt(validation.risk_level as string) : undefined,
          riskTitle: validation.risk_title as string,
        };
      } else {
        // Handle failed payment
        await this.handleFailedPayment(transactionId, (validation.status as string) || 'FAILED');

        return {
          status: (validation.status as 'INVALID' | 'FAILED') || 'FAILED',
          transactionId: (validation.tran_id as string) || transactionId,
          amount: parseFloat((validation.amount as string) || '0'),
          currency: (validation.currency as string) || 'BDT',
          storeAmount: parseFloat((validation.store_amount as string) || '0'),
          verifySign: (validation.verify_sign as string) || '',
          verifyKey: (validation.verify_key as string) || '',
        };
      }
    } catch (error) {
      console.error('Payment validation failed:', error);
      throw new Error(`Payment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process refund
   */
  async processRefund(transactionId: string, refundAmount: number, reason: string): Promise<Record<string, unknown>> {
    try {
      const refundData = {
        refund_amount: refundAmount,
        refund_remarks: reason,
        bank_tran_id: transactionId,
        refe_id: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      this.validateConfiguration();
      const refundResponse = await this.sslcz!.refund(refundData);

      if (refundResponse.status === 'success') {
        // Create refund transaction record
        await this.createRefundTransaction(transactionId, refundAmount, reason, refundResponse);
      }

      return refundResponse;
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<Record<string, unknown>> {
    try {
      this.validateConfiguration();
      return await this.sslcz!.transactionQueryByTransactionId({
        tran_id: transactionId,
      });
    } catch (error) {
      console.error('Transaction status query failed:', error);
      throw new Error(`Status query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundRefId: string): Promise<Record<string, unknown>> {
    try {
      this.validateConfiguration();
      return await this.sslcz!.refundQuery({
        refund_ref_id: refundRefId,
      });
    } catch (error) {
      console.error('Refund status query failed:', error);
      throw new Error(`Refund status query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create payment intent in database
   */
  private async createPaymentIntent(
    request: CreatePaymentIntentRequest,
    userId: string
  ): Promise<PaymentIntent> {
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId,
        amount: request.amount,
        currency: 'BDT' as const,
        status: 'PENDING' as const,
        provider: 'SSLCOMMERZ' as const,
        providerIntentId: request.metadata?.sslTransactionId as string || `SSL_${Date.now()}`,
        description: request.description,
        metadata: request.metadata,
        listingId: request.listingId,
        bookingId: request.bookingId,
      },
    });

    return paymentIntent as PaymentIntent;
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(validation: Record<string, unknown>): Promise<void> {
    try {
      // Update payment intent status
        const paymentIntent = await prisma.paymentIntent.findFirst({
          where: {
            OR: [
              { providerIntentId: validation.tran_id as string },
              { 
                metadata: {
                  path: ['sslTransactionId'], 
                  equals: validation.tran_id as string
                } 
              },
            ],
          },
        });      if (paymentIntent) {
        // Update payment intent
        await prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            status: PaymentStatus.SUCCEEDED,
            confirmedAt: new Date(),
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: paymentIntent.userId,
            type: 'PAYMENT' as const,
            status: 'SUCCEEDED' as const,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentIntentId: paymentIntent.id,
            description: `Payment for ${paymentIntent.description || 'booking'}`,
            provider: 'SSLCOMMERZ' as const,
            providerTransactionId: validation.bank_tran_id as string,
            grossAmount: paymentIntent.amount,
            feeAmount: 0, // SSLCommerz fees are typically deducted by them
            netAmount: paymentIntent.amount,
            processedAt: new Date(),
            metadata: {
              cardType: validation.card_type,
              cardNo: validation.card_no,
              cardIssuer: validation.card_issuer,
              cardBrand: validation.card_brand,
              bankTranId: validation.bank_tran_id,
              riskLevel: validation.risk_level,
              riskTitle: validation.risk_title,
            } as never,
            listingId: paymentIntent.listingId,
            bookingId: paymentIntent.bookingId,
          },
        });

        // Update booking status if applicable
        if (paymentIntent.bookingId) {
          await prisma.booking.update({
            where: { id: paymentIntent.bookingId },
            data: { status: 'PAID' },
          });
        }
      }
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(transactionId: string, status: string): Promise<void> {
    try {
      const paymentIntent = await prisma.paymentIntent.findFirst({
        where: {
          OR: [
            { providerIntentId: transactionId },
            { metadata: { path: ['sslTransactionId'], equals: transactionId } },
          ],
        },
      });

      if (paymentIntent) {
        await prisma.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            status: status === 'CANCELLED' ? PaymentStatus.CANCELED : PaymentStatus.FAILED,
            canceledAt: new Date(),
          },
        });

        // Update booking status if applicable
        if (paymentIntent.bookingId) {
          await prisma.booking.update({
            where: { id: paymentIntent.bookingId },
            data: { status: status === 'CANCELLED' ? 'CANCELLED' : 'PENDING' },
          });
        }
      }
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Create refund transaction record
   */
  private async createRefundTransaction(
    originalTransactionId: string,
    refundAmount: number,
    reason: string,
    refundResponse: Record<string, unknown>
  ): Promise<void> {
    try {
      // Find the original transaction
      const originalTransaction = await prisma.transaction.findFirst({
        where: {
          providerTransactionId: originalTransactionId,
        },
      });

      if (originalTransaction) {
        await prisma.transaction.create({
          data: {
            userId: originalTransaction.userId,
            type: 'REFUND' as const,
            status: refundResponse.status === 'success' ? 'SUCCEEDED' as const : 'FAILED' as const,
            amount: -Math.round(refundAmount * 100), // Negative amount for refund
            currency: originalTransaction.currency,
            description: `Refund: ${reason}`,
            provider: 'SSLCOMMERZ' as const,
            providerTransactionId: refundResponse.refund_ref_id as string,
            grossAmount: -Math.round(refundAmount * 100),
            feeAmount: 0,
            netAmount: -Math.round(refundAmount * 100),
            processedAt: new Date(),
            metadata: {
              originalTransactionId: originalTransaction.id,
              refundReason: reason,
              refundRefId: refundResponse.refund_ref_id,
            } as never,
            listingId: originalTransaction.listingId,
            bookingId: originalTransaction.bookingId,
          },
        });
      }
    } catch (error) {
      console.error('Error creating refund transaction:', error);
      throw error;
    }
  }

  /**
   * Generate payment configuration for frontend
   */
  getPaymentConfig() {
    return {
      provider: PaymentProvider.SSLCOMMERZ,
      isLive: this.isLive,
      supportedCurrencies: [Currency.BDT],
      supportedPaymentMethods: [
        'VISA',
        'MASTER',
        'AMEX',
        'BKASH',
        'ROCKET',
        'NAGAD',
        'UPAY',
        'DBBL_MOBILE',
        'IBL_MOBILE',
        'DUTCH_BANGLA_BANK',
        'CITY_BANK',
        'EASTERN_BANK',
        'PRIME_BANK',
        'SOUTHEAST_BANK',
        'STANDARD_CHARTERED',
      ],
    };
  }
}

// Export singleton instance
export const sslcommerzService = new SSLCommerzService();