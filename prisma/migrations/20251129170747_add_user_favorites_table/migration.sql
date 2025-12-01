-- AlterTable
ALTER TABLE `listings` MODIFY `lat` DOUBLE NULL,
    MODIFY `lng` DOUBLE NULL;

-- CreateTable
CREATE TABLE `user_favorites` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_favorites_userId_fkey`(`userId`),
    INDEX `user_favorites_listingId_fkey`(`listingId`),
    UNIQUE INDEX `user_favorites_userId_listingId_key`(`userId`, `listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_favorites` ADD CONSTRAINT `user_favorites_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
