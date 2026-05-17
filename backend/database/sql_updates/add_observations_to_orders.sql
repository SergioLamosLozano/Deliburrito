-- Agregar campo de observaciones a la tabla orders
-- Ejecutar en phpMyAdmin en producción

ALTER TABLE `orders` 
ADD COLUMN `observations` TEXT NULL AFTER `customer_address`;
