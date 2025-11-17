'use client';

import React from 'react';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { TransactionHistory } from '@/components/payments/TransactionHistory';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface PaymentPageProps {
  bookingId: string;
  listingId: string;
  amount?: number;
  productName?: string;
  showHistory?: boolean;
}

export default function PaymentPage({
  bookingId,
  listingId,
  amount,
  productName,
  showHistory = true
}: PaymentPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to continue with your payment.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handlePaymentSuccess = (transactionId: string) => {
    toast.success('Payment completed successfully!');
    
    // Redirect to booking confirmation or success page
    setTimeout(() => {
      router.push(`/bookings/${bookingId}?payment_success=true&transaction_id=${transactionId}`);
    }, 1500);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    toast.error('Payment was cancelled');
    router.push(`/bookings/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="mt-2 text-gray-600">
            Secure payment processing powered by SSLCommerz
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="lg:order-1">
            <PaymentForm
              bookingId={bookingId}
              listingId={listingId}
              userId={user.id}
              initialAmount={amount}
              initialProductName={productName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>

          {/* Transaction History */}
          {showHistory && (
            <div className="lg:order-2">
              <TransactionHistory
                userId={user.id}
                bookingId={bookingId}
                showRefundButton={false}
                limit={5}
              />
              
              {/* Payment Security Info */}
              <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🔒 Payment Security
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>SSL 256-bit encryption protects your payment data</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>PCI DSS compliant payment processing</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Bank-level security standards</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Real-time fraud detection</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Powered by SSLCommerz - Bangladesh&apos;s leading payment gateway
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <h4 className="font-medium text-gray-900 mb-1">Payment Methods</h4>
              <p className="text-sm text-gray-600">
                We accept all major cards, mobile banking, and net banking
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-medium text-gray-900 mb-1">Refunds</h4>
              <p className="text-sm text-gray-600">
                Easy refund process for cancelled bookings within policy
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📞</div>
              <h4 className="font-medium text-gray-900 mb-1">Support</h4>
              <p className="text-sm text-gray-600">
                24/7 customer support for payment issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}