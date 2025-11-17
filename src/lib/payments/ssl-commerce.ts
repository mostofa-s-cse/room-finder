import crypto from 'crypto';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentValidation,
  RefundRequest,
  RefundResponse
} from './types';

interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
  sandboxUrl: string;
  liveUrl: string;
  apiUrl: string;
  validationUrl: string;
  refundUrl: string;
}

export class SSLCommerzService {
  private config: SSLCommerzConfig;

  constructor() {
    this.config = {
      storeId: process.env.SSL_COMMERCE_STORE_ID || '',
      storePassword: process.env.SSL_COMMERCE_STORE_PASSWORD || '',
      isLive: process.env.SSL_COMMERCE_IS_LIVE === 'true',
      sandboxUrl: 'https://sandbox.sslcommerz.com',
      liveUrl: 'https://securepay.sslcommerz.com',
      apiUrl: '',
      validationUrl: '',
      refundUrl: ''
    };

    // Set URLs based on environment
    const baseUrl = this.config.isLive ? this.config.liveUrl : this.config.sandboxUrl;
    this.config.apiUrl = `${baseUrl}/gwprocess/v4/api.php`;
    this.config.validationUrl = `${baseUrl}/validator/api/validationserverAPI.php`;
    this.config.refundUrl = `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php`;
  }

  private validateCredentials(): void {
    if (!this.config.storeId || !this.config.storePassword) {
      throw new Error('SSLCommerz credentials not configured');
    }
  }

  /**
   * Initialize a payment session with SSLCommerz
   */
  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validateCredentials();

      const postData: Record<string, string> = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        total_amount: paymentData.amount.toString(),
        currency: paymentData.currency,
        tran_id: paymentData.bookingId,
        success_url: paymentData.successUrl,
        fail_url: paymentData.failUrl,
        cancel_url: paymentData.cancelUrl,
        ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        
        // Customer information
        cus_name: paymentData.customerName,
        cus_email: paymentData.customerEmail,
        cus_add1: paymentData.customerAddress,
        cus_phone: paymentData.customerPhone,
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_fax: paymentData.customerPhone,
        
        // Shipping information (same as customer)
        ship_name: paymentData.customerName,
        ship_add1: paymentData.customerAddress,
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: '1000',
        ship_country: 'Bangladesh',
        
        // Product information
        product_name: paymentData.productName,
        product_category: 'Room Booking',
        product_profile: 'general',
        
        // Additional parameters
        value_a: paymentData.userId,
        value_b: paymentData.listingId,
        value_c: paymentData.bookingId,
        value_d: paymentData.productDescription || '',
        
        // EMI options
        emi_option: '0',
        
