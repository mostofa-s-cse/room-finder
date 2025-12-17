'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PaymentManagementModal } from '@/components/payments/PaymentManagementModal';
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

interface PaymentSchedule {
  bookingId: string;
  listingTitle: string;
  listingId: string;
  upfrontMonths: 2 | 3;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  totalMonths: number;
  monthlyPayments: Array<{
    id: string;
    month: number;
    year: number;
    amount: number;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: string;
    transactionId?: string;
    type?: 'UPFRONT' | 'MONTHLY';
  }>;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

// No props required - component fetches current user's schedules from session
export function PaymentTabs() {
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPaymentSchedules = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payments/schedules');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
          setPaymentSchedules(data.data || []);
          if (!data.data || data.data.length === 0) {
            console.log('No payment schedules found for user');
          }
        } else {
          console.error('Failed to load payment schedules:', data.error);
          toast.error(data.error || 'Failed to load payment schedules');
        }
      } catch (error) {
        console.error('Error fetching payment schedules:', error);
        toast.error('Error loading payment schedules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentSchedules();
  }, []);

  const handleOpenModal = (schedule: PaymentSchedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    // Refresh payment schedules
    window.location.reload();
  };

  const getOverdueCount = () => {
    return paymentSchedules.reduce(
      (count, schedule) =>
        count + schedule.monthlyPayments.filter(p => p.status === 'OVERDUE').length,
      0
    );
  };

  const getUpfrontTotal = (schedule: PaymentSchedule) => {
    const explicit = schedule.monthlyPayments
      .filter(p => p.type === 'UPFRONT')
      .reduce((sum, p) => sum + p.amount, 0);
    return explicit > 0 ? explicit : schedule.monthlyAmount * schedule.upfrontMonths;
  };

  const getPlanTotal = (schedule: PaymentSchedule) => {
    if (schedule.monthlyPayments && schedule.monthlyPayments.length > 0) {
      return schedule.monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    }
    return getUpfrontTotal(schedule) + schedule.monthlyAmount * (schedule.totalMonths - schedule.upfrontMonths);
  };

  const getPendingCount = () => {
    return paymentSchedules.reduce(
      (count, schedule) =>
        count + schedule.monthlyPayments.filter(p => p.status === 'PENDING').length,
      0
    );
  };

  const getTotalUpcomingPayment = () => {
    return paymentSchedules.reduce((total, schedule) => {
      const upcomingPayments = schedule.monthlyPayments.filter(
        p => p.status === 'PENDING' || p.status === 'OVERDUE'
      );
      return total + upcomingPayments.reduce((sum, p) => sum + p.amount, 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // Empty state
  if (paymentSchedules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center mb-2">No bookings yet</p>
          <p className="text-sm text-gray-400 text-center">Your payment schedules will appear here once you have confirmed bookings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <CreditCard className="h-4 w-4 inline mr-2" />
              Total Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ৳{getTotalUpcomingPayment().toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getPendingCount() + getOverdueCount()} payment(s) due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getOverdueCount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {getOverdueCount()}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {getOverdueCount() > 0 ? 'Please pay immediately' : 'No overdue payments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Clock className="h-4 w-4 inline mr-2" />
              Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {paymentSchedules.filter(s => s.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Payment plans in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for overdue payments */}
      {getOverdueCount() > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {getOverdueCount()} overdue payment(s). Please pay immediately to avoid booking cancellation.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Schedules */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({paymentSchedules.filter(s => s.status === 'ACTIVE').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({paymentSchedules.filter(s => s.status === 'COMPLETED').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {paymentSchedules.filter(s => s.status === 'ACTIVE').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">No active payment schedules</p>
              </CardContent>
            </Card>
          ) : (
            paymentSchedules
              .filter(s => s.status === 'ACTIVE')
              .map((schedule) => (
                <Card key={schedule.bookingId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{schedule.listingTitle}</CardTitle>
                        <CardDescription>
                          Booking period: {format(parseISO(schedule.startDate), 'MMM dd, yyyy')} -{' '}
                          {format(parseISO(schedule.endDate), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Upfront ({schedule.upfrontMonths}M)</div>
                        <div className="text-xl font-bold text-blue-700">
                          ৳{getUpfrontTotal(schedule).toLocaleString()}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Monthly</div>
                        <div className="text-xl font-bold text-green-700">
                          ৳{schedule.monthlyAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Payment Status</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            label: 'Paid',
                            count: schedule.monthlyPayments.filter(p => p.status === 'PAID').length,
                            color: 'bg-green-100 text-green-800',
                            icon: CheckCircle,
                          },
                          {
                            label: 'Pending',
                            count: schedule.monthlyPayments.filter(p => p.status === 'PENDING').length,
                            color: 'bg-yellow-100 text-yellow-800',
                            icon: Clock,
                          },
                          {
                            label: 'Overdue',
                            count: schedule.monthlyPayments.filter(p => p.status === 'OVERDUE').length,
                            color: 'bg-red-100 text-red-800',
                            icon: AlertCircle,
                          },
                        ].map(({ label, count, color, icon: Icon }) => (
                          <div key={label} className={`p-3 rounded-lg ${color}`}>
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium">{label}</span>
                            </div>
                            <div className="text-lg font-bold">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Payment */}
                    {schedule.monthlyPayments.some(p => p.status === 'PENDING' || p.status === 'OVERDUE') && (
                      <div className={`p-4 rounded-lg border ${
                        schedule.monthlyPayments.some(p => p.status === 'OVERDUE') 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50'
                      }`}>
                        <div className="text-sm font-semibold mb-3">Next Payment</div>
                        {(() => {
                          const nextPayment =
                            schedule.monthlyPayments.find(p => p.status === 'OVERDUE') ||
                            schedule.monthlyPayments.find(p => p.status === 'PENDING');
                          if (!nextPayment) return null;

                          return (
                            <>
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <div className="font-medium">
                                    {format(parseISO(nextPayment.dueDate), 'MMMM yyyy')}
                                  </div>
                                  <div className={`text-sm ${nextPayment.status === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                    Due: {format(parseISO(nextPayment.dueDate), 'MMM dd, yyyy')}
                                  </div>
                                </div>
                                <div className={`text-2xl font-bold ${nextPayment.status === 'OVERDUE' ? 'text-red-600' : 'text-primary'}`}>
                                  ৳{nextPayment.amount.toLocaleString()}
                                </div>
                              </div>
                              {nextPayment.status === 'OVERDUE' && (
                                <Badge variant="destructive" className="mb-3 w-full justify-center">
                                  ⚠️ OVERDUE - PAY IMMEDIATELY
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <Button
                      onClick={() => handleOpenModal(schedule)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Payments
                    </Button>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {paymentSchedules.filter(s => s.status === 'COMPLETED').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">No completed payment schedules</p>
              </CardContent>
            </Card>
          ) : (
            paymentSchedules
              .filter(s => s.status === 'COMPLETED')
              .map((schedule) => (
                <Card key={schedule.bookingId} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{schedule.listingTitle}</CardTitle>
                        <CardDescription>
                          Booking period: {format(parseISO(schedule.startDate), 'MMM dd, yyyy')} -{' '}
                          {format(parseISO(schedule.endDate), 'MMM dd, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-gray-100">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">All payments completed</span>
                      </div>
                      <div className="text-lg font-bold">
                        ৳{getPlanTotal(schedule).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Management Modal */}
      {selectedSchedule && (
        <PaymentManagementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          paymentSchedule={selectedSchedule}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
