'use client';

import React, { useState } from 'react';
import { usePaymentHistory } from '@/hooks/usePayments';
import { Transaction } from '@/lib/payments/types';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  userId?: string;
  bookingId?: string;
  showRefundButton?: boolean;
  limit?: number;
  className?: string;
}

export function TransactionHistory({
  userId,
  bookingId,
  showRefundButton = false,
  className = ''
}: TransactionHistoryProps) {
  const { transactions, loading, error, refetch } = usePaymentHistory({
    userId,
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const handleRefundClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundDialog(true);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (provider: string) => {
    switch (provider) {
      case 'SSLCOMMERZ':
        return '🔒';
      case 'BKASH':
        return '💳';
      case 'ROCKET':
        return '🚀';
      case 'NAGAD':
        return '💰';
      default:
        return '💳';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading transactions
            </h3>
            <p className="mt-1 text-sm text-red-700">{typeof error === 'string' ? error : 'An error occurred'}</p>
            <button
              onClick={refetch}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">💳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">
          {bookingId 
            ? 'No payment transactions for this booking yet.'
            : 'You haven\'t made any payments yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
        <p className="mt-1 text-sm text-gray-600">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getPaymentMethodIcon(transaction.provider)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {(transaction as Transaction & Record<string, unknown>).productName as string || 'Payment'}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Transaction ID: {(transaction as Transaction & Record<string, unknown>).transactionId as string || transaction.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(transaction.createdAt), 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formatAmount(transaction.amount)}
                </div>
                {Boolean((transaction as Transaction & Record<string, unknown>).fee) && (
                  <div className="text-xs text-gray-500">
                    Fee: {formatAmount(Number((transaction as Transaction & Record<string, unknown>).fee))}
                  </div>
                )}
              </div>
            </div>

            {transaction.description && (
              <div className="mt-2 text-sm text-gray-600 ml-11">
                {transaction.description}
              </div>
            )}

            {Boolean((transaction as Transaction & Record<string, unknown>).gatewayTransactionId) && (
              <div className="mt-2 text-xs text-gray-500 ml-11">
                Gateway ID: {String((transaction as Transaction & Record<string, unknown>).gatewayTransactionId)}
              </div>
            )}

            {showRefundButton && 
             transaction.status === 'COMPLETED' && 
             (((transaction as Transaction & Record<string, unknown>).refundedAmount as number) || 0) < transaction.amount && (
              <div className="mt-3 ml-11">
                <button
                  onClick={() => handleRefundClick(transaction)}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Request Refund
                </button>
              </div>
            )}

            {(((transaction as Transaction & Record<string, unknown>).refundedAmount as number) || 0) > 0 && (
              <div className="mt-2 ml-11">
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-xs text-blue-700">
                  Refunded: {formatAmount(((transaction as Transaction & Record<string, unknown>).refundedAmount as number) || 0)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refund Dialog - Disabled until useRefund hook is available */}
      {showRefundDialog && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Not Available</h3>
            <p className="text-gray-600 mb-4">Refund functionality is currently not available.</p>
            <button
              onClick={() => {
                setShowRefundDialog(false);
                setSelectedTransaction(null);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

