-- Agregar mensajes de notificación personalizables
-- Ejecutar en phpMyAdmin después de subir los archivos

-- NOTA: El mensaje base es fijo, estos settings solo guardan el texto adicional

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_aceptado', '¡Gracias por elegir Deli Burrito!', 'Mensaje adicional de WhatsApp cuando se acepta un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_cancelado', 'Disculpa las molestias.', 'Mensaje adicional de WhatsApp cuando se cancela un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();

-- MENSAJES COMPLETOS QUE SE ENVIARÁN:
-- Aceptado: "Hola {nombre}, tu pedido con identificador #{numero} ha sido aceptado y está en preparación. {valor de mensaje_pedido_aceptado}"
-- Cancelado: "Hola {nombre}, lamentamos informarte que tu pedido #{numero} ha sido cancelado. {valor de mensaje_pedido_cancelado}"
