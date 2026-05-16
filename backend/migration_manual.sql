-- ============================================================================
-- MIGRACIÓN MANUAL: Normalización de campos de precio
-- Ejecutar en phpMyAdmin en el servidor de producción
-- ============================================================================

-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar

-- 1. Agregar nueva columna 'price' en options
ALTER TABLE `options` 
ADD COLUMN `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `name`;

-- 2. Copiar valores de price_extra a price
UPDATE `options` SET `price` = `price_extra`;

-- 3. Eliminar columnas antiguas de options
ALTER TABLE `options` 
DROP COLUMN `price_base`,
DROP COLUMN `price_extra`;

-- 4. Renombrar base_price a price en product_variations
ALTER TABLE `product_variations` 
CHANGE COLUMN `base_price` `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ============================================================================
-- Verificación (ejecutar después de la migración)
-- ============================================================================

-- Verificar estructura de options
DESCRIBE `options`;

-- Verificar estructura de product_variations
DESCRIBE `product_variations`;

-- Verificar que los datos se copiaron correctamente
SELECT id, name, price FROM `options` LIMIT 5;
SELECT id, name, price FROM `product_variations` LIMIT 5;
