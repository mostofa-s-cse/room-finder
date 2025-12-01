-- CreateTable
CREATE TABLE `tenant_requests` (
    `id` VARCHAR(191) NOT NULL,
    `bachelorId` VARCHAR(191) NOT NULL,
    `landlordId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `moveInDate` DATETIME(3) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `budget` DOUBLE NOT NULL,
    `profession` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `monthlyIncome` DOUBLE NULL,
    `references` JSON NULL,
    `documents` JSON NULL,
    `emergencyContact` JSON NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `landlordResponse` TEXT NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tenant_requests_bachelorId_fkey`(`bachelorId`),
    INDEX `tenant_requests_landlordId_fkey`(`landlordId`),
    INDEX `tenant_requests_listingId_fkey`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tenant_requests` ADD CONSTRAINT `tenant_requests_bachelorId_fkey` FOREIGN KEY (`bachelorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_requests` ADD CONSTRAINT `tenant_requests_landlordId_fkey` FOREIGN KEY (`landlordId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_requests` ADD CONSTRAINT `tenant_requests_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
