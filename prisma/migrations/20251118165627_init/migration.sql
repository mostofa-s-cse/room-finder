-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('BACHELOR', 'LANDLORD', 'ADMIN') NOT NULL DEFAULT 'BACHELOR',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `income` DOUBLE NULL,
    `affordablePrice` DOUBLE NULL,
    `transportMode` ENUM('BIKE', 'BUS', 'WALK') NULL,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listings` (
    `id` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `monthlyRent` DOUBLE NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `roomType` ENUM('SINGLE', 'SHARED') NOT NULL DEFAULT 'SINGLE',
    `amenities` JSON NOT NULL,
    `images` JSON NOT NULL,
    `averageRating` DOUBLE NOT NULL DEFAULT 0,
    `ratingAvg` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `rating` SMALLINT NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_listingId_reviewerId_key`(`listingId`, `reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `totalAmount` DOUBLE NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` ENUM('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `stripeSessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_threads` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('DIRECT', 'GROUP', 'LISTING_INQUIRY') NOT NULL DEFAULT 'DIRECT',
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `listingId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `lastMessageAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_participants` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MEMBER', 'ADMIN') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `chat_participants_userId_threadId_key`(`userId`, `threadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'LOCATION', 'LISTING_SHARE') NOT NULL DEFAULT 'TEXT',
    `status` ENUM('SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'SENT',
    `metadata` JSON NULL,
    `replyToId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `editedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NULL,
    `reviewId` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_logs` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_payments` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `bankTransactionId` VARCHAR(191) NULL,
    `sslTransactionId` VARCHAR(191) NULL,
    `sessionkey` VARCHAR(191) NULL,
    `cardType` VARCHAR(191) NULL,
    `cardNo` VARCHAR(191) NULL,
    `cardIssuer` VARCHAR(191) NULL,
    `paymentAt` DATETIME(3) NULL,
    `failedReason` VARCHAR(191) NULL,
    `refundAmount` DOUBLE NULL DEFAULT 0,
    `refundedAt` DATETIME(3) NULL,
    `refundTransactionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `booking_payments_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refund_logs` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL,
    `processedBy` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `failureReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `data` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `priority` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `actionUrl` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `userId` VARCHAR(191) NOT NULL,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailBookings` BOOLEAN NOT NULL DEFAULT true,
    `emailListings` BOOLEAN NOT NULL DEFAULT true,
    `emailMessages` BOOLEAN NOT NULL DEFAULT false,
    `emailRecommendations` BOOLEAN NOT NULL DEFAULT true,
    `emailMarketing` BOOLEAN NOT NULL DEFAULT false,
    `emailSecurity` BOOLEAN NOT NULL DEFAULT true,
    `pushEnabled` BOOLEAN NOT NULL DEFAULT true,
    `pushBookings` BOOLEAN NOT NULL DEFAULT true,
    `pushListings` BOOLEAN NOT NULL DEFAULT true,
    `pushMessages` BOOLEAN NOT NULL DEFAULT true,
    `pushRecommendations` BOOLEAN NOT NULL DEFAULT false,
    `pushMarketing` BOOLEAN NOT NULL DEFAULT false,
    `inAppEnabled` BOOLEAN NOT NULL DEFAULT true,
    `inAppBookings` BOOLEAN NOT NULL DEFAULT true,
    `inAppListings` BOOLEAN NOT NULL DEFAULT true,
    `inAppMessages` BOOLEAN NOT NULL DEFAULT true,
    `inAppRecommendations` BOOLEAN NOT NULL DEFAULT true,
    `inAppMarketing` BOOLEAN NOT NULL DEFAULT false,
    `smsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `smsBookings` BOOLEAN NOT NULL DEFAULT false,
    `smsEmergency` BOOLEAN NOT NULL DEFAULT true,
    `quietHoursEnabled` BOOLEAN NOT NULL DEFAULT false,
    `quietHoursStart` VARCHAR(191) NOT NULL DEFAULT '22:00',
    `quietHoursEnd` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Dhaka',
    `digestEnabled` BOOLEAN NOT NULL DEFAULT false,
    `digestFrequency` VARCHAR(191) NOT NULL DEFAULT 'WEEKLY',
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_deliveries` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `push_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `p256dh` VARCHAR(191) NOT NULL,
    `auth` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsed` DATETIME(3) NULL,

    UNIQUE INDEX `push_subscriptions_endpoint_key`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_searches` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filters` VARCHAR(191) NOT NULL,
    `alertEnabled` BOOLEAN NOT NULL DEFAULT true,
    `lastNotified` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `searchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `query` VARCHAR(191) NOT NULL,
    `filters` VARCHAR(191) NOT NULL,
    `resultCount` INTEGER NOT NULL,
    `clickedListings` JSON NOT NULL,
    `searchTime` INTEGER NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `search_analytics_searchId_key`(`searchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_read_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `message_read_receipts_messageId_participantId_key`(`messageId`, `participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `enablePushNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableEmailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableSoundNotifications` BOOLEAN NOT NULL DEFAULT true,
    `allowMessagesFromStrangers` BOOLEAN NOT NULL DEFAULT true,
    `showOnlineStatus` BOOLEAN NOT NULL DEFAULT true,
    `showReadReceipts` BOOLEAN NOT NULL DEFAULT true,
    `showTypingIndicators` BOOLEAN NOT NULL DEFAULT true,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'auto',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `compactMode` BOOLEAN NOT NULL DEFAULT false,
    `autoArchiveAfterDays` INTEGER NULL,
    `autoDeleteMessagesAfterDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chat_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocked_users` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `blockedUserId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `blockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blocked_users_userId_blockedUserId_key`(`userId`, `blockedUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `messagesSent` INTEGER NOT NULL DEFAULT 0,
    `messagesReceived` INTEGER NOT NULL DEFAULT 0,
    `averageResponseTime` DOUBLE NOT NULL DEFAULT 0,
    `totalChatTime` DOUBLE NOT NULL DEFAULT 0,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chat_analytics_userId_threadId_key`(`userId`, `threadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('CARD', 'BANK_ACCOUNT', 'DIGITAL_WALLET', 'MOBILE_BANKING') NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `providerMethodId` VARCHAR(191) NOT NULL,
    `cardLast4` VARCHAR(191) NULL,
    `cardBrand` VARCHAR(191) NULL,
    `cardExpMonth` INTEGER NULL,
    `cardExpYear` INTEGER NULL,
    `cardCountry` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `bankLast4` VARCHAR(191) NULL,
    `bankAccountType` VARCHAR(191) NULL,
    `walletType` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `nickname` VARCHAR(191) NULL,
    `billingAddress` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_intents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `providerIntentId` VARCHAR(191) NOT NULL,
    `paymentMethodId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `listingId` VARCHAR(191) NULL,
    `bookingId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `receiptEmail` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `clientSecret` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `confirmedAt` DATETIME(3) NULL,
    `canceledAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('PAYMENT', 'REFUND', 'SUBSCRIPTION', 'DEPOSIT', 'WITHDRAWAL', 'FEE') NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR') NOT NULL,
    `paymentIntentId` VARCHAR(191) NULL,
    `paymentMethodId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `listingId` VARCHAR(191) NULL,
    `bookingId` VARCHAR(191) NULL,
    `refundId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `providerTransactionId` VARCHAR(191) NULL,
    `providerFee` INTEGER NULL,
    `grossAmount` INTEGER NOT NULL,
    `feeAmount` INTEGER NOT NULL,
    `netAmount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `processedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plan` ENUM('BASIC', 'PREMIUM', 'PROFESSIONAL') NOT NULL,
    `status` ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'INCOMPLETE', 'TRIALING', 'PAUSED') NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `providerSubscriptionId` VARCHAR(191) NOT NULL,
    `providerCustomerId` VARCHAR(191) NOT NULL,
    `currentPeriodStart` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `billingCycleAnchor` DATETIME(3) NULL,
    `defaultPaymentMethodId` VARCHAR(191) NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR') NOT NULL,
    `unitAmount` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `trialStart` DATETIME(3) NULL,
    `trialEnd` DATETIME(3) NULL,
    `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    `canceledAt` DATETIME(3) NULL,
    `cancellationReason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE') NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `providerInvoiceId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR') NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `taxAmount` INTEGER NOT NULL DEFAULT 0,
    `discountAmount` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL,
    `amountPaid` INTEGER NOT NULL DEFAULT 0,
    `amountDue` INTEGER NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `voidedAt` DATETIME(3) NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `nextPaymentAttempt` DATETIME(3) NULL,
    `items` JSON NOT NULL,
    `invoicePdf` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'RAZORPAY') NOT NULL,
    `data` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `error` VARCHAR(191) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device` ENUM('DESKTOP', 'MOBILE', 'TABLET') NOT NULL,
    `browser` VARCHAR(191) NOT NULL,
    `referrer` VARCHAR(191) NULL,
    `landingPage` VARCHAR(191) NOT NULL,
    `sessionDuration` INTEGER NOT NULL DEFAULT 0,
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `actionsPerformed` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_analytics_userId_idx`(`userId`),
    INDEX `user_analytics_sessionId_idx`(`sessionId`),
    INDEX `user_analytics_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_actions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `type` ENUM('PAGE_VIEW', 'LISTING_VIEW', 'SEARCH', 'FILTER_APPLIED', 'CONTACT_LANDLORD', 'SAVE_LISTING', 'SHARE_LISTING', 'BOOKING_INITIATED', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'REVIEW_SUBMITTED', 'CHAT_STARTED', 'PROFILE_UPDATED', 'LISTING_CREATED', 'LISTING_UPDATED') NOT NULL,
    `target` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `page` VARCHAR(191) NOT NULL,
    `duration` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_actions_userId_idx`(`userId`),
    INDEX `user_actions_sessionId_idx`(`sessionId`),
    INDEX `user_actions_type_idx`(`type`),
    INDEX `user_actions_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `listing_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `uniqueViews` INTEGER NOT NULL DEFAULT 0,
    `inquiries` INTEGER NOT NULL DEFAULT 0,
    `bookings` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0.0,
    `averageViewDuration` INTEGER NOT NULL DEFAULT 0,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clickThroughRate` DOUBLE NOT NULL DEFAULT 0.0,
    `favoriteCount` INTEGER NOT NULL DEFAULT 0,
    `shareCount` INTEGER NOT NULL DEFAULT 0,
    `contactAttempts` INTEGER NOT NULL DEFAULT 0,
    `photoViews` JSON NOT NULL,
    `searchRankings` JSON NOT NULL,
    `geographicViews` JSON NOT NULL,
    `timeBasedViews` JSON NOT NULL,
    `competitorAnalysis` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `listing_analytics_listingId_key`(`listingId`),
    INDEX `listing_analytics_listingId_idx`(`listingId`),
    INDEX `listing_analytics_views_idx`(`views`),
    INDEX `listing_analytics_conversionRate_idx`(`conversionRate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `totalRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `transactionCount` INTEGER NOT NULL DEFAULT 0,
    `averageTransactionValue` DOUBLE NOT NULL DEFAULT 0.0,
    `successRate` DOUBLE NOT NULL DEFAULT 0.0,
    `failureRate` DOUBLE NOT NULL DEFAULT 0.0,
    `refundRate` DOUBLE NOT NULL DEFAULT 0.0,
    `processingFees` DOUBLE NOT NULL DEFAULT 0.0,
    `netRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `paymentMethodDistribution` JSON NOT NULL,
    `monthlyRevenue` JSON NOT NULL,
    `geographicRevenue` JSON NOT NULL,
    `userTypeRevenue` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_analytics_period_idx`(`period`),
    INDEX `payment_analytics_totalRevenue_idx`(`totalRevenue`),
    UNIQUE INDEX `payment_analytics_period_key`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geographic_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `coordinates` JSON NOT NULL,
    `listingCount` INTEGER NOT NULL DEFAULT 0,
    `averagePrice` DOUBLE NOT NULL DEFAULT 0.0,
    `priceRange` JSON NOT NULL,
    `demandLevel` ENUM('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MODERATE',
    `searchVolume` INTEGER NOT NULL DEFAULT 0,
    `bookingRate` DOUBLE NOT NULL DEFAULT 0.0,
    `popularAmenities` JSON NOT NULL,
    `competitionLevel` VARCHAR(191) NOT NULL DEFAULT 'MODERATE',
    `growthRate` DOUBLE NOT NULL DEFAULT 0.0,
    `trendingDirection` ENUM('UP', 'DOWN', 'STABLE', 'VOLATILE') NOT NULL DEFAULT 'STABLE',
    `demographics` JSON NOT NULL,
    `marketInsights` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `geographic_analytics_city_idx`(`city`),
    INDEX `geographic_analytics_area_idx`(`area`),
    INDEX `geographic_analytics_demandLevel_idx`(`demandLevel`),
    INDEX `geographic_analytics_averagePrice_idx`(`averagePrice`),
    UNIQUE INDEX `geographic_analytics_location_key`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `totalUsers` INTEGER NOT NULL DEFAULT 0,
    `activeUsers` INTEGER NOT NULL DEFAULT 0,
    `newUsersToday` INTEGER NOT NULL DEFAULT 0,
    `newUsersThisMonth` INTEGER NOT NULL DEFAULT 0,
    `totalListings` INTEGER NOT NULL DEFAULT 0,
    `activeListings` INTEGER NOT NULL DEFAULT 0,
    `newListingsToday` INTEGER NOT NULL DEFAULT 0,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `completedBookings` INTEGER NOT NULL DEFAULT 0,
    `cancelledBookings` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `monthlyRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `averageBookingValue` DOUBLE NOT NULL DEFAULT 0.0,
    `platformGrowthRate` DOUBLE NOT NULL DEFAULT 0.0,
    `userRetentionRate` DOUBLE NOT NULL DEFAULT 0.0,
    `listingSuccessRate` DOUBLE NOT NULL DEFAULT 0.0,
    `customerSatisfactionScore` DOUBLE NOT NULL DEFAULT 0.0,
    `supportTickets` JSON NOT NULL,
    `topPerformingAreas` JSON NOT NULL,
    `userEngagementMetrics` JSON NOT NULL,
    `systemHealthMetrics` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `admin_analytics_period_idx`(`period`),
    INDEX `admin_analytics_totalRevenue_idx`(`totalRevenue`),
    INDEX `admin_analytics_platformGrowthRate_idx`(`platformGrowthRate`),
    UNIQUE INDEX `admin_analytics_period_key`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landlord_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `totalListings` INTEGER NOT NULL DEFAULT 0,
    `activeListings` INTEGER NOT NULL DEFAULT 0,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `totalInquiries` INTEGER NOT NULL DEFAULT 0,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0.0,
    `averageRating` DOUBLE NOT NULL DEFAULT 0.0,
    `totalRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `monthlyRevenue` DOUBLE NOT NULL DEFAULT 0.0,
    `occupancyRate` DOUBLE NOT NULL DEFAULT 0.0,
    `responseTime` INTEGER NOT NULL DEFAULT 0,
    `responseRate` DOUBLE NOT NULL DEFAULT 0.0,
    `customerSatisfaction` DOUBLE NOT NULL DEFAULT 0.0,
    `topPerformingListings` JSON NOT NULL,
    `monthlyMetrics` JSON NOT NULL,
    `competitorComparison` JSON NOT NULL,
    `marketPosition` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `landlord_analytics_landlordId_idx`(`landlordId`),
    INDEX `landlord_analytics_period_idx`(`period`),
    INDEX `landlord_analytics_conversionRate_idx`(`conversionRate`),
    INDEX `landlord_analytics_totalRevenue_idx`(`totalRevenue`),
    UNIQUE INDEX `landlord_analytics_landlordId_period_key`(`landlordId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_insights` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.0,
    `impact` VARCHAR(191) NOT NULL,
    `actionable` BOOLEAN NOT NULL DEFAULT false,
    `recommendation` VARCHAR(191) NULL,
    `relatedMetrics` JSON NOT NULL,
    `userId` VARCHAR(191) NULL,
    `listingId` VARCHAR(191) NULL,
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `acknowledgedBy` VARCHAR(191) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `analytics_insights_type_idx`(`type`),
    INDEX `analytics_insights_category_idx`(`category`),
    INDEX `analytics_insights_impact_idx`(`impact`),
    INDEX `analytics_insights_createdAt_idx`(`createdAt`),
    INDEX `analytics_insights_userId_idx`(`userId`),
    INDEX `analytics_insights_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `metric` VARCHAR(191) NOT NULL,
    `threshold` DOUBLE NOT NULL,
    `actualValue` DOUBLE NOT NULL,
    `userId` VARCHAR(191) NULL,
    `listingId` VARCHAR(191) NULL,
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `acknowledgedBy` VARCHAR(191) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `analytics_alerts_type_idx`(`type`),
    INDEX `analytics_alerts_severity_idx`(`severity`),
    INDEX `analytics_alerts_acknowledged_idx`(`acknowledged`),
    INDEX `analytics_alerts_resolved_idx`(`resolved`),
    INDEX `analytics_alerts_createdAt_idx`(`createdAt`),
    INDEX `analytics_alerts_userId_idx`(`userId`),
    INDEX `analytics_alerts_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_threads` ADD CONSTRAINT `chat_threads_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_participants` ADD CONSTRAINT `chat_participants_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `chat_participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `chat_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_logs` ADD CONSTRAINT `admin_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_payments` ADD CONSTRAINT `booking_payments_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_payments` ADD CONSTRAINT `booking_payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_payments` ADD CONSTRAINT `booking_payments_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refund_logs` ADD CONSTRAINT `refund_logs_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `booking_payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_deliveries` ADD CONSTRAINT `notification_deliveries_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_analytics` ADD CONSTRAINT `search_analytics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read_receipts` ADD CONSTRAINT `message_read_receipts_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read_receipts` ADD CONSTRAINT `message_read_receipts_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `chat_participants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_settings` ADD CONSTRAINT `chat_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocked_users` ADD CONSTRAINT `blocked_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocked_users` ADD CONSTRAINT `blocked_users_blockedUserId_fkey` FOREIGN KEY (`blockedUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_reports` ADD CONSTRAINT `chat_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_reports` ADD CONSTRAINT `chat_reports_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_reports` ADD CONSTRAINT `chat_reports_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `chat_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_analytics` ADD CONSTRAINT `chat_analytics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_analytics` ADD CONSTRAINT `chat_analytics_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `chat_threads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_paymentIntentId_fkey` FOREIGN KEY (`paymentIntentId`) REFERENCES `payment_intents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_defaultPaymentMethodId_fkey` FOREIGN KEY (`defaultPaymentMethodId`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_analytics` ADD CONSTRAINT `user_analytics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_actions` ADD CONSTRAINT `user_actions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `listing_analytics` ADD CONSTRAINT `listing_analytics_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `landlord_analytics` ADD CONSTRAINT `landlord_analytics_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_insights` ADD CONSTRAINT `analytics_insights_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_insights` ADD CONSTRAINT `analytics_insights_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_alerts` ADD CONSTRAINT `analytics_alerts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_alerts` ADD CONSTRAINT `analytics_alerts_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
