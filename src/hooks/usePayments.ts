'use client';

import { useState, useCallback } from 'react';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentValidation,
  RefundRequest,
  RefundResponse,
  PaymentError,
  Transaction
} from '@/lib/payments/types';

interface UseSSLCommerzOptions {
  onSuccess?: (validation: PaymentValidation) => void;
  onError?: (error: PaymentError) => void;
  onCancel?: () => void;
}

export function useSSLCommerz(options: UseSSLCommerzOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);

  // Initialize payment
  const initializePayment = useCallback(async (paymentRequest: PaymentRequest): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/sslcommerz/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      if (result.success && result.data) {
        setPaymentData(result.data);
        
        // Redirect to SSLCommerz payment gateway
        if (result.data.redirectGatewayURL) {
          window.location.href = result.data.redirectGatewayURL;
          return true;
        } else {
          throw new Error('No payment gateway URL received');
        }
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (err) {
      const paymentError: PaymentError = {
        code: 'PAYMENT_INIT_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        type: 'api_error',
      };
      
      setError(paymentError);
      options.onError?.(paymentError);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  // Validate payment (called after user returns from gateway)
  const validatePayment = useCallback(async (transactionId: string): Promise<PaymentValidation | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/sslcommerz/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tran_id: transactionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment validation failed');
      }

      if (result.success && result.data) {
        const validation: PaymentValidation = result.data;
        
        if (validation.status === 'VALID') {
          options.onSuccess?.(validation);
        } else {
          const paymentError: PaymentError = {
            code: 'PAYMENT_VALIDATION_ERROR',
            message: 'Payment validation failed',
            type: 'validation_error',
          };
          setError(paymentError);
          options.onError?.(paymentError);
        }
        
        return validation;
      } else {
        throw new Error(result.error || 'Payment validation failed');
      }
    } catch (err) {
      const paymentError: PaymentError = {
        code: 'PAYMENT_VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        type: 'api_error',
      };
      
      setError(paymentError);
      options.onError?.(paymentError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  // Get payment status
  const getPaymentStatus = useCallback(async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/sslcommerz/init?tran_id=${transactionId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get payment status');
      }
    } catch (err) {
      console.error('Error getting payment status:', err);
      return null;
    }
  }, []);

  return {
    initializePayment,
    validatePayment,
    getPaymentStatus,
    isProcessing,
    error,
    paymentData,
    clearError: () => setError(null),
  };
}

interface UsePaymentRefundOptions {
  onSuccess?: (refund: RefundResponse) => void;
  onError?: (error: PaymentError) => void;
}

export function usePaymentRefund(options: UsePaymentRefundOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);

  const processRefund = useCallback(async (refundRequest: RefundRequest): Promise<RefundResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/sslcommerz/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundRequest),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Refund processing failed');
      }

      if (result.success && result.data) {
        const refundResponse: RefundResponse = result.data;
        options.onSuccess?.(refundResponse);
        return refundResponse;
      } else {
        throw new Error(result.error || 'Refund processing failed');
      }
    } catch (err) {
      const paymentError: PaymentError = {
        code: 'REFUND_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        type: 'api_error',
      };
      
      setError(paymentError);
      options.onError?.(paymentError);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  const getRefundStatus = useCallback(async (refundRefId: string) => {
    try {
      const response = await fetch(`/api/payments/sslcommerz/refund?refund_ref_id=${refundRefId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get refund status');
      }
    } catch (err) {
      console.error('Error getting refund status:', err);
      return null;
    }
  }, []);

  return {
    processRefund,
    getRefundStatus,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}

interface UsePaymentHistoryOptions {
  userId?: string;
}

export function usePaymentHistory(options: UsePaymentHistoryOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentHistory = useCallback(async () => {
    if (!options.userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/history?userId=${options.userId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setTransactions(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch payment history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.userId]);

  return {
    transactions,
    loading,
    error,
    fetchPaymentHistory,
    refetch: fetchPaymentHistory,
  };
}

// Hook for payment form state management
interface PaymentFormData {
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productDescription?: string;
}

export function usePaymentForm(initialData?: Partial<PaymentFormData>) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    currency: 'BDT',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    productName: '',
    productDescription: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});

  const updateField = useCallback((field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof PaymentFormData, string>> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Customer phone is required';
    }

    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      amount: 0,
      currency: 'BDT',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      productName: '',
      productDescription: '',
      ...initialData,
    });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  };
}