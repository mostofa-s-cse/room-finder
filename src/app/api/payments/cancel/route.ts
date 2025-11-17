import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transactionId = formData.get('tran_id') as string;

    if (transactionId) {
      await paymentService.handlePaymentFailure(
        transactionId,
        'Payment cancelled by user'
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?booking=${transactionId}`
    );
  } catch (error) {
    console.error('Payment cancel callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?error=processing`
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('tran_id');

  if (transactionId) {
    try {
      await paymentService.handlePaymentFailure(
        transactionId,
        'Payment cancelled by user'
      );
    } catch (error) {
      console.error('Payment cancellation handling error:', error);
    }
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?booking=${transactionId}`
  );
}