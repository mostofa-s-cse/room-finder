# 📱 Payment System - Visual & Flow Guide

## User Interface Flow

### 1️⃣ BOOKING PAGE - Upfront Payment Selection

```
┌─────────────────────────────────────────────────────────────┐
│  Cozy Studio Room - ৳15,000/month                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 Check-in: Dec 20, 2025        📅 Check-out: Mar 20, 2026 │
│                                                               │
│  👥 Number of Guests: 1                                      │
│                                                               │
│  💰 Upfront Payment Period * (SELECT ONE)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐      ┌──────────────┐                 │ │
│  │  │ 2 Months     │  or  │ 3 Months     │                 │ │
│  │  │ ৳30,000      │      │ ৳45,000      │                 │ │
│  │  └──────────────┘      └──────────────┘                 │ │
│  │              (Selected: 2 Months)                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  📋 BOOKING OVERVIEW                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Total Duration: 91 days (3.0 months)                     │ │
│  │                                                          │ │
│  │ 💳 UPFRONT PAYMENT (2 Months)                           │ │
│  │ Rate: ৳500/day                                           │ │
│  │ Upfront Total: ৳30,000                                   │ │
│  │                                                          │ │
│  │ 📅 REMAINING MONTHLY PAYMENTS                           │ │
│  │ Monthly Rate: ৳15,000/month                              │ │
│  │ Remaining: 1 month                                       │ │
│  │ Remaining Total: ৳15,000                                 │ │
│  │                                                          │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │ GRAND TOTAL: ৳45,000                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [    CANCEL    ]  [  PROCEED TO PAYMENT  ]                   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2️⃣ DASHBOARD - PAYMENTS TAB

```
┌─────────────────────────────────────────────────────────────┐
│  Payment Management                                           │
│  Track upfront and monthly payments for your bookings        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 💰 PAYABLE   │  │ ⚠️  OVERDUE  │  │ 🏠 ACTIVE    │       │
│  │ ৳45,000      │  │ 0            │  │ 1            │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Tabs: [ACTIVE] [COMPLETED]                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🏢 Cozy Studio Room                      [ACTIVE]        │ │
│  │ Booking: Dec 20, 2025 - Mar 20, 2026                    │ │
│  │                                                          │ │
│  │ ┌────────────────────┐  ┌────────────────────┐          │ │
│  │ │ 💳 UPFRONT (2M)    │  │ 📅 MONTHLY         │          │ │
│  │ │ ৳30,000            │  │ ৳15,000            │          │ │
│  │ └────────────────────┘  └────────────────────┘          │ │
│  │                                                          │ │
│  │ Payment Status: ✅ PAID  ⏳ PENDING  ⚠️ OVERDUE         │ │
│  │ [   3   ]     [  0   ]    [  1   ]                      │ │
│  │                                                          │ │
│  │ Next Payment:                                            │ │
│  │ ┌──────────────────────────────────────────────────┐    │ │
│  │ │ January 2026                                    │    │ │
│  │ │ Due: Jan 01, 2026                  ৳15,000     │    │ │
│  │ └──────────────────────────────────────────────────┘    │ │
│  │                                                          │ │
│  │ [   MANAGE PAYMENTS  ]                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ PAYMENT MODAL - Overview Tab

```
┌─────────────────────────────────────────────────────────────┐
│ Payment Management                                            │
│ Cozy Studio Room - Payment Schedule & History                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ TABS: [OVERVIEW] [UPFRONT (2M)] [MONTHLY] [HISTORY]         │
│                                                               │
│ 📊 PAYMENT SUMMARY                                           │
│ ┌────────────────────────┐  ┌────────────────────────┐      │
│ │ 💳 Upfront Payment     │  │ 📅 Monthly Payment     │      │
│ │ ৳30,000                │  │ ৳15,000                │      │
│ │ 2 months advance       │  │ Starting after upfront │      │
│ └────────────────────────┘  └────────────────────────┘      │
│                                                               │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│ │ ⏳ PENDING  │  │ ✅ PAID    │  │ ⚠️ OVERDUE │              │
│ │ 1          │  │ 2          │  │ 0          │              │
│ └────────────┘  └────────────┘  └────────────┘              │
│                                                               │
│ ✓ All payments due 🔔 1 pending payment                      │
│                                                               │
│ [    CLOSE    ]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4️⃣ PAYMENT MODAL - Upfront Tab

```
┌─────────────────────────────────────────────────────────────┐
│ TABS: [OVERVIEW] [UPFRONT (2M)] [MONTHLY] [HISTORY]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 💳 Upfront Payment (2 Months)                                │
│ Pay upfront for the first 2 months to secure your booking    │
│                                                               │
│ Payment Items:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ December 2025               [PENDING]  ৳15,000       │ │
│ │ Due: Dec 20, 2025                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ January 2026                [PENDING]  ৳15,000       │ │
│ │ Due: Jan 20, 2026                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ 💳 SELECT PAYMENT METHOD                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│ │ 💳 Card      │  │ 📱 Mobile    │  │ 💵 Cash      │        │
│ │ & Bank       │  │ Banking      │  │ On Arrival   │        │
│ │ (Selected)   │  │              │  │              │        │
│ └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│ Total Amount: ৳15,000                                        │
│                                                               │
│ [    CANCEL    ]  [  PAY NOW  ]                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5️⃣ PAYMENT MODAL - Monthly Tab

