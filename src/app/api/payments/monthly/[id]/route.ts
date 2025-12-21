import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, paymentMethod } = await request.json();
    const resolvedParams = await params;
    const paymentId = resolvedParams?.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: { message: 'Payment ID is required' } },
        { status: 400 }
      );
    }

    // Validate input
    if (!status) {
      return NextResponse.json(
        { error: { message: 'Status is required' } },
        { status: 400 }
      );
    }

    // Find monthly payment and verify ownership via booking
    const monthly = await prisma.monthlyPayment.findFirst({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!monthly || monthly.booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: { message: 'Monthly payment not found' } },
        { status: 404 }
      );
    }

    // Update monthly payment record
    const updated = await prisma.monthlyPayment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentMethod: paymentMethod || monthly.paymentMethod || null,
        paidAt: status === 'PAID' ? new Date() : monthly.paidAt,
      },
    });

    console.log('Payment updated successfully:', { 
      id: updated.id, 
      status: updated.status, 
      paymentMethod: updated.paymentMethod 
    });

    // Serialize dates to ISO strings for JSON response
    const serializedData = {
      ...updated,
      dueDate: updated.dueDate.toISOString(),
      periodStart: updated.periodStart.toISOString(),
      periodEnd: updated.periodEnd.toISOString(),
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      data: serializedData,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update payment',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const paymentId = resolvedParams?.id;

    if (!paymentId) {
      return NextResponse.json(
        { error: { message: 'Payment ID is required' } },
        { status: 400 }
      );
    }

    const monthly = await prisma.monthlyPayment.findFirst({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!monthly || monthly.booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: { message: 'Monthly payment not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: monthly,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch payment',
        },
      },
      { status: 500 }
    );
  }
}
