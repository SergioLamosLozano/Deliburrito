-- Agregar setting para controlar si el comercio está abierto o cerrado
-- Ejecutar en phpMyAdmin en producción

INSERT INTO `settings` (`key`, `value`, `created_at`, `updated_at`) 
VALUES ('comercio_abierto', '1', NOW(), NOW())
ON DUPLICATE KEY UPDATE `key` = `key`;
