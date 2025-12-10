import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { BookingStatus, PaymentStatus } from '@prisma/client';

// POST /api/bookings/:id/retry-payment - Reinitialize payment for a pending booking
export const POST = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    console.log('=== Retry Payment Endpoint ===');
    
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;
    console.log('Booking ID:', bookingId);

    if (!bookingId) {
      return Response.json(
        { error: { message: 'Booking ID is required', code: 'MISSING_PARAMETER' } },
        { status: 400 }
      );
    }

    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const paymentMethod = (body?.paymentMethod as string | undefined)?.toLowerCase() || 'card';
    console.log('Session:', { userId: session.user.id });

    // Get the booking with related data
    console.log('Fetching booking...');
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    console.log('Booking found:', booking ? { id: booking.id, status: booking.status } : null);

    if (!booking) {
      return Response.json(
        { error: { message: 'Booking not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Only allow the booking owner to retry payment
    if (booking.userId !== session.user.id) {
      console.log('Unauthorized:', { expectedUserId: booking.userId, actualUserId: session.user.id });
      return Response.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 403 }
      );
    }

    // Check if booking is in PENDING status
    if (booking.status !== BookingStatus.PENDING) {
      console.log('Booking not in PENDING status:', booking.status);
      return Response.json(
        { error: { message: 'Booking is not available for payment retry', code: 'INVALID_STATUS' } },
        { status: 400 }
      );
    }

    // Get or create a payment record for this booking
    console.log('Looking for payment record...');
    let payment = await prisma.bookingPayment.findFirst({
      where: {
        bookingId: booking.id,
      },
    });
    
    console.log('Payment found:', payment ? { id: payment.id, status: payment.status } : null);

    if (!payment) {
      // Create a new payment record if one doesn't exist
      console.log('Creating new payment record...');
      payment = await prisma.bookingPayment.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId,
          listingId: booking.listingId,
          amount: booking.amount,
          status: PaymentStatus.PENDING,
        }
      });
      console.log('Payment created:', payment.id);
    }

    // If cash-on-arrival selected, mark payment/booking as completed immediately
    if (paymentMethod === 'cash') {
      console.log('Cash payment selected; marking as completed');

      const updatedPayment = await prisma.bookingPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paymentAt: new Date(),
          paymentMethod: 'CASH',
        },
      });

      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.PAID,
        },
      });

      return Response.json({
        data: {
          payment: {
            id: updatedPayment.id,
            bookingId: booking.id,
            amount: booking.amount,
            status: updatedPayment.status,
            paymentMethod: 'CASH',
          },
          booking: {
            id: updatedBooking.id,
            status: updatedBooking.status,
          },
        },
      }, { status: 200 });
    }

    // Return payment details for retry (card/mobile)
    console.log('Returning success response');
    return Response.json({
      data: {
        payment: {
          id: payment.id,
          bookingId: booking.id,
          amount: booking.amount,
          status: payment.status,
        },
        booking: {
          id: booking.id,
          customerName: booking.user?.name || '',
          customerEmail: booking.user?.email || '',
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Retry Payment Error:', error);
    return Response.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    );
  }
};
