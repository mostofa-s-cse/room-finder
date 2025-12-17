# Backend Implementation Examples

## Prisma Schema Updates

Add these models to your `prisma/schema.prisma`:

```prisma
model PaymentSchedule {
  id                 String   @id @default(cuid())
  booking            Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId          String   @unique
  
  upfrontAmount      Int      // Total upfront payment amount
  upfrontMonths      Int      // 2 or 3 months
  monthlyAmount      Int      // Monthly payment amount after upfront
  
  startDate          DateTime
  endDate            DateTime
  
  monthlyPayments    MonthlyPayment[]
  
  status             String   @default("ACTIVE") // ACTIVE, COMPLETED, CANCELLED
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@index([bookingId])
}

model MonthlyPayment {
  id                 String   @id @default(cuid())
  schedule           PaymentSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  scheduleId         String
  
  month              Int      // 1-12
  year               Int
  
  amount             Int      // Payment amount for this month
  dueDate            DateTime
  
  status             String   @default("PENDING") // PENDING, PAID, OVERDUE, PAST_DUE
  
  transactionId      String?
  paymentMethod      String?  // card, mobile, cash
  paidDate           DateTime?
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  @@index([scheduleId])
  @@index([dueDate])
}
```

## API Implementation Examples

### 1. Create Payment Schedule

```typescript
// api/payments/schedules/route.ts
import { prisma } from '@/lib/prisma';
import { addMonths, startOfDay } from 'date-fns';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      bookingId,
      listingId,
      upfrontAmount,
      upfrontMonths,
      monthlyAmount,
      startDate,
      endDate,
    } = body;

    // Calculate total months
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalMonths = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Create payment schedule
    const schedule = await prisma.paymentSchedule.create({
      data: {
        bookingId,
        upfrontAmount,
        upfrontMonths,
        monthlyAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE',
      },
    });

    // Create monthly payment records
    const monthlyPayments = [];
    
    // Upfront payments (marked as PENDING initially)
    for (let i = 0; i < upfrontMonths; i++) {
      const paymentDate = addMonths(start, i);
      monthlyPayments.push({
        scheduleId: schedule.id,
        month: paymentDate.getMonth() + 1,
        year: paymentDate.getFullYear(),
        amount: monthlyAmount,
        dueDate: startOfDay(paymentDate),
        status: 'PENDING',
      });
    }

    // Remaining monthly payments
    for (let i = upfrontMonths; i < totalMonths; i++) {
      const paymentDate = addMonths(start, i);
      monthlyPayments.push({
        scheduleId: schedule.id,
        month: paymentDate.getMonth() + 1,
        year: paymentDate.getFullYear(),
        amount: monthlyAmount,
        dueDate: startOfDay(paymentDate),
        status: 'PENDING',
      });
    }

    await prisma.monthlyPayment.createMany({
      data: monthlyPayments,
    });

    return Response.json({
      success: true,
      data: {
        ...schedule,
        monthlyPayments,
      },
    });
  } catch (error) {
    console.error('Error creating payment schedule:', error);
    return Response.json(
      { success: false, error: 'Failed to create payment schedule' },
      { status: 500 }
    );
  }
}
```

### 2. Get Payment Schedules

```typescript
// api/payments/schedules/route.ts (GET)
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const schedules = await prisma.paymentSchedule.findMany({
      where: {
        booking: {
          userId: session.user.id,
        },
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        monthlyPayments: {
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for frontend
    const transformedSchedules = schedules.map((schedule) => ({
      bookingId: schedule.bookingId,
      listingId: schedule.booking.listing.id,
      listingTitle: schedule.booking.listing.title,
      upfrontAmount: schedule.upfrontAmount,
      upfrontMonths: schedule.upfrontMonths,
      monthlyAmount: schedule.monthlyAmount,
      startDate: schedule.startDate.toISOString(),
      endDate: schedule.endDate.toISOString(),
      totalMonths: schedule.monthlyPayments.length,
      monthlyPayments: schedule.monthlyPayments.map((payment) => ({
        id: payment.id,
        month: payment.month,
        year: payment.year,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
        paidDate: payment.paidDate?.toISOString(),
        transactionId: payment.transactionId,
      })),
      status: schedule.status,
    }));

    return Response.json({
      success: true,
      data: transformedSchedules,
    });
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch payment schedules' },
      { status: 500 }
    );
  }
}
```

