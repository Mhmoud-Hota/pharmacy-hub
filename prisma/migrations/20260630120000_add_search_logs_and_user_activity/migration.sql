-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_active_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `search_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `query` VARCHAR(191) NOT NULL,
    `results_count` INTEGER NOT NULL DEFAULT 0,
    `user_id` INTEGER NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `search_logs_created_at_idx`(`created_at`),
    INDEX `search_logs_query_idx`(`query`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
