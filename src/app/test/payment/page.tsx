'use client';

import React from 'react';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { TransactionHistory } from '@/components/payments/TransactionHistory';

export default function PaymentSystemTestPage() {
  const mockProps = {
    bookingId: 'test-booking-123',
    listingId: 'test-listing-456',
    userId: 'test-user-789',
    initialAmount: 5000,
    initialProductName: 'Test Room Booking'
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('Payment successful:', transactionId);
    alert(`Payment successful! Transaction ID: ${transactionId}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    alert('Payment cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment System Test</h1>
          <p className="mt-2 text-gray-600">
            Test the SSLCommerz payment integration components
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Form</h2>
            <PaymentForm
              {...mockProps}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>

          {/* Transaction History */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
            <TransactionHistory
              userId={mockProps.userId}
              bookingId={mockProps.bookingId}
              showRefundButton={true}
              limit={10}
            />
          </div>
        </div>

        {/* System Status */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium text-gray-900 mb-1">Payment Types</h4>
              <p className="text-sm text-gray-600">
                TypeScript interfaces for payment functionality
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium text-gray-900 mb-1">SSLCommerz Service</h4>
              <p className="text-sm text-gray-600">
                Payment processing service layer
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium text-gray-900 mb-1">UI Components</h4>
              <p className="text-sm text-gray-600">
                Payment forms and transaction history
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Test Environment</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This is a test page for the payment system components. To use in production:</p>
                <ul className="mt-2 space-y-1">
                  <li>1. Set up PostgreSQL database</li>
                  <li>2. Run `prisma migrate dev` to create tables</li>
                  <li>3. Configure SSLCommerz credentials in .env</li>
                  <li>4. Implement proper authentication</li>
                  <li>5. Connect to actual booking system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}