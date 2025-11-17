// Enhanced payment and subscription system types
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  SSLCOMMERZ = 'SSLCOMMERZ', // Existing Bangladesh payment gateway
  RAZORPAY = 'RAZORPAY'
}

export enum PaymentMethodType {
  CARD = 'CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  MOBILE_BANKING = 'MOBILE_BANKING' // For Bangladesh market
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  COMPLETED = 'COMPLETED', // Keeping for backward compatibility
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  CANCELLED = 'CANCELLED', // Keeping for backward compatibility
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  SUBSCRIPTION = 'SUBSCRIPTION',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  FEE = 'FEE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  INCOMPLETE = 'INCOMPLETE',
  TRIALING = 'TRIALING',
  PAUSED = 'PAUSED'
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  BDT = 'BDT', // Bangladesh Taka
  INR = 'INR'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE'
}

// Type aliases for backward compatibility
export type TransactionStatus = PaymentStatus;

// Payment form data interface
export interface PaymentFormData {
  amount: number;
  currency: Currency;
  description: string;
  customerId?: string;
  paymentMethodId?: string;
  billingAddress?: BillingAddress;
  metadata?: Record<string, string>;
}

// SSL Commerz specific types
export interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  environment: 'sandbox' | 'live';
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface SSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gw?: Record<string, unknown>;
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  redirectGatewayURLFailed?: string;
  GatewayPageURL?: string;
}

export interface SSLCommerzValidation {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  card_issuer?: string;
  card_brand?: string;
  risk_level?: string;
  risk_title?: string;
}

// Legacy payment request interface (keeping for backward compatibility)
export interface PaymentRequest {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productDescription?: string;
  bookingId: string;
  userId: string;
  listingId: string;
  successUrl: string;
  cancelUrl: string;
  failUrl: string;
}

// Legacy payment response interface (keeping for backward compatibility)
export interface PaymentResponse {
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';
  transactionId: string;
  sessionkey?: string;
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  redirectGatewayURLFailed?: string;
  GWs?: PaymentGateway[];
  desc?: string;
  is_direct_pay_enable?: string;
}

export interface PaymentGateway {
  gateway: string;
  type: string;
  logo: string;
  gw: string;
  r_flag: string;
  redirectGatewayURL: string;
}

// Enhanced payment method interface
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  providerMethodId: string; // Stripe payment method ID, PayPal method ID, etc.
  
  // Card details (when applicable)
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardCountry?: string;
  
  // Bank account details (when applicable)
  bankName?: string;
  bankLast4?: string;
  bankAccountType?: string;
  
  // Digital wallet details
  walletType?: string; // apple_pay, google_pay, etc.
  
  // Metadata
  isDefault: boolean;
  isVerified: boolean;
  nickname?: string;
  billingAddress?: BillingAddress;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerIntentId: string; // Stripe payment intent ID
  
  // Associated resources
  paymentMethodId?: string;
  subscriptionId?: string;
  listingId?: string; // For listing-related payments
  bookingId?: string; // For booking-related payments
  
  // Payment details
  description?: string;
  receiptEmail?: string;
  metadata?: Record<string, string>;
  
  // Provider-specific data
  clientSecret?: string; // For client-side confirmation
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  canceledAt?: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  
  // Associated resources
  paymentIntentId?: string;
  paymentMethodId?: string;
  subscriptionId?: string;
  listingId?: string;
  bookingId?: string;
  refundId?: string; // For refund transactions
  
  // Transaction details
  description: string;
  metadata?: Record<string, string>;
  
  // Provider information
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerFee?: number;
  
  // Financial details
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  
  // Provider information
  provider: PaymentProvider;
  providerSubscriptionId: string;
  providerCustomerId: string;
  
  // Billing details
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingCycleAnchor?: Date;
  
  // Payment details
  defaultPaymentMethodId?: string;
  currency: Currency;
  
  // Pricing
  unitAmount: number; // Amount in cents
  quantity: number;
  
  // Trial information
  trialStart?: Date;
  trialEnd?: Date;
  
  // Cancellation
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  cancellationReason?: string;
  
  // Metadata
  metadata?: Record<string, string>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  
  // Provider information
  provider: PaymentProvider;
  providerInvoiceId: string;
  
  // Invoice details
  invoiceNumber: string;
  description?: string;
  currency: Currency;
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Dates
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  
  // Payment attempt
  attemptCount: number;
  nextPaymentAttempt?: Date;
  
  // Invoice items
  items: InvoiceItem[];
  
  // Files
  invoicePdf?: string; // URL to PDF
  receiptNumber?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: Currency;
  metadata?: Record<string, string>;
}

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name: string;
  description: string;
  features: string[];
  price: {
    monthly: number;
    yearly: number;
  };
  currency: Currency;
  maxListings: number;
  maxImages: number;
  featuredListings: number;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  customBranding: boolean;
}