### 3. Update Monthly Payment

```typescript
// api/payments/monthly/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, paymentMethod, transactionId } = await request.json();

    const payment = await prisma.monthlyPayment.update({
      where: { id: params.id },
      data: {
        status,
        paymentMethod,
        transactionId,
        ...(status === 'PAID' && { paidDate: new Date() }),
      },
    });

    // Check if all payments are paid, then mark schedule as COMPLETED
    const schedule = await prisma.paymentSchedule.findUnique({
      where: { id: payment.scheduleId },
      include: { monthlyPayments: true },
    });

    if (
      schedule &&
      schedule.monthlyPayments.every((p) => p.status === 'PAID')
    ) {
      await prisma.paymentSchedule.update({
        where: { id: payment.scheduleId },
        data: { status: 'COMPLETED' },
      });
    }

    return Response.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error updating monthly payment:', error);
    return Response.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
```

### 4. Cron Job - Mark Overdue Payments

```typescript
// api/cron/mark-overdue-payments.ts
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const now = new Date();
    
    // Mark payments as OVERDUE if due date has passed
    await prisma.monthlyPayment.updateMany({
      where: {
        AND: [
          { status: 'PENDING' },
          { dueDate: { lt: now } },
        ],
      },
      data: { status: 'OVERDUE' },
    });

    return Response.json({
      success: true,
      message: 'Marked overdue payments',
    });
  } catch (error) {
    console.error('Error marking overdue payments:', error);
    return Response.json(
      { success: false, error: 'Failed to mark overdue payments' },
      { status: 500 }
    );
  }
}
```

## Booking Model Update

Update your booking creation to include `upfrontMonths` and `monthlyAmount`:

```typescript
// In your booking creation endpoint
const booking = await prisma.booking.create({
  data: {
    listingId,
    userId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: 'PENDING',
    totalAmount: amount, // Upfront amount
    // Add these if in your schema
    upfrontMonths: upfrontMonths,
    monthlyAmount: monthlyAmount,
  },
});

// Then create payment schedule
await fetch('/api/payments/schedules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: booking.id,
    upfrontAmount: amount,
    upfrontMonths,
    monthlyAmount,
    startDate,
    endDate,
  }),
});
```

## Testing Payment Status

```bash
# Test creating a payment schedule
curl -X POST http://localhost:3000/api/payments/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "upfrontAmount": 15000,
    "upfrontMonths": 2,
    "monthlyAmount": 7500,
    "startDate": "2025-12-17T00:00:00Z",
    "endDate": "2025-03-17T00:00:00Z"
  }'

# Test fetching schedules
curl -X GET http://localhost:3000/api/payments/schedules

# Test updating payment status
curl -X PUT http://localhost:3000/api/payments/monthly/payment_123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paymentMethod": "card",
    "transactionId": "TXN_ABC123"
  }'
```

## Environment Variables

```env
# For payment processing
NEXT_PUBLIC_SSLCOMMERZ_STORE_ID=your_store_id
NEXT_PUBLIC_SSLCOMMERZ_STORE_PASSWORD=your_password

# For cron jobs (if using external service)
CRON_SECRET=your_secret_key
```

## Next Steps

1. ✅ Copy Prisma schema updates
2. ✅ Run `npx prisma migrate dev --name add_payment_schedules`
3. ✅ Implement the API endpoints
4. ✅ Set up cron jobs for overdue marking
5. ✅ Test payment flows
6. ✅ Deploy to production
