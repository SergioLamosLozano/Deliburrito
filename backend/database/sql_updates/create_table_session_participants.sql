-- Tabla para el Lobby Multijugador (Participantes sentados a la mesa)
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
  CONSTRAINT `table_session_participants_table_session_id_foreign` 
    FOREIGN KEY (`table_session_id`) REFERENCES `table_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
