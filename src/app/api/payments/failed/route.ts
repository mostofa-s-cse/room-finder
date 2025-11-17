import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transactionId = formData.get('tran_id') as string;
    const failedReason = formData.get('error') as string || 'Payment failed';

    if (transactionId) {
      await paymentService.handlePaymentFailure(transactionId, failedReason);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?booking=${transactionId}&reason=${encodeURIComponent(failedReason)}`
    );
  } catch (error) {
    console.error('Payment failure callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?error=processing`
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('tran_id');
  const failedReason = searchParams.get('error') || 'Payment failed';

  if (transactionId) {
    try {
      await paymentService.handlePaymentFailure(
        transactionId,
        failedReason
      );
    } catch (error) {
      console.error('Payment failure handling error:', error);
    }
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?booking=${transactionId}&reason=${encodeURIComponent(failedReason)}`
  );
}