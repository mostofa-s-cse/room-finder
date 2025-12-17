import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format, addDays, isAfter, startOfDay, parseISO } from 'date-fns';
import { CalendarIcon, AlertCircle, Clock, CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react';
import { useBookingAvailability, validateBookingDates } from '@/hooks/useBookingAvailability';
import { toast } from 'react-hot-toast';
import { useSSLCommerz } from '@/hooks/usePayments';
import { useSession } from 'next-auth/react';
import { PaymentRequest } from '@/lib/payments/types';

interface BookingConflict {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  bookedBy: string;
}

interface Booking {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
}

interface BookingFormProps {
  listing: {
    id: string;
    title: string;
    price: number;
    securityDeposit?: number;
    availableFrom: string;
    isAvailable: boolean;
  };
  onBookingSuccess?: (booking: Booking) => void;
  onCancel?: () => void;
}

export function BookingForm({ listing, onBookingSuccess, onCancel }: BookingFormProps) {
  const { data: session } = useSession();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'cash'>('card');
  const [useCustomPayment, setUseCustomPayment] = useState(false);
  const [customPaymentAmount, setCustomPaymentAmount] = useState<number>(0);
  const [upfrontMonths, setUpfrontMonths] = useState<2 | 3>(2);
  const [customerInfo, setCustomerInfo] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    address: ''
  });
  
  const { checkAvailability, isLoading: checkingAvailability } = useBookingAvailability();
  
  // Calculate booking duration
  const calculateBookingDuration = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const duration = React.useMemo(() => {
    return startDate && endDate ? calculateBookingDuration(startDate, endDate) : 0;
  }, [startDate, endDate]);
  
  const { initializePayment, isProcessing: isProcessingPayment } = useSSLCommerz({
    onSuccess: (validation) => {
      toast.success('Payment completed successfully!');
      onBookingSuccess?.({
        id: validation.transactionId,
        listingId: listing.id,
        startDate: startDate!.toISOString(),
        endDate: endDate!.toISOString(),
        amount: calculateTotalAmount(),
        status: 'CONFIRMED'
      });
    },
    onError: (error) => {
      toast.error(`Payment failed: ${error.message}`);
      setErrors({ payment: error.message });
    },
    onCancel: () => {
      toast.error('Payment was cancelled');
    }
  });

  // Calculate minimum date (available from date or today) using date-fns
  const minDate = React.useMemo(() => {
    try {
      const today = startOfDay(new Date());
      const availableFromDate = startOfDay(parseISO(listing.availableFrom));
      return isAfter(availableFromDate, today) ? availableFromDate : today;
    } catch (error) {
      console.error('Error parsing availableFrom date:', error);
      return startOfDay(new Date());
    }
  }, [listing.availableFrom]);

  const isAvailableNow = React.useMemo(() => {
    try {
      if (listing.isAvailable === false) return false;
      const today = startOfDay(new Date());
      const availableFromDate = startOfDay(parseISO(listing.availableFrom));
      return !isAfter(availableFromDate, today);
    } catch (error) {
      console.error('Error parsing availableFrom date:', error);
      return listing.isAvailable !== false;
    }
  }, [listing.isAvailable, listing.availableFrom]);

  // Auto-set start date to available date if not set
  useEffect(() => {
    if (!startDate) {
      setStartDate(minDate);
    }
  }, [minDate, startDate]);

  // Auto-set end date to 1 month after start date
  useEffect(() => {
    if (startDate && !endDate) {
      const defaultEndDate = addDays(startDate, 30); // Default 30 days
      setEndDate(defaultEndDate);
    }
  }, [startDate, endDate]);

  // Real-time availability checking
  useEffect(() => {
    const checkDatesAvailability = async () => {
      if (!startDate || !endDate || !listing.id) return;

      const dateValidation = validateBookingDates(startDate, endDate);
      if (!dateValidation.isValid) {
        setErrors({ dates: dateValidation.error || 'Invalid date range' });
        return;
      }

      try {
        const availability = await checkAvailability(listing.id, startDate, endDate);
        
        if (!availability.available) {
          if (availability.conflicts && availability.conflicts.length > 0) {
            const conflictList = availability.conflicts
              .map(c => `${format(new Date(c.startDate), 'MMM dd')} - ${format(new Date(c.endDate), 'MMM dd')}`)
              .join(', ');
            setErrors({ 
              dates: `Selected dates conflict with existing bookings: ${conflictList}` 
            });
          } else {
            setErrors({ dates: availability.error || 'Selected dates are not available' });
          }
        } else {
          // Clear date errors if available
          setErrors(prev => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { dates, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    };

    const debounceTimer = setTimeout(checkDatesAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [startDate, endDate, listing.id, checkAvailability]);

  const calculateTotalAmount = () => {
    if (useCustomPayment && customPaymentAmount > 0) {
      return customPaymentAmount;
    }
    
    if (!startDate || !endDate) return 0;
    
    const monthlyRate = listing.price;
    const dailyRate = monthlyRate / 30;
    
    // Calculate only upfront payment (2 or 3 months)
    const upfrontDays = upfrontMonths * 30;
    return Math.round(upfrontDays * dailyRate);
  };

  const calculateMonthlyAmount = () => {
    if (useCustomPayment && customPaymentAmount > 0) {
      // If custom payment is set, divide by duration to get monthly equivalent
      const duration = startDate && endDate ? calculateBookingDuration(startDate, endDate) : 1;
      const months = Math.max(1, duration / 30);
      return Math.round(customPaymentAmount / months);
    }
    
    return listing.price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Require authenticated user before proceeding to payment
    if (!session?.user?.id || !session.user.email) {
      toast.error('Please sign in to complete the booking');
      setErrors({ auth: 'Please sign in to continue' });
      return;
    }

    if (!startDate || !endDate) {
      setErrors({ dates: 'Please select start and end dates' });
      return;
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setErrors({ customer: 'Please fill in all customer information' });
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate custom payment if enabled
    if (useCustomPayment && (!customPaymentAmount || customPaymentAmount <= 0)) {
      setErrors({ payment: 'Please enter a valid custom payment amount' });
      toast.error('Please enter a valid custom payment amount');
      return;
    }

    // Validate dates
    const dateValidation = validateBookingDates(startDate, endDate);
    if (!dateValidation.isValid) {
      setErrors({ dates: dateValidation.error || 'Invalid date range' });
      return;
    }

    // Check for any existing errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please resolve all errors before booking');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const totalAmount = calculateTotalAmount();
      const monthlyAmount = calculateMonthlyAmount();
      
      // Step 1: Create booking
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          amount: totalAmount,
          guestCount,
          upfrontMonths,
          monthlyAmount,
        }),
      });

      const bookingData = await bookingResponse.json();

      if (!bookingResponse.ok) {
        if (bookingResponse.status === 409 && bookingData.error?.details?.conflicts) {
          // Booking conflict
          const conflictList = bookingData.error.details.conflicts
            .map((c: BookingConflict) => `${format(new Date(c.startDate), 'MMM dd')} - ${format(new Date(c.endDate), 'MMM dd')}`)
            .join(', ');
          setErrors({ 
            dates: `Booking conflict detected: ${conflictList}. Please choose different dates.` 
          });
        } else {
          throw new Error(bookingData.error?.message || 'Failed to create booking');
        }
        return;
      }

      // Step 2: Create payment schedule
      const paymentScheduleResponse = await fetch('/api/payments/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.data.id,
          listingId: listing.id,
          listingTitle: listing.title,
          upfrontAmount: totalAmount,
          upfrontMonths,
          monthlyAmount,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!paymentScheduleResponse.ok) {
        console.warn('Payment schedule creation warning:', paymentScheduleResponse.statusText);
      }

      // Step 3: Handle based on payment method
      if (paymentMethod === 'cash') {
        // For cash payment, mark as completed immediately and redirect to success
        try {
          const paymentCompleteResponse = await fetch(`/api/bookings/${bookingData.data.id}/retry-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentMethod: 'cash',
            }),
          });

          if (paymentCompleteResponse.ok) {
            toast.success('Booking confirmed! Payment to be made on arrival.');
            onBookingSuccess?.({
              id: bookingData.data.id,
              listingId: listing.id,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              amount: totalAmount,
              status: 'CONFIRMED'
            });
            // Redirect to success page
            window.location.href = `/payment/success?bookingId=${bookingData.data.id}`;
          } else {
            throw new Error('Failed to confirm cash payment');
          }
        } catch (error) {
          console.error('Cash payment confirmation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
          setErrors({ submit: errorMessage });
          toast.error(errorMessage);
        }
      } else {
        // For card and mobile, redirect to SSLCommerz
        const paymentRequest: PaymentRequest = {
          amount: totalAmount,
          currency: 'BDT',
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address || 'N/A',
          productName: listing.title,
          productDescription: `Booking from ${format(startDate, 'MMM dd, yyyy')} to ${format(endDate, 'MMM dd, yyyy')} - Upfront Payment (${upfrontMonths} months)`,
          bookingId: bookingData.data.id,
          userId: session.user.id,
          listingId: listing.id,
          successUrl: `${window.location.origin}/payment/success?bookingId=${bookingData.data.id}`,
          cancelUrl: `${window.location.origin}/payment/cancel?bookingId=${bookingData.data.id}`,
          failUrl: `${window.location.origin}/payment/fail?bookingId=${bookingData.data.id}`,
        };

        // Initialize payment and redirect to payment gateway
        await initializePayment(paymentRequest);
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book This Room
        </CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto">
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Check-in</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                min={format(minDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setStartDate(date);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Check-out</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                min={startDate ? format(addDays(startDate, 1), 'yyyy-MM-dd') : format(minDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setEndDate(date);
                }}
              />
            </div>
          </div>

          {/* Guest Count */}
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={6}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
            />
          </div>

          {/* Availability Status */}
          {checkingAvailability && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
              <LoadingSpinner className="h-4 w-4" />
              <span className="text-sm text-blue-700">Checking availability...</span>
            </div>
          )}

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {Object.values(errors).map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Booking Summary */}
          {startDate && endDate && duration > 0 && Object.keys(errors).length === 0 && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md">
              <div className="border-b pb-3 mb-3">
                <h3 className="font-semibold text-sm mb-2">📋 Booking Overview</h3>
                <div className="flex justify-between text-sm">
                  <span>Total Duration:</span>
                  <span className="font-medium">{duration} days ({(duration / 30).toFixed(1)} months)</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2 mb-3">
                <div className="font-semibold text-blue-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Upfront Payment ({upfrontMonths} Months)
                </div>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between mb-1">
                    <span>Rate:</span>
                    <span>৳{Math.round(calculateTotalAmount() / (upfrontMonths * 30)).toLocaleString()}/day</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-blue-300">
                    <span>Total Upfront:</span>
                    <span>৳{calculateTotalAmount().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {duration > upfrontMonths * 30 && (
                <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                  <div className="font-semibold text-green-900">
                    📅 Remaining Monthly Payments
                  </div>
                  <div className="text-sm text-green-800">
                    <div className="flex justify-between mb-1">
                      <span>Monthly Rate:</span>
                      <span>৳{calculateMonthlyAmount().toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Remaining Months:</span>
                      <span>{Math.ceil((duration - upfrontMonths * 30) / 30)} months</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm pt-2 border-t border-green-300">
                      <span>Total Remaining:</span>
                      <span>৳{(calculateMonthlyAmount() * Math.ceil((duration - upfrontMonths * 30) / 30)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg bg-white p-3 rounded border-2 border-primary">
                <span>Grand Total:</span>
                <span className="text-primary">
                  ৳{(calculateTotalAmount() + (duration > upfrontMonths * 30 ? calculateMonthlyAmount() * Math.ceil((duration - upfrontMonths * 30) / 30) : 0)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-900">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name *</Label>
              <Input
                id="customer-name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email Address *</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number *</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+880 1XXXXXXXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Address (Optional)</Label>
              <Input
                id="customer-address"
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Your address"
              />
            </div>
          </div>

          {/* Upfront Payment Selection */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-sm font-semibold text-gray-900">Upfront Payment Period *</Label>
            <div className="grid grid-cols-2 gap-3">
              {[2, 3].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setUpfrontMonths(months as 2 | 3)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    upfrontMonths === months
                      ? 'border-blue-600 bg-blue-100'
                      : 'border-blue-200 bg-white hover:border-blue-400'
                  }`}
                >
                  <div className="text-lg font-bold text-blue-700">{months}</div>
                  <div className="text-xs text-gray-600">Month{months > 1 ? 's' : ''}</div>
                  <div className="text-sm font-semibold text-blue-600 mt-1">
                    ৳{(Math.round((listing.price / 30) * 30 * months)).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-700 bg-white p-2 rounded">
              ℹ️ Pay {upfrontMonths} months upfront, then pay monthly for remaining duration
            </p>
          </div>

          {/* Custom Payment Option */}
          <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-900">Use Custom Payment Amount?</Label>
              <button
                type="button"
                onClick={() => {
                  setUseCustomPayment(!useCustomPayment);
                  setCustomPaymentAmount(0);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useCustomPayment ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useCustomPayment ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {useCustomPayment && (
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Total Payment Amount (৳) *</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="0"
                  step="100"
                  value={customPaymentAmount || ''}
                  onChange={(e) => setCustomPaymentAmount(Number(e.target.value))}
                  placeholder="Enter your custom amount"
                  className="font-semibold text-lg"
                />
                {customPaymentAmount > 0 && (
                  <div className="p-3 bg-white rounded-md border border-amber-300">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Total Payment</div>
                      <div className="font-semibold text-2xl text-amber-700">৳{customPaymentAmount.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Select Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Card & Bank Button */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
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
              <div className="text-xs text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">💳 Card & Internet Banking</p>
                <ul className="space-y-1 text-blue-800">
                  <li>✓ Visa, Mastercard, American Express</li>
                  <li>✓ All major banks in Bangladesh</li>
                  <li>✓ Instant confirmation</li>
                  <li>✓ 256-bit secure encryption</li>
                </ul>
              </div>
            )}

            {paymentMethod === 'mobile' && (
              <div className="text-xs text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900 mb-2">📱 Mobile Banking</p>
                <ul className="space-y-1 text-green-800">
                  <li>✓ bKash</li>
                  <li>✓ Nagad</li>
                  <li>✓ Rocket</li>
                  <li>✓ Instant payment & confirmation</li>
                </ul>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-300">
                <p className="font-semibold text-gray-900 mb-2">💵 Cash on Arrival</p>
                <ul className="space-y-1 text-gray-700">
                  <li>✓ Pay when room viewing</li>
                  <li>✓ No online payment needed</li>
                  <li>✓ Direct verification</li>
                  <li className="text-orange-600 font-medium">⚠️ Availability confirmation required</li>
                </ul>
              </div>
            )}

            {/* SSLCommerz badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Secured by SSLCommerz</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!isAvailableNow || isSubmitting || isProcessingPayment || Object.keys(errors).length > 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || isProcessingPayment ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  {isProcessingPayment ? 'Processing Payment...' : 'Creating Booking...'}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>

          {/* Availability Notice */}
          {isAvailableNow && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Available for booking now</span>
            </div>
          )}

          {!isAvailableNow && (
            <div className="space-y-2">
              {listing.availableFrom && (
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Available from {format(startOfDay(parseISO(listing.availableFrom)), 'MMM dd, yyyy')}</span>
                </div>
              )}
              <Badge variant="destructive" className="w-full justify-center">
                Currently unavailable for booking
              </Badge>
            </div>
          )}
          </form>
        </CardContent>
      </div>
    </Card>
  );
}