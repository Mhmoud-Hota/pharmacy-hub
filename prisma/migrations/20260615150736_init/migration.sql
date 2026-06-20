-- CreateTable
CREATE TABLE `pharmacies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `webhookSecret` VARCHAR(191) NOT NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `workingHours` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacies_slug_key`(`slug`),
    UNIQUE INDEX `pharmacies_apiKey_key`(`apiKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_medicines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barcode` VARCHAR(191) NULL,
    `canonicalName` VARCHAR(191) NOT NULL,
    `scientificName` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `tabletsPerBox` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `master_medicines_barcode_key`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine_aliases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `masterMedicineId` INTEGER NOT NULL,
    `aliasName` VARCHAR(191) NOT NULL,
    `pharmacyId` INTEGER NULL,
    `localMedicineId` INTEGER NULL,
    `tradName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `medicine_aliases_aliasName_pharmacyId_key`(`aliasName`, `pharmacyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacy_stocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pharmacyId` INTEGER NOT NULL,
    `masterMedicineId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NULL,
    `expiryDate` DATETIME(3) NULL,
    `unit` VARCHAR(191) NULL,
    `tabletsPerBox` INTEGER NULL,
    `localMedicineId` INTEGER NULL,
    `lastSyncAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacy_stocks_pharmacyId_masterMedicineId_key`(`pharmacyId`, `masterMedicineId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pharmacyId` INTEGER NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `rawPayload` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMsg` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotencyKey` VARCHAR(191) NULL,

    UNIQUE INDEX `webhook_logs_idempotencyKey_key`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `medicine_aliases` ADD CONSTRAINT `medicine_aliases_masterMedicineId_fkey` FOREIGN KEY (`masterMedicineId`) REFERENCES `master_medicines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_stocks` ADD CONSTRAINT `pharmacy_stocks_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `pharmacies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_stocks` ADD CONSTRAINT `pharmacy_stocks_masterMedicineId_fkey` FOREIGN KEY (`masterMedicineId`) REFERENCES `master_medicines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook_logs` ADD CONSTRAINT `webhook_logs_pharmacyId_fkey` FOREIGN KEY (`pharmacyId`) REFERENCES `pharmacies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
