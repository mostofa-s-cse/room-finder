'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Loader2, Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PaymentRetryModal } from '@/components/payments/PaymentRetryModal';

interface BookingWithPayment {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  failureReason?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  listing: {
    id: string;
    title: string;
    address?: string;
    location?: string;
    images: string[];
  };
}

interface SelectedBookingData {
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

interface PendingPaymentsSectionProps {
  bookings: BookingWithPayment[];
  onRetrySuccess?: (bookingId: string) => void;
}

export function PendingPaymentsSection({ bookings, onRetrySuccess }: PendingPaymentsSectionProps) {
  const [selectedBooking, setSelectedBooking] = useState<SelectedBookingData | null>(null);
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Filter bookings with pending payments
  const pendingPaymentBookings = bookings.filter(
    booking => booking.status === 'PENDING'
  );

  if (pendingPaymentBookings.length === 0) {
    return null;
  }

  const handleRetryClick = (booking: BookingWithPayment) => {
    setSelectedBooking({
      id: booking.id,
      listingId: booking.listing.id,
      listingTitle: booking.listing.title,
      amount: booking.totalAmount,
      status: booking.status,
      customerName: booking.user?.name || '',
      customerEmail: booking.user?.email || '',
      customerPhone: booking.user?.phone || '',
      customerAddress: booking.user?.address || '',
      startDate: booking.startDate,
      endDate: booking.endDate,
    });
    setIsRetryModalOpen(true);
  };

  const handleRetrySuccess = (bookingId: string) => {
    setRetryingId(null);
    setIsRetryModalOpen(false);
    onRetrySuccess?.(bookingId);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Alert for pending payments */}
        <Alert variant="destructive" className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {pendingPaymentBookings.length} booking(s) awaiting payment confirmation. Please complete the payment to finalize your booking.
          </AlertDescription>
        </Alert>

        {/* Pending Payment Cards */}
        {pendingPaymentBookings.map((booking) => (
          <Card key={booking.id} className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Payment Required
                  </CardTitle>
                  <CardDescription>
                    Booking ID: {booking.id.slice(0, 8)}...
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
                  Pending
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Booking Details */}
              <div className="space-y-3">
                <div className="flex gap-4">
                  {booking.listing.images && booking.listing.images.length > 0 && (
                    <Image
                      src={booking.listing.images[0]}
                      alt={booking.listing.title}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{booking.listing.title}</h4>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.listing.address || booking.listing.location}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Amount Due:</span>
                    <span className="text-lg font-bold text-orange-600">
                      ৳{booking.totalAmount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Created:</span>
                    <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Failure Reason if exists */}
                {booking.failureReason && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-xs">
                      Previous attempt failed: {booking.failureReason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleRetryClick(booking)}
                    disabled={retryingId === booking.id}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {retryingId === booking.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                  <Link href={`/rooms/${booking.listing.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Room
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retry Modal */}
      {selectedBooking && (
        <PaymentRetryModal
          isOpen={isRetryModalOpen}
          booking={selectedBooking}
          onClose={() => {
            setIsRetryModalOpen(false);
            setSelectedBooking(null);
          }}
          onRetrySuccess={handleRetrySuccess}
        />
      )}
    </>
  );
}
