-- Deli Burrito Database Setup Script
-- Ejecuta esto en MySQL para crear todas las tablas

CREATE TABLE IF NOT EXISTS `settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    `value` LONGTEXT,
    `description` VARCHAR(255),
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `is_required` BOOLEAN DEFAULT 0,
    `max_selections` INT DEFAULT 1,
    `order_index` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `options` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price_base` DECIMAL(10,2) DEFAULT 0,
    `price_extra` DECIMAL(10,2) DEFAULT 0,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'customer',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(255) NOT NULL,
    `customer_address` VARCHAR(255),
    `delivery_type` ENUM('domicilio','local','recoger') DEFAULT 'domicilio',
    `delivery_cost` DECIMAL(10,2) DEFAULT 0,
    `subtotal` DECIMAL(10,2) DEFAULT 0,
    `total` DECIMAL(10,2) DEFAULT 0,
    `status` ENUM('pendiente','aceptado','cancelado') DEFAULT 'pendiente',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_type` VARCHAR(255) DEFAULT 'burrito',
    `item_total` DECIMAL(10,2) DEFAULT 0,
    `notes` TEXT,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `order_item_options` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `option_id` BIGINT UNSIGNED NOT NULL,
    `price_charged` DECIMAL(10,2) DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`option_id`) REFERENCES `options`(`id`)
);

-- Variaciones de producto (ej. Sencilla / Mixta / Doble para Tortihamburguesa)
CREATE TABLE IF NOT EXISTS `product_variations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_target` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `base_price` DECIMAL(10,2) DEFAULT 0,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
);

-- Tabla pivote: qué variaciones habilitan cada categoría
-- Sin filas → categoría visible siempre.
-- Con filas → visible solo cuando la variación activa coincide.
CREATE TABLE IF NOT EXISTS `category_variation` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `product_variation_id` BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY `uq_cat_var` (`category_id`, `product_variation_id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_variation_id`) REFERENCES `product_variations`(`id`) ON DELETE CASCADE
);

-- Insert Initial Data
INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES ('costo_domicilio', '5000', 'Costo de envío a domicilio', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

INSERT INTO `users` (`name`, `email`, `password`, `role`, `created_at`, `updated_at`)
VALUES ('Admin', 'admin@example.com', '$2y$12$FP5h5nOmHhAX4N7P7KqUb.K8ZQ4lMkQc1LfKvfQWd2RKV2qQIuW72', 'admin', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Categories (7 requeridas)
INSERT INTO `categories` (`name`, `is_required`, `max_selections`, `order_index`, `is_active`, `created_at`, `updated_at`)
VALUES 
    ('Proteína Principal', 1, 1, 1, 1, NOW(), NOW()),
    ('Proteínas Adicionales', 0, 2, 2, 1, NOW(), NOW()),
    ('Sabor Crunch', 0, 1, 3, 1, NOW(), NOW()),
    ('Tipo de Queso', 0, 1, 4, 1, NOW(), NOW()),
    ('Salsa 1', 0, 1, 5, 1, NOW(), NOW()),
    ('Salsa 2', 0, 1, 6, 1, NOW(), NOW()),
    ('Adiciones Extra', 0, 10, 7, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Options for each category
-- Proteína Principal
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (1, 'Res', 13000, 4000, 1, NOW(), NOW()),
    (1, 'Cerdo Pesto', 14000, 4500, 1, NOW(), NOW()),
    (1, 'Costilla', 15000, 5000, 1, NOW(), NOW()),
    (1, 'Pollo', 12000, 3500, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Proteínas Adicionales
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (2, 'Res Extra', 0, 4000, 1, NOW(), NOW()),
    (2, 'Pollo Extra', 0, 3500, 1, NOW(), NOW()),
    (2, 'Cerdo Extra', 0, 4500, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Sabor Crunch
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (3, 'Papas Crunch', 0, 2000, 1, NOW(), NOW()),
    (3, 'Nachos Crunch', 0, 2500, 1, NOW(), NOW()),
    (3, 'Plátano Crunch', 0, 1500, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Tipo de Queso
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (4, 'Queso Mozzarella', 0, 1000, 1, NOW(), NOW()),
    (4, 'Queso Americano', 0, 800, 1, NOW(), NOW()),
    (4, 'Doble Queso', 0, 1500, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Salsa 1
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (5, 'Salsa Roja', 0, 0, 1, NOW(), NOW()),
    (5, 'Salsa Verde', 0, 0, 1, NOW(), NOW()),
    (5, 'Salsa Blanca', 0, 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Salsa 2
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (6, 'Salsa Roja', 0, 0, 1, NOW(), NOW()),
    (6, 'Salsa Verde', 0, 0, 1, NOW(), NOW()),
    (6, 'Salsa Blanca', 0, 0, 1, NOW(), NOW()),
    (6, 'Picante', 0, 500, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Adiciones Extra
INSERT INTO `options` (`category_id`, `name`, `price_base`, `price_extra`, `is_active`, `created_at`, `updated_at`)
VALUES 
    (7, 'Papas a la Francesa', 0, 3000, 1, NOW(), NOW()),
    (7, 'Aros de Cebolla', 0, 2500, 1, NOW(), NOW()),
    (7, 'Coca Cola', 0, 2000, 1, NOW(), NOW()),
    (7, 'Agua', 0, 1000, 1, NOW(), NOW()),
    (7, 'Cerveza', 0, 5000, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
