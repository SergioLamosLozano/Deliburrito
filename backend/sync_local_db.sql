-- ============================================================================
-- SYNC LOCAL DB — Deliburrito 2
-- Ejecuta este script en tu MySQL local para sincronizar con el esquema del servidor.
-- Es SEGURO correrlo varias veces: usa IF NOT EXISTS, ON DUPLICATE KEY, etc.
-- ============================================================================

-- Asegúrate de haber creado la base de datos antes:
-- CREATE DATABASE IF NOT EXISTS `deliburrito_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `deliburrito_db`;

-- ============================================================================
-- 1. TABLAS BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    `value` LONGTEXT,
    `description` VARCHAR(255),
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `product_type` VARCHAR(50) NOT NULL DEFAULT 'ambos',
    `is_required` TINYINT(1) NOT NULL DEFAULT 0,
    `is_addon` TINYINT(1) NOT NULL DEFAULT 0,
    `show_in_summary` TINYINT(1) NOT NULL DEFAULT 0,
    `max_selections` INT NOT NULL DEFAULT 1,
    `allow_quantity` TINYINT(1) NOT NULL DEFAULT 0,
    `order_index` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `options` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `options_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_variations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_target` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_variation` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `product_variation_id` BIGINT UNSIGNED NOT NULL,
    `max_selections` INT NULL,
    UNIQUE KEY `uq_cat_var` (`category_id`, `product_variation_id`),
    CONSTRAINT `cv_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
    CONSTRAINT `cv_variation_fk` FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_types` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `emoji` VARCHAR(10) NOT NULL DEFAULT '🍔',
    `image_path` VARCHAR(255) NULL,
    `order_index` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(255) NOT NULL,
    `customer_address` VARCHAR(255) NULL,
    `table_number` VARCHAR(255) NULL,
    `observations` TEXT NULL,
    `delivery_type` ENUM('domicilio','local','recoger') NOT NULL DEFAULT 'domicilio',
    `delivery_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('pendiente','aceptado','cancelado') NOT NULL DEFAULT 'pendiente',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_type` VARCHAR(255) NOT NULL DEFAULT 'burrito',
    `variation_name` VARCHAR(100) NULL,
    `item_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `oi_order_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_item_options` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `option_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `price_charged` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    CONSTRAINT `oio_item_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `oio_option_fk` FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `sessions_user_id_index` (`user_id`),
    INDEX `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MÓDULO: SALAS MULTIJUGADOR (CARRITO COLABORATIVO)
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

CREATE TABLE IF NOT EXISTS `table_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_id` BIGINT UNSIGNED NOT NULL,
    `host_device_id` VARCHAR(255) NOT NULL,
    `last_active_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `table_sessions_table_id_foreign` (`table_id`),
    CONSTRAINT `fk_table_sessions_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `table_session_participants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `table_session_id` BIGINT UNSIGNED NOT NULL,
    `guest_name` VARCHAR(255) NOT NULL,
    `role` ENUM('host', 'guest') NOT NULL DEFAULT 'guest',
    `status` ENUM('deciding', 'ready') NOT NULL DEFAULT 'deciding',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `table_session_participants_table_session_id_foreign` (`table_session_id`),
    CONSTRAINT `fk_table_session_participants_session` 
        FOREIGN KEY (`table_session_id`) REFERENCES `table_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


-- ============================================================================
-- 2. COLUMNAS NUEVAS — Por si la tabla ya existía sin estas columnas
--    (cada ALTER usa IF NOT EXISTS o un procedimiento seguro)
-- ============================================================================

-- categories: product_type
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'product_type');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `categories` ADD COLUMN `product_type` VARCHAR(50) NOT NULL DEFAULT \'ambos\' AFTER `name`',
    'SELECT "product_type ya existe en categories"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- categories: is_addon
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_addon');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `categories` ADD COLUMN `is_addon` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_required`',
    'SELECT "is_addon ya existe en categories"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- categories: show_in_summary
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'show_in_summary');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `categories` ADD COLUMN `show_in_summary` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_addon`',
    'SELECT "show_in_summary ya existe en categories"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- categories: allow_quantity
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'allow_quantity');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `categories` ADD COLUMN `allow_quantity` TINYINT(1) NOT NULL DEFAULT 0 AFTER `max_selections`',
    'SELECT "allow_quantity ya existe en categories"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- options: columna price (reemplaza price_base y price_extra)
SET @has_price = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options' AND COLUMN_NAME = 'price');
SET @has_price_extra = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options' AND COLUMN_NAME = 'price_extra');

-- Agregar price si no existe
SET @sql = IF(@has_price = 0,
    'ALTER TABLE `options` ADD COLUMN `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `name`',
    'SELECT "price ya existe en options"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Copiar datos de price_extra → price si price_extra aún existe
