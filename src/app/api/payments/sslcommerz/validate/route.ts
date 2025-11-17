import { NextRequest, NextResponse } from 'next/server';
import { sslcommerzService } from '@/lib/payments/sslcommerz-service';

// POST /api/payments/sslcommerz/validate - Validate payment after completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tran_id } = body;

    if (!tran_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Validate payment with SSLCommerz
    const validation = await sslcommerzService.validatePayment(tran_id);

    return NextResponse.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Payment validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment validation failed' 
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/sslcommerz/validate - Handle success/fail/cancel redirects from SSLCommerz
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tran_id = searchParams.get('tran_id');
    const status = searchParams.get('status');

    if (!tran_id) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?error=missing_transaction_id`);
    }

    if (status === 'success' || status === 'VALID') {
      // Validate the payment
      try {
        const validation = await sslcommerzService.validatePayment(tran_id);
        
        if (validation.status === 'VALID') {
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/success?tran_id=${tran_id}`);
        } else {
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?tran_id=${tran_id}&reason=validation_failed`);
        }
      } catch (error) {
        console.error('Payment validation error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?tran_id=${tran_id}&error=validation_error`);
      }
    } else if (status === 'failed' || status === 'FAILED') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?tran_id=${tran_id}&reason=payment_failed`);
    } else if (status === 'cancelled' || status === 'CANCELLED') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?tran_id=${tran_id}`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?tran_id=${tran_id}&error=unknown_status`);
    }

  } catch (error) {
    console.error('Payment redirect handling error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/error?error=redirect_error`);
  }
}