-- Corregir categorías que tienen product_type como '0'
-- Ejecutar en phpMyAdmin si tienes categorías afectadas

-- PASO 1: Verificar el tipo de columna actual
SHOW COLUMNS FROM categories LIKE 'product_type';

-- PASO 2: Cambiar el tipo de columna de numérico a VARCHAR
ALTER TABLE `categories` MODIFY COLUMN `product_type` VARCHAR(50) NOT NULL DEFAULT 'ambos';

-- PASO 3: Ver cuántas categorías están afectadas
SELECT id, name, product_type FROM categories WHERE product_type = '0' OR product_type = 0 OR product_type = '';

-- PASO 4: Actualizar todas las categorías con product_type = 0 o vacío a 'ambos'
UPDATE categories SET product_type = 'ambos' WHERE product_type = '0' OR product_type = 0 OR product_type = '';

-- PASO 5: Verificar que se corrigieron
SELECT id, name, product_type FROM categories;
