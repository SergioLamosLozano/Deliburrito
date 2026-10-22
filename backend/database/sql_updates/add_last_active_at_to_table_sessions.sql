-- Agrega columna last_active_at para el sistema de Heartbeat en table_sessions
ALTER TABLE `table_sessions` 
ADD COLUMN `last_active_at` TIMESTAMP NULL DEFAULT NULL AFTER `host_device_id`;
