'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CreditCard, Smartphone, Banknote, AlertCircle } from 'lucide-react';
import { useSSLCommerz } from '@/hooks/usePayments';
import { toast } from 'react-hot-toast';

interface BookingDetails {
  id: string;
  listingId: string;
  listingTitle: string;
  amount: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  startDate: string;
  endDate: string;
}

interface PaymentRetryModalProps {
  isOpen: boolean;
  booking: BookingDetails | null;
  onClose: () => void;
  onRetrySuccess?: (bookingId: string) => void;
}

export function PaymentRetryModal({
  isOpen,
  booking,
  onClose,
  onRetrySuccess
}: PaymentRetryModalProps) {
  const { data: session } = useSession();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'cash'>('card');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const { initializePayment, isProcessing: isProcessingPayment } = useSSLCommerz({
    onSuccess: () => {
      toast.success('Payment completed successfully!');
      onRetrySuccess?.(booking!.id);
      onClose();
    },
    onError: (error) => {
      toast.error(`Payment retry failed: ${error.message}`);
      setRetryError(error.message);
    },
    onCancel: () => {
      toast.error('Payment retry was cancelled');
    }
  });

  const handleRetryPayment = async () => {
    if (!booking || !session?.user?.id) {
      toast.error('Please ensure you are logged in');
      return;
    }

    // Resolve customer info with safe fallbacks to satisfy required fields
    const resolvedCustomerName = booking.customerName || session.user.name || 'Guest User';
    const resolvedCustomerEmail = booking.customerEmail || session.user.email || 'guest@example.com';
    const resolvedCustomerPhone = booking.customerPhone || session.user.phone || 'N/A';
    const resolvedCustomerAddress = booking.customerAddress || 'N/A';

    if (!resolvedCustomerName || !resolvedCustomerEmail) {
      toast.error('Customer name and email are required to retry payment');
      return;
    }

    setIsRetrying(true);
    setRetryError(null);

    try {
      // Hit retry-payment endpoint for backend bookkeeping
      const response = await fetch(`/api/bookings/${booking.id}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          bookingId: booking.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to retry payment');
      }

      // Cash path: no gateway redirect; mark success immediately
      if (paymentMethod === 'cash') {
        toast.success('Payment marked as completed (cash on arrival).');
        onRetrySuccess?.(booking.id);
        onClose();
        return;
      }

      // Card/Mobile: initialize SSLCommerz redirect
      const paymentRequest = {
        amount: booking.amount,
        currency: 'BDT',
        customerName: resolvedCustomerName,
        customerEmail: resolvedCustomerEmail,
        customerPhone: resolvedCustomerPhone,
        customerAddress: resolvedCustomerAddress,
        productName: booking.listingTitle,
        productDescription: `Booking retry from ${booking.startDate} to ${booking.endDate}`,
        bookingId: booking.id,
        userId: session.user.id,
        listingId: booking.listingId,
        successUrl: `${window.location.origin}/payment/success?bookingId=${booking.id}`,
        cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${booking.id}`,
        failUrl: `${window.location.origin}/payment/fail?bookingId=${booking.id}`,
      };

      await initializePayment(paymentRequest);
    } catch (error) {
      console.error('Retry payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry payment';
      setRetryError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retry Payment</DialogTitle>
          <DialogDescription>
            Your previous payment was unsuccessful. Please try again with a different method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-900">Booking Details</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-medium">{booking.listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Due:</span>
                <span className="font-medium text-red-600">৳{booking.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="destructive">Payment Pending</Badge>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {retryError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{retryError}</AlertDescription>
            </Alert>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {/* Card & Bank Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                disabled={isRetrying || isProcessingPayment}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`h-6 w-6 mb-1 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-xs font-medium ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Card & Bank
                </span>
              </button>

              {/* Mobile Banking Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mobile')}
                disabled={isRetrying || isProcessingPayment}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  paymentMethod === 'mobile'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className={`h-6 w-6 mb-1 ${paymentMethod === 'mobile' ? 'text-green-600' : 'text-gray-600'}`} />
                <span className={`text-xs font-medium ${paymentMethod === 'mobile' ? 'text-green-600' : 'text-gray-600'}`}>
                  Mobile
                </span>
              </button>

              {/* Cash Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                disabled={isRetrying || isProcessingPayment}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className={`h-6 w-6 mb-1 ${paymentMethod === 'cash' ? 'text-purple-600' : 'text-gray-600'}`} />
                <span className={`text-xs font-medium ${paymentMethod === 'cash' ? 'text-purple-600' : 'text-gray-600'}`}>
                  Cash
                </span>
              </button>
            </div>

            {/* Payment method details - Shows based on selection */}
            {paymentMethod === 'card' && (
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">💳 Card & Internet Banking</p>
                <ul className="space-y-1 text-blue-800">
                  <li>✓ Visa, Mastercard, American Express</li>
                  <li>✓ All major banks in Bangladesh</li>
                  <li>✓ Instant confirmation</li>
                </ul>
              </div>
            )}

            {paymentMethod === 'mobile' && (
              <div className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900 mb-2">📱 Mobile Banking</p>
                <ul className="space-y-1 text-green-800">
                  <li>✓ bKash</li>
                  <li>✓ Nagad</li>
                  <li>✓ Rocket</li>
                </ul>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-300">
                <p className="font-semibold text-gray-900 mb-2">💵 Cash on Arrival</p>
                <ul className="space-y-1 text-gray-700">
                  <li>✓ Pay during room viewing</li>
                  <li>✓ No online payment needed</li>
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isRetrying || isProcessingPayment}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRetryPayment}
              disabled={isRetrying || isProcessingPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isRetrying || isProcessingPayment ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Retry Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
