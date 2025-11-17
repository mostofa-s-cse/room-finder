import { NextRequest, NextResponse } from 'next/server';
import { sslcommerzService } from '@/lib/payments/sslcommerz-service';
import { RefundRequest } from '@/lib/payments/types';

// POST /api/payments/sslcommerz/refund - Process refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      paymentId,
      amount,
      reason,
      refundRequestBy = 'ADMIN'
    }: RefundRequest = body;

    if (!paymentId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required refund fields' },
        { status: 400 }
      );
    }

    // Process refund with SSLCommerz
    const refundResponse = await sslcommerzService.processRefund(
      paymentId,
      amount,
      reason
    );

    if (refundResponse.status === 'success') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'SUCCESS',
          refundTransactionId: refundResponse.refund_ref_id,
          refundAmount: amount,
          message: 'Refund processed successfully'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        data: {
          status: 'FAILED',
          refundAmount: amount,
          message: refundResponse.errorReason || 'Refund processing failed'
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refund processing failed' 
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/sslcommerz/refund - Get refund status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refundRefId = searchParams.get('refund_ref_id');

    if (!refundRefId) {
      return NextResponse.json(
        { error: 'Refund reference ID is required' },
        { status: 400 }
      );
    }

    const refundStatus = await sslcommerzService.getRefundStatus(refundRefId);

    return NextResponse.json({
      success: true,
      data: refundStatus
    });

  } catch (error) {
    console.error('Refund status query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refund status query failed' 
      },
      { status: 500 }
    );
  }
}