        // Multi card name
        multi_card_name: 'mastercard,visacard,amexcard,internetbank,mobilebank'
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(postData)
      });

      if (!response.ok) {
        throw new Error(`SSL Commerce API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          transactionId: paymentData.bookingId,
          sessionkey: data.sessionkey,
          redirectGatewayURL: data.redirectGatewayURL,
          directPaymentURLBank: data.directPaymentURLBank,
          directPaymentURLCard: data.directPaymentURLCard,
          directPaymentURL: data.directPaymentURL,
          redirectGatewayURLFailed: data.redirectGatewayURLFailed,
          GWs: data.GWs,
          desc: data.desc,
          is_direct_pay_enable: data.is_direct_pay_enable
        };
      } else {
        return {
          status: 'FAILED',
          transactionId: paymentData.bookingId,
          desc: data.failedreason || 'Payment initiation failed'
        };
      }
    } catch (error) {
      console.error('SSL Commerce payment initiation error:', error);
      throw error;
    }
  }

  /**
   * Validate payment after callback
   */
  async validatePayment(transactionId: string, amount: number): Promise<PaymentValidation> {
    try {
      this.validateCredentials();
      const postData = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        val_id: transactionId,
        format: 'json'
      };

      const response = await fetch(this.config.validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(postData)
      });

      if (!response.ok) {
        throw new Error(`SSL Commerce validation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'VALID' || data.status === 'VALIDATED') {
        // Verify amount matches
        const paidAmount = parseFloat(data.amount);
        if (Math.abs(paidAmount - amount) > 0.01) {
          return {
            status: 'INVALID',
            transactionId,
            amount: paidAmount,
            currency: data.currency,
            storeAmount: 0,
            verifySign: '',
            verifyKey: ''
          };
        }

        return {
          status: 'VALID',
          transactionId,
          amount: paidAmount,
          currency: data.currency,
          bankTransactionId: data.bank_tran_id,
          cardType: data.card_type,
          cardNo: data.card_no,
          cardIssuer: data.card_issuer,
          cardBrand: data.card_brand,
          cardIssuerCountry: data.card_issuer_country,
          cardIssuerCountryCode: data.card_issuer_country_code,
          storeAmount: parseFloat(data.store_amount),
          verifySign: data.verify_sign,
          verifyKey: data.verify_key,
          riskLevel: data.risk_level ? parseInt(data.risk_level) : undefined,
          riskTitle: data.risk_title
        };
      } else {
        return {
          status: 'INVALID',
          transactionId,
          amount,
          currency: 'BDT',
          storeAmount: 0,
          verifySign: '',
          verifyKey: ''
        };
      }
    } catch (error) {
      console.error('SSL Commerce payment validation error:', error);
      return {
        status: 'FAILED',
        transactionId,
        amount,
        currency: 'BDT',
        storeAmount: 0,
        verifySign: '',
        verifyKey: ''
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundData: RefundRequest & { transactionId: string }): Promise<RefundResponse> {
    try {
      this.validateCredentials();
      const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const postData: Record<string, string> = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        refund_amount: refundData.amount.toString(),
        refund_remarks: refundData.reason,
        bank_tran_id: refundData.transactionId,
        refe_id: refundId,
        format: 'json'
      };

      const response = await fetch(this.config.refundUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(postData)
      });

      if (!response.ok) {
        throw new Error(`SSL Commerce refund API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'SUCCESS',
          refundTransactionId: refundId,
          refundAmount: refundData.amount,
          message: 'Refund processed successfully'
        };
      } else {
        return {
          status: 'FAILED',
          refundAmount: refundData.amount,
          message: data.errorReason || 'Refund processing failed'
        };
      }
    } catch (error) {
      console.error('SSL Commerce refund error:', error);
      return {
        status: 'FAILED',
        refundAmount: refundData.amount,
        message: 'Refund processing failed due to technical error'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(data: {
    tran_id: string;
    amount: string;
    currency: string;
    status: string;
    tran_date: string;
    verify_sign: string;
  }): boolean {
    try {
      // Create verification string
      const verifyString = `${this.config.storePassword}${data.tran_id}${data.amount}${data.currency}${data.status}${data.tran_date}`;
      
      // Generate hash
      const hash = crypto.createHash('md5').update(verifyString).digest('hex');
      
      // Compare with received signature
      return hash === data.verify_sign;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<{ status: string; [key: string]: unknown }> {
    try {
      this.validateCredentials();
      const postData: Record<string, string> = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        tran_id: transactionId,
        format: 'json'
      };

      const response = await fetch(`${this.config.sandboxUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(postData)
      });

      if (!response.ok) {
        throw new Error(`SSL Commerce status API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SSL Commerce transaction status error:', error);
      throw error;
    }
  }

  /**
   * Generate payment URLs for different methods
   */
  getPaymentMethods(sessionkey: string): Record<string, string> {
    const baseUrl = this.config.isLive ? this.config.liveUrl : this.config.sandboxUrl;
    
    return {
      all: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}`,
      visa: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=visa`,
      master: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=master`,
      amex: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=amex`,
      bkash: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=bkash`,
      rocket: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=rocket`,
      nagad: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=nagad`,
      upay: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=upay`,
      internetbanking: `${baseUrl}/EasyCheckOut/testchecout?sid=${sessionkey}&gw=internetbanking`
    };
  }

  /**
   * Calculate service fee
   */
  calculateServiceFee(amount: number, paymentMethod: string = 'card'): number {
    // SSL Commerce typical fees (adjust based on your agreement)
    const feeRates = {
      card: 0.035, // 3.5% for cards
      bkash: 0.018, // 1.8% for bKash
      rocket: 0.018, // 1.8% for Rocket
      nagad: 0.015, // 1.5% for Nagad
      bank: 0.025 // 2.5% for bank transfer
    };

    const rate = feeRates[paymentMethod as keyof typeof feeRates] || feeRates.card;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format amount for SSL Commerce (they expect integer for paisa/cents)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100; // Ensure 2 decimal places
  }
}

export const sslCommerzService = new SSLCommerzService();