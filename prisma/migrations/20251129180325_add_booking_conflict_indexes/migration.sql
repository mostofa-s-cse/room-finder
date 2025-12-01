-- CreateIndex
CREATE INDEX `bookings_conflict_check` ON `bookings`(`listingId`, `status`, `startDate`, `endDate`);

-- CreateIndex
CREATE INDEX `bookings_date_range` ON `bookings`(`status`, `startDate`, `endDate`);
