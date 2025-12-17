# Payment System Integration Guide

## Files Created/Modified

### New Components Created:
1. **`src/components/payments/PaymentManagementModal.tsx`**
   - Full payment management modal with tabs
   - Handles all payment processing
   - Shows upfront and monthly payments

2. **`src/components/dashboard/PaymentTabs.tsx`**
   - Dashboard payment tracking component
   - Summary cards and payment schedule display
   - Already integrated into bachelor dashboard

### Updated Files:
1. **`src/components/forms/BookingForm.tsx`**
   - Added upfront period selector (2 or 3 months)
   - Enhanced booking summary with payment breakdown
   - Creates payment schedule on booking

2. **`src/app/dashboard/bachelor/page.tsx`**
   - Imported `PaymentTabs` component
   - Replaced old payment tab with new `PaymentTabs` component

## How It Works

### 1. Booking Flow
```
User selects room → 
Chooses upfront period (2 or 3 months) → 
Sees payment breakdown (upfront + monthly) → 
Selects payment method → 
Creates booking + payment schedule
```

### 2. Payment Tab in Dashboard
```
User goes to Payments tab →
Sees summary cards (total payable, overdue, active bookings) →
Selects "Manage Payments" button →
Opens modal with payment management
```

### 3. Payment Management Modal
```
User views overview of payment schedule →
Selects upfront or monthly payments tab →
Clicks on pending payment →
Chooses payment method →
Pays or schedules for cash on arrival
```

## Required API Endpoints

These endpoints must be implemented in your backend:

### 1. Create Payment Schedule
```
POST /api/payments/schedules
{
  bookingId: string
  listingId: string
  listingTitle: string
  upfrontAmount: number
  upfrontMonths: 2 | 3
  monthlyAmount: number
  startDate: ISO string
  endDate: ISO string
}

Response:
{
  success: boolean
  data: {
    bookingId: string
    upfrontAmount: number
    monthlyPayments: Array<{
      id: string
      month: number
      year: number
      amount: number
      dueDate: string
      status: 'PENDING' | 'PAID' | 'OVERDUE'
    }>
  }
}
```

### 2. Get Payment Schedules
```
GET /api/payments/schedules

Response:
{
  success: boolean
  data: Array<PaymentSchedule>
}
```

### 3. Update Monthly Payment
```
PUT /api/payments/monthly/{paymentId}
{
  status: 'PENDING' | 'PAID' | 'PAID_CONFIRMED'
  paymentMethod?: 'card' | 'mobile' | 'cash'
  transactionId?: string
}

Response:
{
  success: boolean
  data: {
    id: string
    status: string
    paidDate?: string
  }
}
```

## Database Schema (Recommended)

### PaymentSchedule Table
```sql
CREATE TABLE payment_schedules (
  id STRING PRIMARY KEY
  bookingId STRING UNIQUE
  upfrontAmount INT
  upfrontMonths INT (2 or 3)
  monthlyAmount INT
  startDate DATETIME
  endDate DATETIME
  status STRING ('ACTIVE', 'COMPLETED', 'CANCELLED')
  createdAt DATETIME
  updatedAt DATETIME
)

CREATE TABLE monthly_payments (
  id STRING PRIMARY KEY
  paymentScheduleId STRING
  month INT
  year INT
  amount INT
  dueDate DATETIME
  status STRING ('PENDING', 'PAID', 'OVERDUE')
  paidDate DATETIME
  transactionId STRING
  createdAt DATETIME
  updatedAt DATETIME
)
```

## UI Flow Summary

### Booking Form:
- Upfront selector appears on line ~500
- Shows 2 or 3 month options
- Automatically calculates upfront and monthly amounts
- Payment breakdown displayed in summary section

### Dashboard:
- Click "Payments" tab to see payment schedules
- Summary cards show totals, overdue count, active bookings
- Click "Manage Payments" on any schedule
- Modal opens with all payment management options

### Payment Modal:
- Overview tab: Quick summary of all payments
- Upfront tab: First {2|3} months payments
- Monthly tab: Remaining monthly payments
- History tab: Paid payments and receipt info

## Payment Methods Supported:
1. ✅ Card & Bank (via SSLCommerz)
2. ✅ Mobile Banking (via SSLCommerz)
3. ✅ Cash on Arrival (manual confirmation)

## Key Features:
✅ Transparent payment breakdown
✅ Clear upfront and monthly split
✅ Overdue payment alerts
✅ Payment history tracking
✅ Multiple payment methods
✅ Mobile-responsive design
✅ Real-time payment status
