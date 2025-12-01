import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format, addDays, isAfter } from 'date-fns';
import { CalendarIcon, AlertCircle, Clock } from 'lucide-react';
import { useBookingAvailability, validateBookingDates, calculateBookingDuration } from '@/hooks/useBookingAvailability';
import { toast } from 'react-hot-toast';

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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [guestCount, setGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { checkAvailability, isLoading: checkingAvailability } = useBookingAvailability();

  // Calculate minimum date (available from date or today)
  const minDate = React.useMemo(() => {
    const today = new Date();
    const availableFromDate = new Date(listing.availableFrom);
    return isAfter(availableFromDate, today) ? availableFromDate : today;
  }, [listing.availableFrom]);

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
    if (!startDate || !endDate) return 0;
    
    const duration = calculateBookingDuration(startDate, endDate);
    const monthlyRate = listing.price;
    const dailyRate = monthlyRate / 30; // Approximate daily rate
    
    return Math.round(duration * dailyRate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setErrors({ dates: 'Please select start and end dates' });
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
      
      const response = await fetch('/api/bookings', {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.conflicts) {
          // Booking conflict
          const conflictList = data.conflicts
            .map((c: BookingConflict) => `${format(new Date(c.startDate), 'MMM dd')} - ${format(new Date(c.endDate), 'MMM dd')}`)
            .join(', ');
          setErrors({ 
            dates: `Booking conflict detected: ${conflictList}. Please choose different dates.` 
          });
        } else {
          throw new Error(data.error || 'Failed to create booking');
        }
        return;
      }

      toast.success('Booking created successfully!');
      onBookingSuccess?.(data.booking);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const duration = startDate && endDate ? calculateBookingDuration(startDate, endDate) : 0;
  const totalAmount = calculateTotalAmount();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book This Room
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span className="font-medium">{duration} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rate:</span>
                <span>৳{Math.round(totalAmount / duration)}/day</span>
              </div>
              {listing.securityDeposit && (
                <div className="flex justify-between text-sm">
                  <span>Security Deposit:</span>
                  <span>৳{listing.securityDeposit.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Amount:</span>
                <span>৳{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!listing.isAvailable || isSubmitting || Object.keys(errors).length > 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Booking...
                </>
              ) : (
                'Book Now'
              )}
            </Button>
          </div>

          {/* Availability Notice */}
          {listing.availableFrom && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Available from {format(new Date(listing.availableFrom), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {!listing.isAvailable && (
            <Badge variant="destructive" className="w-full justify-center">
              Currently Unavailable
            </Badge>
          )}
        </form>
      </CardContent>
    </Card>
  );
}