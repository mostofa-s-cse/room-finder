import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/payments/payment-service';
import { RefundRequest } from '@/lib/payments/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, reason } = await request.json();
    const { paymentId } = await params;

    if (!amount || !reason) {
      return NextResponse.json(
        { error: 'Amount and reason are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to refund this payment
    const payment = await paymentService.getPayment(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only allow refund by payment owner, landlord, or admin
    const isAuthorized = 
      payment.userId === session.user.id ||
      session.user.role === 'ADMIN';
      // TODO: Add landlord check

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const refundRequest: RefundRequest = {
      paymentId,
      amount,
      reason,
      refundRequestBy: session.user.role === 'ADMIN' ? 'ADMIN' : 'USER'
    };

    const result = await paymentService.processRefund(
      paymentId,
      refundRequest,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund processing failed' },
      { status: 500 }
    );
  }
}