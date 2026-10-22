-- ============================================================================
-- MÓDULO: SALAS MULTIJUGADOR (CARRITO COLABORATIVO EN MESA)
-- Ejecutar en cPanel / phpMyAdmin
-- Base de datos: deliburrito_db
-- ============================================================================

-- 1. Tabla de Mesas Físicas
CREATE TABLE IF NOT EXISTS `tables` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `number` INT UNSIGNED NOT NULL,
    `qr_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('free', 'occupied', 'locked') NOT NULL DEFAULT 'free',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `tables_number_unique` (`number`),
    UNIQUE KEY `tables_qr_hash_unique` (`qr_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Sesiones Activas de Mesa (Sala del Anfitrión)
CREATE TABLE IF NOT EXISTS `table_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_id` BIGINT UNSIGNED NOT NULL,
    `host_device_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `table_sessions_table_id_foreign` (`table_id`),
    CONSTRAINT `fk_table_sessions_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Ítems del Carrito Colaborativo Temporal
CREATE TABLE IF NOT EXISTS `table_cart_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_session_id` BIGINT UNSIGNED NOT NULL,
    `guest_name` VARCHAR(255) NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `details` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('building', 'ready') NOT NULL DEFAULT 'building',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `table_cart_items_table_session_id_foreign` (`table_session_id`),
    KEY `table_cart_items_product_id_foreign` (`product_id`),
    CONSTRAINT `fk_table_cart_items_session` FOREIGN KEY (`table_session_id`) REFERENCES `table_sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_table_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `product_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
