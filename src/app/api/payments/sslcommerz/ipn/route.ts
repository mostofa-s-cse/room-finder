import { NextRequest, NextResponse } from 'next/server';
import { sslcommerzService } from '@/lib/payments/sslcommerz-service';

// POST /api/payments/sslcommerz/ipn - Instant Payment Notification webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the IPN data for debugging
    console.log('SSLCommerz IPN received:', body);

    const {
      tran_id,
      val_id,
      amount,
      card_type,
      store_amount,
      card_no,
      bank_tran_id,
      status,
      tran_date,
      currency,
      card_issuer,
      card_brand,
      card_sub_brand,
      card_issuer_country,
      card_issuer_country_code,
      store_id,
      verify_sign,
      verify_key,
      verify_sign_sha2,
      currency_type,
      currency_amount,
      currency_rate,
      base_fair,
      value_a, // bookingId
      value_b, // userId
      value_c, // listingId
      value_d, // description
      risk_level,
      risk_title
    } = body;

    // Validate required fields
    if (!tran_id || !val_id || !status) {
      console.error('Invalid IPN data: missing required fields');
      return NextResponse.json({ error: 'Invalid IPN data' }, { status: 400 });
    }

    // Verify the store ID matches
    if (store_id !== process.env.SSLCOMMERZ_STORE_ID) {
      console.error('Invalid store ID in IPN');
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    // Process the IPN based on status
    if (status === 'VALID') {
      // Payment successful
      console.log(`Payment successful for transaction: ${tran_id}`);
      
      // Validate the payment (this will update our database)
      try {
        const validation = await sslcommerzService.validatePayment(tran_id);
        console.log('Payment validation result:', validation);
      } catch (error) {
        console.error('Error validating payment in IPN:', error);
      }
      
    } else if (status === 'FAILED') {
      // Payment failed
      console.log(`Payment failed for transaction: ${tran_id}`);
      
      // Update payment status in database
      // This will be handled by the validation function
      
    } else if (status === 'CANCELLED') {
      // Payment cancelled
      console.log(`Payment cancelled for transaction: ${tran_id}`);
      
      // Update payment status in database
      // This will be handled by the validation function
      
    } else {
      console.log(`Unknown payment status: ${status} for transaction: ${tran_id}`);
    }

    // Respond with success to acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: 'IPN processed successfully',
      tran_id 
    });

  } catch (error) {
    console.error('IPN processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'IPN processing failed' 
      },
      { status: 500 }
    );
  }
}

// GET method for testing IPN endpoint
export async function GET() {
  return NextResponse.json({
    message: 'SSLCommerz IPN endpoint is working',
    timestamp: new Date().toISOString()
  });
}