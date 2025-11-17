'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get('booking_id');
  const reason = searchParams?.get('reason') || 'Payment processing failed';
  const errorCode = searchParams?.get('error_code');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h2>
          
          <p className="text-gray-600 mb-8">
            We encountered an issue processing your payment. No charges have been made to your account.
          </p>
        </div>

        {/* Failure Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Failure Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Failed
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reason:</span>
              <span className="text-sm font-medium text-gray-900">{reason}</span>
            </div>
            
            {errorCode && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Error Code:</span>
                <span className="text-sm font-mono text-gray-900">{errorCode}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Common Issues</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p className="mb-2">Payment failures can occur due to:</p>
                <ul className="space-y-1">
                  <li>• Insufficient funds in your account</li>
                  <li>• Incorrect card details or expired card</li>
                  <li>• Network connectivity issues</li>
                  <li>• Bank security restrictions</li>
                  <li>• Daily transaction limits exceeded</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What to Try Next</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="space-y-1">
                  <li>• Check your card details and try again</li>
                  <li>• Try a different payment method</li>
                  <li>• Contact your bank if you suspect restrictions</li>
                  <li>• Try again in a few minutes</li>
                  <li>• Contact our support team for help</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {bookingId && (
            <Link
              href={`/payment/${bookingId}`}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Try Payment Again
            </Link>
          )}
          
          {bookingId && (
            <Link
              href={`/bookings/${bookingId}`}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              View Booking Details
            </Link>
          )}
          
          <Link
            href="/support"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Contact Support
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full flex justify-center py-3 px-4 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need immediate help?{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-500">
              Contact our 24/7 support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center">Loading...</div></div>}>
      <PaymentFailContent />
    </Suspense>
  );
}