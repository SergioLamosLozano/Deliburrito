-- Agregar campo show_in_summary a la tabla categories
-- Ejecutar en phpMyAdmin en producción

ALTER TABLE `categories` 
ADD COLUMN `show_in_summary` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_addon`;
