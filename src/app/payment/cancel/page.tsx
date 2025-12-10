'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get('booking_id');
  const reason = searchParams?.get('reason') || 'Payment was cancelled by user';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Cancel Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-6">
            <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h2>
          
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </div>

        {/* Cancellation Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Cancelled
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reason:</span>
              <span className="text-sm font-medium text-gray-900">{reason}</span>
            </div>
            
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

        {/* What happened */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What Happened?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your payment was cancelled before completion. This could happen if:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• You clicked the cancel button</li>
                  <li>• You closed the payment window</li>
                  <li>• The payment session expired</li>
                  <li>• There was a network issue</li>
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
            href="/dashboard/bachelor"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/listings"
            className="w-full flex justify-center py-3 px-4 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Browse More Listings
          </Link>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact our{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-500">
              support team
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center">Loading...</div></div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}