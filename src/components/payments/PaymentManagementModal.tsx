'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useSSLCommerz } from '@/hooks/usePayments';
import { PaymentRequest } from '@/lib/payments/types';
import { useSession } from 'next-auth/react';

interface MonthlyPayment {
  id: string;
  month: number;
  year: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
  transactionId?: string;
  type?: 'UPFRONT' | 'MONTHLY';
}

interface PaymentSchedule {
  bookingId: string;
  listingTitle: string;
  listingId: string;
  upfrontMonths: 2 | 3;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  totalMonths: number;
  monthlyPayments: MonthlyPayment[];
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface PaymentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSchedule: PaymentSchedule;
  onPaymentSuccess?: (payment: MonthlyPayment) => void;
}

export function PaymentManagementModal({
  isOpen,
  onClose,
  paymentSchedule,
  onPaymentSuccess,
}: PaymentManagementModalProps) {
  const { data: session } = useSession();
  const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'cash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const { initializePayment, isProcessing: isProcessingPayment } = useSSLCommerz({
    onSuccess: () => {
      onPaymentSuccess?.(selectedPayment!);
      setSelectedPayment(null);
      setPaymentMethod('card');
    },
    onError: (error) => {
      console.error('SSLCommerz error:', error);
      toast.error(`Payment failed: ${error.message}`);
    },
    onCancel: () => {
      console.warn('Payment was cancelled by user');
      toast.error('Payment was cancelled');
    },
  });

  const hasTyped = paymentSchedule.monthlyPayments.some(p => p.type);
  const upfrontPayments = hasTyped
    ? paymentSchedule.monthlyPayments.filter(p => p.type === 'UPFRONT')
    : paymentSchedule.monthlyPayments.slice(0, paymentSchedule.upfrontMonths);
  const remainingPayments = hasTyped
    ? paymentSchedule.monthlyPayments.filter(p => p.type !== 'UPFRONT')
    : paymentSchedule.monthlyPayments.slice(paymentSchedule.upfrontMonths);

  const pendingPayments = paymentSchedule.monthlyPayments.filter(p => p.status === 'PENDING');
  const paidPayments = paymentSchedule.monthlyPayments.filter(p => p.status === 'PAID');
  const overduePayments = paymentSchedule.monthlyPayments.filter(p => p.status === 'OVERDUE');

  const getUpfrontTotal = () => {
    const explicit = paymentSchedule.monthlyPayments
      .filter(p => p.type === 'UPFRONT')
      .reduce((sum, p) => sum + p.amount, 0);
    return explicit > 0 ? explicit : paymentSchedule.monthlyAmount * paymentSchedule.upfrontMonths;
  };

  const handlePayment = async () => {
    if (!selectedPayment || !session?.user?.id) {
      toast.error('Missing payment information');
      return;
    }

    // Validate required fields before processing payment
    if (!session.user.name || !session.user.email) {
      toast.error('Please complete your profile before making a payment');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'cash') {
        // For cash payment, mark as completed immediately (cash on arrival)
        const response = await fetch(`/api/payments/monthly/${selectedPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PAID',
            paymentMethod: 'CASH',
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Add small delay to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 500));
          onPaymentSuccess?.(selectedPayment);
          setSelectedPayment(null);
          setPaymentMethod('card');
        } else {
          throw new Error(data.error?.message || 'Failed to process cash payment');
        }
      } else {
        // Validate required fields for online payment
        const customerPhone = session.user.phone || 'N/A';
        const customerAddress = 'N/A';

        if (!customerPhone || customerPhone === '') {
          toast.error('Phone number is required for online payment');
          setIsProcessing(false);
          return;
        }

        // For card and mobile, use SSLCommerz
        const paymentRequest: PaymentRequest = {
          amount: selectedPayment.amount,
          currency: 'BDT',
          customerName: session.user.name,
          customerEmail: session.user.email,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          productName: `Monthly Payment - ${paymentSchedule.listingTitle}`,
          productDescription: `Payment for ${format(new Date(selectedPayment.dueDate), 'MMMM yyyy')}`,
          bookingId: paymentSchedule.bookingId,
          userId: session.user.id,
          listingId: paymentSchedule.listingId,
          successUrl: `${window.location.origin}/dashboard/bachelor?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/bachelor?payment=cancel`,
          failUrl: `${window.location.origin}/dashboard/bachelor?payment=fail`,
        };

        // Validate payment request
        if (!paymentRequest.amount || paymentRequest.amount <= 0) {
          throw new Error('Invalid payment amount');
        }

        if (!paymentRequest.customerName || !paymentRequest.customerEmail) {
          throw new Error('Customer name and email are required');
        }

        await initializePayment(paymentRequest);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Management</DialogTitle>
          <DialogDescription>
            {paymentSchedule.listingTitle} - Payment Schedule & History
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upfront">Upfront ({paymentSchedule.upfrontMonths}M)</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Upfront Payment</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ৳{getUpfrontTotal().toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {paymentSchedule.upfrontMonths} months advance
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Monthly Payment</div>
                    <div className="text-2xl font-bold text-green-700">
                      ৳{paymentSchedule.monthlyAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Starting after upfront</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{pendingPayments.length}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{paidPayments.length}</div>
                    <div className="text-xs text-gray-600">Paid</div>
                  </div>

                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">{overduePayments.length}</div>
                    <div className="text-xs text-gray-600">Overdue</div>
                  </div>
                </div>

                {overduePayments.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have {overduePayments.length} overdue payment(s). Please pay as soon as possible.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upfront Tab */}
          <TabsContent value="upfront" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Upfront Payment ({paymentSchedule.upfrontMonths} Months)
                </CardTitle>
                <CardDescription>
                  Pay upfront for the first {paymentSchedule.upfrontMonths} months to secure your booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upfrontPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => (payment.status === 'PENDING' || payment.status === 'OVERDUE') && setSelectedPayment(payment)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {getPaymentStatusIcon(payment.status)}
                      <div>
                        <div className="font-medium">
                          {format(new Date(payment.dueDate), 'MMMM yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold">৳{payment.amount.toLocaleString()}</div>
                      </div>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {selectedPayment && upfrontPayments.includes(selectedPayment) && (
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    onPay={handlePayment}
                    isProcessing={isProcessing || isProcessingPayment}
                    amount={selectedPayment.amount}
                    onCancel={() => setSelectedPayment(null)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remaining Monthly Payments</CardTitle>
                <CardDescription>
                  After upfront payment, pay monthly to maintain your booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {remainingPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No monthly payments scheduled yet</p>
                  </div>
                ) : (
                  remainingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => (payment.status === 'PENDING' || payment.status === 'OVERDUE') && setSelectedPayment(payment)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getPaymentStatusIcon(payment.status)}
                        <div>
                          <div className="font-medium">
                            {format(new Date(payment.dueDate), 'MMMM yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-semibold">৳{payment.amount.toLocaleString()}</div>
                        </div>
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}

                {selectedPayment && remainingPayments.includes(selectedPayment) && (
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    onPay={handlePayment}
                    isProcessing={isProcessing || isProcessingPayment}
                    amount={selectedPayment.amount}
                    onCancel={() => setSelectedPayment(null)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paidPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payments made yet</p>
                  </div>
                ) : (
                  paidPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(payment.dueDate), 'MMMM yyyy')}
                          </div>
                          <div className="text-sm text-gray-600">
                            Paid: {payment.paidDate ? format(new Date(payment.paidDate), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-semibold text-green-700">
                            ৳{payment.amount.toLocaleString()}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500">
                              ID: {payment.transactionId.slice(-8)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentMethodSelectorProps {
  selectedMethod: 'card' | 'mobile' | 'cash';
  onMethodChange: (method: 'card' | 'mobile' | 'cash') => void;
  onPay: () => void;
  isProcessing: boolean;
  amount: number;
  onCancel: () => void;
}

function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  onPay,
  isProcessing,
  amount,
  onCancel,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed">
      <div className="font-semibold text-lg">Select Payment Method</div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onMethodChange('card')}
          className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
            selectedMethod === 'card'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <CreditCard
            className={`h-6 w-6 mb-1 ${selectedMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`}
          />
          <span className={`text-xs font-medium ${selectedMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`}>
            Card & Bank
          </span>
        </button>

        <button
          onClick={() => onMethodChange('mobile')}
          className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
            selectedMethod === 'mobile'
              ? 'border-green-600 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Smartphone
            className={`h-6 w-6 mb-1 ${selectedMethod === 'mobile' ? 'text-green-600' : 'text-gray-600'}`}
          />
          <span className={`text-xs font-medium ${selectedMethod === 'mobile' ? 'text-green-600' : 'text-gray-600'}`}>
            Mobile
          </span>
        </button>

        <button
          onClick={() => onMethodChange('cash')}
          className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
            selectedMethod === 'cash'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Banknote
            className={`h-6 w-6 mb-1 ${selectedMethod === 'cash' ? 'text-purple-600' : 'text-gray-600'}`}
          />
          <span className={`text-xs font-medium ${selectedMethod === 'cash' ? 'text-purple-600' : 'text-gray-600'}`}>
            Cash
          </span>
        </button>
      </div>

      <div className="bg-white p-3 rounded-lg border">
        <div className="text-sm text-gray-600 mb-1">Total Amount</div>
        <div className="text-2xl font-bold text-primary">৳{amount.toLocaleString()}</div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={onPay}
          disabled={isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
