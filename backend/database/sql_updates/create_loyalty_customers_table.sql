-- Crear tabla de fidelización de clientes
-- Ejecutar en phpMyAdmin en producción
-- Fecha: 26 de Agosto, 2026

CREATE TABLE IF NOT EXISTS `loyalty_customers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `customer_phone` VARCHAR(255) NOT NULL,
    `last_customer_name` VARCHAR(255) NULL DEFAULT NULL,
    `last_redeemed_orders_total` INT UNSIGNED NOT NULL DEFAULT 0,
    `last_redeemed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `loyalty_customers_customer_phone_unique` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar settings de fidelización (si no existen)
INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('loyalty_required_orders', '15', 'Cantidad de pedidos requeridos para premio de fidelización', NOW(), NOW())
ON DUPLICATE KEY UPDATE `key` = `key`;

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('loyalty_message_template', '¡Felicidades! Tienes un regalo por tus 15 pedidos.', 'Plantilla del mensaje de fidelización', NOW(), NOW())
ON DUPLICATE KEY UPDATE `key` = `key`;