```
┌─────────────────────────────────────────────────────────────┐
│ TABS: [OVERVIEW] [UPFRONT (2M)] [MONTHLY] [HISTORY]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📅 Remaining Monthly Payments                                │
│ After upfront payment, pay monthly to maintain your booking  │
│                                                               │
│ Payment Items:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 February 2026               [PENDING]  ৳15,000       │ │
│ │ Due: Feb 20, 2026                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 March 2026                  [PENDING]  ৳15,000       │ │
│ │ Due: Mar 20, 2026                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ 💡 Click on any payment to pay it now                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 6️⃣ PAYMENT MODAL - History Tab

```
┌─────────────────────────────────────────────────────────────┐
│ TABS: [OVERVIEW] [UPFRONT (2M)] [MONTHLY] [HISTORY]         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📜 Payment History                                           │
│                                                               │
│ ✅ PAID PAYMENTS:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ December 2025              ৳15,000  ✅ PAID          │ │
│ │ Paid: Dec 20, 2025                                     │ │
│ │ Transaction ID: TXN_ABC123                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ January 2026               ৳15,000  ✅ PAID          │ │
│ │ Paid: Jan 05, 2026                                     │ │
│ │ Transaction ID: TXN_XYZ789                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [    CLOSE    ]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Payment Status Flow

```
PAYMENT LIFECYCLE:

PENDING ──► Pay Now? ──► Processing... ──► ✅ PAID
   ▲                                         │
   │                                         └─► 📜 History
   │
   │
   └─► (Date Passes) ──► ⚠️ OVERDUE
       (Not Paid)           │
                           └─► Pay Now? ──► Catch Up!
```

---

## 💰 Pricing Breakdown Example

```
Room Price: ৳15,000/month
Duration: 91 days (3 months)
Upfront Selection: 2 months

CALCULATION:
Daily Rate = ৳15,000 ÷ 30 = ৳500/day

Upfront Payment (2 months):
Days: 2 × 30 = 60 days
Amount: 60 × ৳500 = ৳30,000

Remaining Period: 31 days (1 month)
Monthly Payment: ৳15,000

TOTAL: ৳30,000 (upfront) + ৳15,000 (monthly) = ৳45,000
```

---

## 📊 Payment Status Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| PENDING | 🟡 Yellow | ⏳ | Waiting for payment |
| PAID | 🟢 Green | ✅ | Successfully paid |
| OVERDUE | 🔴 Red | ⚠️ | Past due date |

---

## 🎯 User Journey Map

```
START
  │
  ├─► Browse Rooms
  │     │
  │     └─► Find Room
  │           │
  │           └─► Click "Book Now"
  │                 │
  │                 ├─► SELECT DATES
  │                 │
  │                 ├─► SELECT UPFRONT PERIOD ⭐ NEW
  │                 │     (2 or 3 months)
  │                 │
  │                 ├─► REVIEW PAYMENT BREAKDOWN ⭐ ENHANCED
  │                 │     (Upfront + Monthly)
  │                 │
  │                 ├─► SELECT PAYMENT METHOD
  │                 │
  │                 ├─► COMPLETE PAYMENT
  │                 │
  │                 └─► BOOKING CONFIRMED ✅
  │                       │
  │                       ├─► Payment Schedule Created
  │                       │
  │                       └─► Dashboard Shows Payments ⭐ NEW
  │                             │
  │                             └─► Manage Monthly Payments ⭐ NEW
  │                                   │
  │                                   └─► View Payment History ⭐ NEW
  │
END
```

---

## 📈 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  BookingForm          Dashboard              PaymentModal │
│  • Upfront Selector   • PaymentTabs         • 4 Tabs      │
│  • Price Breakdown    • Summary Cards       • Payments    │
│  • Payment Methods    • Schedules           • History     │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                  COMPONENT LAYER                          │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  PaymentManagementModal    PaymentTabs                    │
│  • Handles payment logic    • Manages dashboard view      │
│  • Integrates SSLCommerz    • Fetches schedules          │
│  • Tracks status            • Displays summaries          │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                    API LAYER                              │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  POST /api/payments/schedules                            │
│  GET /api/payments/schedules                             │
│  PUT /api/payments/monthly/{id}                          │
│  (POST /api/bookings - with upfront data)                │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                  DATABASE LAYER                           │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  PaymentSchedule Table    MonthlyPayment Table           │
│  • bookingId              • scheduleId                    │
│  • upfrontAmount          • month, year                   │
│  • monthlyAmount          • amount                        │
│  • dates & status         • dueDate & status              │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

This complete visual guide should help you understand the entire payment system flow! 🎉