// Legacy booking payment interface (keeping for backward compatibility)
export interface BookingPayment {
  id: string;
  bookingId: string;
  userId: string;
  listingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  bankTransactionId?: string;
  sslTransactionId?: string;
  sessionkey?: string;
  cardType?: string;
  cardNo?: string;
  cardIssuer?: string;
  paymentAt?: Date;
  failedReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
  refundTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy payment validation interface (keeping for backward compatibility)
export interface PaymentValidation {
  status: 'VALID' | 'INVALID' | 'FAILED';
  transactionId: string;
  amount: number;
  currency: string;
  bankTransactionId?: string;
  cardType?: string;
  cardNo?: string;
  cardIssuer?: string;
  cardBrand?: string;
  cardIssuerCountry?: string;
  cardIssuerCountryCode?: string;
  storeAmount: number;
  verifySign: string;
  verifyKey: string;
  riskLevel?: number;
  riskTitle?: string;
}

// API request/response types
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: Currency;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  
  // Associated resources
  listingId?: string;
  bookingId?: string;
  subscriptionId?: string;
}

export interface CreatePaymentIntentResponse {
  paymentIntent: PaymentIntent;
  clientSecret: string;
}

export interface CreateSubscriptionRequest {
  plan: SubscriptionPlan;
  paymentMethodId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  paymentIntent?: PaymentIntent;
  clientSecret?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  refundRequestBy: 'USER' | 'LANDLORD' | 'ADMIN';
}

export interface RefundResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  refundTransactionId?: string;
  refundAmount: number;
  message: string;
}

// Analytics and reporting
export interface PaymentReport {
  totalTransactions: number;
  totalRevenue: number;
  totalRefunds: number;
  successRate: number;
  averageTransactionValue: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface PaymentAnalytics {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Revenue metrics
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  
  // Subscription metrics
  activeSubscriptions: number;
  subscriptionRevenue: number;
  churnRate: number;
  
  // Payment method breakdown
  paymentMethodBreakdown: Array<{
    type: PaymentMethodType;
    count: number;
    amount: number;
  }>;
  
  // Monthly trends
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

// Error handling
export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  param?: string;
  paymentIntentId?: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: Record<string, unknown>;
  createdAt: Date;
}

// SSL Commerz specific webhook data
export interface PaymentWebhookData {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  card_issuer?: string;
  card_brand?: string;
  card_issuer_country?: string;
  card_issuer_country_code?: string;
  verify_sign: string;
  verify_key: string;
  risk_level?: string;
  risk_title?: string;
}

// Payment configuration
export interface PaymentConfig {
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    webhookId: string;
    environment: 'sandbox' | 'production';
  };
  sslcommerz: {
    storeId: string;
    storePassword: string;
    environment: 'sandbox' | 'live';
  };
  defaultCurrency: Currency;
  supportedCurrencies: Currency[];
  subscriptionPlans: SubscriptionPlanConfig[];
}