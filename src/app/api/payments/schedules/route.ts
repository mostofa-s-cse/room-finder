import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch bookings for the user with listing and monthly payments
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED'] },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        monthlyPayments: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Transform bookings into payment schedules format
    const paymentSchedules = bookings.map((booking) => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      // Compute total months by existing monthly payments or by date range
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const computedTotalMonths = Math.max(1, Math.ceil(totalDays / 30));
      const hasRows = booking.monthlyPayments && booking.monthlyPayments.length > 0;

      // Determine schedule status based on booking status and dates
      let scheduleStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'ACTIVE';
      if (booking.status === 'COMPLETED') {
        scheduleStatus = 'COMPLETED';
      } else if (booking.status === 'CANCELLED') {
        scheduleStatus = 'CANCELLED';
      } else if (new Date() > endDate) {
        scheduleStatus = 'COMPLETED';
      }

      // Build monthly payments from persisted rows if available; otherwise compute ephemerally
      const monthlyPayments = hasRows
        ? booking.monthlyPayments
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((row, idx) => {
              const due = new Date(row.dueDate);
              const status: 'PENDING' | 'PAID' | 'OVERDUE' = ((): 'PENDING' | 'PAID' | 'OVERDUE' => {
                if (row.status === 'PAID') return 'PAID';
                if (row.status === 'PENDING' || row.status === 'PENDING_CONFIRMATION') {
                  return new Date() > due && scheduleStatus !== 'COMPLETED' ? 'OVERDUE' : 'PENDING';
                }
                if (row.status === 'OVERDUE') return 'OVERDUE';
                return 'PENDING';
              })();
              return {
                id: row.id,
                month: idx + 1,
                year: due.getFullYear(),
                amount: row.amount,
                dueDate: row.dueDate.toISOString(),
                status,
                paidDate: row.paidAt ? row.paidAt.toISOString() : undefined,
                transactionId: row.transactionId || undefined,
                type: row.type,
              };
            })
        : (() => {
            const defaultUpfrontMonths: 2 | 3 = 2;
            const monthlyAmount = booking.listing.price;
            const items: Array<{
              id: string;
              month: number;
              year: number;
              amount: number;
              dueDate: string;
              status: 'PENDING' | 'PAID' | 'OVERDUE';
              type: 'UPFRONT' | 'MONTHLY';
            }> = [];
            const totalMonths = computedTotalMonths;
            for (let i = 0; i < totalMonths; i++) {
              const paymentDate = new Date(startDate);
              paymentDate.setMonth(paymentDate.getMonth() + i);
              const isUpfront = i < defaultUpfrontMonths;
              const status: 'PENDING' | 'PAID' | 'OVERDUE' = new Date() > paymentDate && scheduleStatus !== 'COMPLETED' ? 'OVERDUE' : 'PENDING';
              items.push({
                id: `${booking.id}-${isUpfront ? 'upfront' : 'monthly'}-${i}`,
                month: i + 1,
                year: paymentDate.getFullYear(),
                amount: monthlyAmount,
                dueDate: paymentDate.toISOString(),
                status,
                type: isUpfront ? 'UPFRONT' : 'MONTHLY',
              });
            }
            return items;
          })();

      return {
        bookingId: booking.id,
        listingTitle: booking.listing.title,
        listingId: booking.listing.id,
        upfrontMonths: (hasRows
          ? (booking.monthlyPayments.filter((p) => p.type === 'UPFRONT').length || 2)
          : 2) as 2 | 3,
        monthlyAmount: booking.listing.price,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        totalMonths: hasRows ? booking.monthlyPayments.length : computedTotalMonths,
        monthlyPayments,
        status: scheduleStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: paymentSchedules,
    });
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment schedules',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      bookingId,
      listingId,
      upfrontAmount,
      upfrontMonths,
      monthlyAmount,
      startDate,
      endDate,
    } = await request.json();

    if (!bookingId || !listingId || !upfrontAmount || !upfrontMonths || !monthlyAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if monthly payments already exist
    const existing = await prisma.monthlyPayment.findMany({
      where: { bookingId },
      select: { id: true },
    });

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Payment schedule already exists',
        data: { bookingId, count: existing.length },
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalMonths = Math.max(1, Math.ceil(totalDays / 30));

    const rows: {
      bookingId: string;
      userId: string;
      listingId: string;
      type: string;
      amount: number;
      currency: string;
      status: string;
      dueDate: Date;
      periodStart: Date;
      periodEnd: Date;
    }[] = [];

    for (let i = 0; i < totalMonths; i++) {
      const periodStart = new Date(start);
      periodStart.setMonth(periodStart.getMonth() + i);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const type = i < upfrontMonths ? 'UPFRONT' : 'MONTHLY';
      rows.push({
        bookingId,
        userId: session.user.id,
        listingId,
        type,
        amount: monthlyAmount,
        currency: 'BDT',
        status: 'PENDING',
        dueDate: periodStart,
        periodStart,
        periodEnd,
      });
    }

    // Persist monthly payments
    await prisma.monthlyPayment.createMany({ data: rows, skipDuplicates: true });

    return NextResponse.json({
      success: true,
      message: 'Payment schedule created successfully',
      data: {
        bookingId,
        upfrontMonths,
        monthlyAmount,
        totalMonths,
      },
    });
  } catch (error) {
    console.error('Error creating payment schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment schedule',
      },
      { status: 500 }
    );
  }
}
