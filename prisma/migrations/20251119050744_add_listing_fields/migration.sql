-- AlterTable
ALTER TABLE `listings` ADD COLUMN `availableFrom` DATETIME(3) NULL,
    ADD COLUMN `contactEmail` VARCHAR(191) NULL,
    ADD COLUMN `contactPhone` VARCHAR(191) NULL,
    ADD COLUMN `rules` JSON NOT NULL;
