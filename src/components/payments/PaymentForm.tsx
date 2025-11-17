import React from 'react';
import { usePaymentForm, useSSLCommerz } from '@/hooks/usePayments';
import { PaymentRequest } from '@/lib/payments/types';

interface PaymentFormProps {
  bookingId: string;
  listingId: string;
  userId: string;
  initialAmount?: number;
  initialProductName?: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function PaymentForm({
  bookingId,
  listingId,
  userId,
  initialAmount = 0,
  initialProductName = 'Room Booking',
  onSuccess,
  onError,
  onCancel
}: PaymentFormProps) {
  const {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm
  } = usePaymentForm({
    amount: initialAmount,
    productName: initialProductName,
  });

  const { initializePayment, isProcessing, error } = useSSLCommerz({
    onSuccess: (validation) => {
      onSuccess?.(validation.transactionId);
    },
    onError: (error) => {
      onError?.(error.message);
    },
    onCancel: () => {
      onCancel?.();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const paymentRequest: PaymentRequest = {
      ...formData,
      bookingId,
      listingId,
      userId,
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      failUrl: `${window.location.origin}/payment/fail`,
    };

    await initializePayment(paymentRequest);
  };

  const handleReset = () => {
    resetForm();
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
        <h2 className="text-xl font-bold text-white">Payment Details</h2>
        <p className="text-blue-100 text-sm">Secure payment with SSLCommerz</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {/* Amount Field */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (BDT) *
          </label>
          <input
            type="number"
            id="amount"
            min="1"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isProcessing}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Product Name Field */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Product/Service *
          </label>
          <input
            type="text"
            id="productName"
            value={formData.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.productName ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isProcessing}
          />
          {errors.productName && (
            <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
          )}
        </div>

        {/* Product Description Field */}
        <div>
          <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="productDescription"
            rows={3}
            value={formData.productDescription || ''}
            onChange={(e) => updateField('productDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
            placeholder="Optional description..."
          />
        </div>

        {/* Customer Name Field */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="customerName"
            value={formData.customerName}
            onChange={(e) => updateField('customerName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerName ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isProcessing}
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
          )}
        </div>

        {/* Customer Email Field */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="customerEmail"
            value={formData.customerEmail}
            onChange={(e) => updateField('customerEmail', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isProcessing}
          />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
          )}
        </div>

        {/* Customer Phone Field */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="customerPhone"
            value={formData.customerPhone}
            onChange={(e) => updateField('customerPhone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isProcessing}
            placeholder="+880 1XXXXXXXXX"
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
          )}
        </div>

        {/* Customer Address Field */}
        <div>
          <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="customerAddress"
            rows={2}
            value={formData.customerAddress}
            onChange={(e) => updateField('customerAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
            placeholder="Your address (optional)"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Pay Now'
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className="px-4 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Payment Methods Info */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Accepted Payment Methods</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Visa</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Mastercard</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">bKash</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Rocket</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Nagad</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Banks</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Your payment is secured by SSLCommerz 256-bit encryption
        </p>
      </div>
    </div>
  );
}