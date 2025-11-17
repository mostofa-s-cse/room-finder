import { NextRequest, NextResponse } from 'next/server';
import { sslCommerzService } from '@/lib/payments/ssl-commerce';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentWebhookData } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const webhookData: PaymentWebhookData = {
      status: formData.get('status') as string,
      tran_date: formData.get('tran_date') as string,
      tran_id: formData.get('tran_id') as string,
      val_id: formData.get('val_id') as string,
      amount: formData.get('amount') as string,
      store_amount: formData.get('store_amount') as string,
      currency: formData.get('currency') as string,
      bank_tran_id: formData.get('bank_tran_id') as string || undefined,
      card_type: formData.get('card_type') as string || undefined,
      card_no: formData.get('card_no') as string || undefined,
      card_issuer: formData.get('card_issuer') as string || undefined,
      card_brand: formData.get('card_brand') as string || undefined,
      card_issuer_country: formData.get('card_issuer_country') as string || undefined,
      card_issuer_country_code: formData.get('card_issuer_country_code') as string || undefined,
      verify_sign: formData.get('verify_sign') as string,
      verify_key: formData.get('verify_key') as string,
      risk_level: formData.get('risk_level') as string || undefined,
      risk_title: formData.get('risk_title') as string || undefined
    };

    // Verify webhook signature
    const isValid = sslCommerzService.verifyWebhook(webhookData);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process webhook based on status
    if (webhookData.status === 'VALID' || webhookData.status === 'VALIDATED') {
      await paymentService.handlePaymentSuccess(
        webhookData.tran_id,
        webhookData.val_id,
        parseFloat(webhookData.amount)
      );
    } else {
      await paymentService.handlePaymentFailure(
        webhookData.tran_id,
        `Payment failed with status: ${webhookData.status}`
      );
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}