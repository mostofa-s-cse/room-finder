import { NextRequest, NextResponse } from 'next/server';
import { sslcommerzService } from '@/lib/payments/sslcommerz-service';
import { PaymentRequest } from '@/lib/payments/types';

// POST /api/payments/sslcommerz/init - Initialize payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      amount,
      currency = 'BDT',
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      productName,
      productDescription,
      bookingId,
      userId,
      listingId,
      successUrl,
      cancelUrl,
      failUrl
    } = body;

    if (!amount || !customerName || !customerEmail || !bookingId || !userId || !listingId) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      amount: parseFloat(amount),
      currency,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || 'Dhaka, Bangladesh',
      productName: productName || 'Room Booking',
      productDescription,
      bookingId,
      userId,
      listingId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      failUrl: failUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail`,
    };

    // Initialize payment with SSLCommerz
    const paymentResponse = await sslcommerzService.createPaymentSession(paymentRequest);

    return NextResponse.json({
      success: true,
      data: paymentResponse
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment initialization failed' 
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/sslcommerz/init - Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('tran_id');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const status = await sslcommerzService.getTransactionStatus(transactionId);

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Payment status query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Status query failed' 
      },
      { status: 500 }
    );
  }
}