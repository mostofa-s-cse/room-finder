-- AlterTable
ALTER TABLE `users` ADD COLUMN `profilePicture` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `bookings_listingId_fkey` ON `bookings`(`listingId`);
