import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transactionId = formData.get('tran_id') as string;
    const valId = formData.get('val_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const status = formData.get('status') as string;

    if (!transactionId || !valId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (status !== 'VALID' && status !== 'VALIDATED') {
      await paymentService.handlePaymentFailure(
        transactionId,
        'Payment validation failed'
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?booking=${transactionId}`
      );
    }

    const payment = await paymentService.handlePaymentSuccess(
      transactionId,
      valId,
      amount
    );

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?booking=${payment.bookingId}`
    );
  } catch (error) {
    console.error('Payment success callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=processing`
    );
  }
}

// Handle GET requests (when user returns from payment gateway)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('tran_id');
  const valId = searchParams.get('val_id');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');

  if (!transactionId || !valId || !amount) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=missing-params`
    );
  }

  try {
    if (status !== 'VALID' && status !== 'VALIDATED') {
      await paymentService.handlePaymentFailure(
        transactionId,
        'Payment validation failed'
      );
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?booking=${transactionId}`
      );
    }

    const payment = await paymentService.handlePaymentSuccess(
      transactionId,
      valId,
      parseFloat(amount)
    );

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?booking=${payment.bookingId}`
    );
  } catch (error) {
    console.error('Payment success GET error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=processing`
    );
  }
}