SET @has_price_extra2 = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options' AND COLUMN_NAME = 'price_extra');
SET @sql = IF(@has_price_extra2 > 0,
    'UPDATE `options` SET `price` = `price_extra`',
    'SELECT "price_extra no existe, nada que copiar"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Eliminar price_base si existe
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options' AND COLUMN_NAME = 'price_base');
SET @sql = IF(@col_exists > 0,
    'ALTER TABLE `options` DROP COLUMN `price_base`',
    'SELECT "price_base no existe en options"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Eliminar price_extra si existe
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options' AND COLUMN_NAME = 'price_extra');
SET @sql = IF(@col_exists > 0,
    'ALTER TABLE `options` DROP COLUMN `price_extra`',
    'SELECT "price_extra no existe en options"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- product_variations: renombrar base_price → price
SET @has_base_price = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variations' AND COLUMN_NAME = 'base_price');
SET @sql = IF(@has_base_price > 0,
    'ALTER TABLE `product_variations` CHANGE COLUMN `base_price` `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00',
    'SELECT "base_price no existe en product_variations"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- product_variations: description
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variations' AND COLUMN_NAME = 'description');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `product_variations` ADD COLUMN `description` TEXT NULL AFTER `name`',
    'SELECT "description ya existe en product_variations"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- category_variation: max_selections
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_variation' AND COLUMN_NAME = 'max_selections');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `category_variation` ADD COLUMN `max_selections` INT NULL AFTER `product_variation_id`',
    'SELECT "max_selections ya existe en category_variation"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- product_types: image_path
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_types' AND COLUMN_NAME = 'image_path');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `product_types` ADD COLUMN `image_path` VARCHAR(255) NULL AFTER `emoji`',
    'SELECT "image_path ya existe en product_types"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_items: variation_name
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variation_name');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `order_items` ADD COLUMN `variation_name` VARCHAR(100) NULL AFTER `product_type`',
    'SELECT "variation_name ya existe en order_items"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- orders: table_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'table_number');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `orders` ADD COLUMN `table_number` VARCHAR(255) NULL AFTER `customer_address`',
    'SELECT "table_number ya existe en orders"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- orders: observations
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'observations');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `orders` ADD COLUMN `observations` TEXT NULL AFTER `table_number`',
    'SELECT "observations ya existe en orders"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_item_options: quantity
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item_options' AND COLUMN_NAME = 'quantity');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `order_item_options` ADD COLUMN `quantity` INT NOT NULL DEFAULT 1 AFTER `option_id`',
    'SELECT "quantity ya existe en order_item_options"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 3. CORRECCIÓN: product_type = 0 o vacío → 'ambos'
-- ============================================================================
UPDATE `categories`
SET `product_type` = 'ambos'
WHERE `product_type` = '0' OR `product_type` = '' OR `product_type` = 0;

-- ============================================================================
-- 4. DATOS INICIALES (seguros con ON DUPLICATE KEY UPDATE)
-- ============================================================================

-- Usuario admin (contraseña: admin123)
INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`)
VALUES ('Admin', 'admin@deliburrito.com',
        '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uZutcDWu6', 'admin', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Settings básicos
INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) VALUES
('costo_domicilio',         '5000',  'Costo de envío a domicilio',                               NOW(), NOW()),
('comercio_abierto',        '1',     'Si el comercio está abierto (1) o cerrado (0)',             NOW(), NOW()),
('mensaje_pedido_aceptado', '¡Gracias por elegir Deli Burrito!',
                                     'Mensaje adicional de WhatsApp cuando se acepta un pedido', NOW(), NOW()),
('mensaje_pedido_cancelado','Disculpa las molestias.',
                                     'Mensaje adicional de WhatsApp cuando se cancela un pedido',NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'categories'       AS tabla, COUNT(*) AS columnas FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories'
UNION ALL
SELECT 'options',          COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'options'
UNION ALL
SELECT 'orders',           COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
UNION ALL
SELECT 'order_items',      COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items'
UNION ALL
SELECT 'order_item_options',COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item_options'
UNION ALL
SELECT 'product_variations',COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variations'
UNION ALL
SELECT 'product_types',    COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_types'
UNION ALL
SELECT 'settings',         COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings'
UNION ALL
SELECT 'users',            COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
UNION ALL
SELECT 'tables',           COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tables'
UNION ALL
SELECT 'table_sessions',   COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'table_sessions'
UNION ALL
SELECT 'table_cart_items', COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'table_cart_items';
