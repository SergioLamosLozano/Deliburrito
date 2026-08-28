# 🚀 Guía de Despliegue - Deli Burrito (cPanel)

Este documento detalla los pasos para subir el software a un hosting compartido con cPanel.

## 1. Preparación de Archivos
Para mayor seguridad, separaremos el código del motor (Laravel) de los archivos públicos:

1.  Crea una carpeta llamada `deliburrito_core` en la raíz de tu hosting (al mismo nivel que `public_html`).
2.  Sube dentro de `deliburrito_core` todo el contenido de la carpeta `backend` local, **EXCEPTO** la carpeta `public`.
3.  Sube el contenido de la carpeta `backend/public` local directamente dentro de la carpeta `public_html` del hosting.

## 2. Configuración del Entorno (.env)
Edita el archivo `.env` que subiste a `deliburrito_core`. Asegúrate de cambiar estos valores para producción:

| Campo | Valor Local | Valor Producción (Hosting) |
| :--- | :--- | :--- |
| **APP_ENV** | `local` | `production` |
| **APP_DEBUG** | `true` | `false` |
| **APP_URL** | `http://localhost:8000` | `https://tu-dominio.com` |
| **DB_DATABASE** | `deliburrito_db` | *(El nombre que crees en cPanel)* |
| **DB_USERNAME** | `root` | *(El usuario que crees en cPanel)* |
| **DB_PASSWORD** | *(vacío en el repositorio)* | *(Tu contraseña de cPanel)* |

> [!IMPORTANT]
> Nunca dejes `APP_DEBUG=true` en producción, ya que esto podría mostrar información sensible de tu base de datos a los clientes si ocurre un error.

## 3. Vinculación de Carpetas (index.php)
Debes decirle al archivo público dónde está el "corazón" del sistema. Edita `public_html/index.php` y ajusta estas dos líneas:

```php
// Línea 7 aprox:
require __DIR__.'/../deliburrito_core/vendor/autoload.php';

// Línea 17 aprox:
$app = require_once __DIR__.'/../deliburrito_core/bootstrap/app.php';
```

## 4. Base de Datos
1.  Usa el **MySQL Database Wizard** en cPanel para crear la base y el usuario.
2.  Importa el archivo `.sql` de tu base de datos local usando **phpMyAdmin**.
3.  Si tienes acceso a **Terminal** en cPanel, puedes ejecutar:
    `php artisan migrate` (estando dentro de la carpeta `deliburrito_core`).

## 5. Permisos de Escritura
Asegúrate de que las siguientes carpetas dentro de `deliburrito_core` tengan permisos **775** o **755**:
*   `storage/` (y todas sus subcarpetas)
*   `bootstrap/cache/`

## 6. Frontend (React)
Recuerda que si haces cambios en el diseño (colores, textos, etc.) en la carpeta `frontend` local, debes ejecutar `npm run build` antes de subir los archivos de la carpeta `public` al hosting.

---
**¡Listo! Con estos pasos Deli Burrito estará operando en la nube.** 🌯✨

## 📖 Descripción del Proyecto y Stack Tecnológico

**Deli Burrito** es un sistema integral de Punto de Venta (POS) y gestión de pedidos en línea, diseñado específicamente para restaurantes de comida rápida. Su principal atractivo es un constructor de pedidos altamente dinámico para los clientes y un panel de administración en tiempo real ultraligero para el personal del restaurante.

### 💻 Stack Tecnológico (Qué se usa)

*   **Backend & Base de Datos**: PHP, Laravel, MySQL.
*   **Frontend (Cliente)**: React, TailwindCSS, Vite.
*   **Frontend (Administrador)**: Vanilla HTML/JS, TailwindCSS (vía CDN).

### ⚙️ Arquitectura (Cómo se usa)

El sistema emplea una arquitectura híbrida optimizada para el rendimiento y la facilidad de despliegue en entornos compartidos (como cPanel):

1.  **Experiencia del Cliente (Frontend React + Laravel):**
    *   La página principal donde los clientes arman sus pedidos (burritos, salchipapas, etc.) está construida como una aplicación interactiva con **React**.
    *   Al compilarse, React genera archivos estáticos optimizados que son entregados por **Laravel**. Las solicitudes de pedidos nuevos y consultas del menú se procesan a través de controladores de Laravel conectados a **MySQL**.

2.  **Centro de Control (Vanilla JS + PHP Puro):**
    *   El panel administrativo (ruta `/admin`) utiliza un enfoque *Serverless-like* para garantizar una carga instantánea y actualizaciones en vivo. 
    *   Consta de un archivo **`index.html`** estilizado con **TailwindCSS** y controlado completamente por **Vanilla JavaScript**. 
    *   Se comunica **exclusivamente** con **`admin-api.php`**, un archivo PHP nativo e independiente (sin usar las capas de Laravel) que actúa como API REST ultrarrápida. Desde allí se gestionan los estados de los pedidos, los ingresos al menú, y la impresión de comprobantes adaptados para impresoras térmicas de 80mm.

---

## 📋 Reporte Actualizado de Cambios y Errores - Despliegue en cPanel

Este documento queda como el historial definitivo de las resoluciones aplicadas para garantizar la estabilidad del software en un entorno de producción compartido:

### 1. Error de Archivos Ocultos (`.env`)
*   **Problema:** El archivo `.env` no aparecía listado en el Administrador de Archivos de cPanel a pesar de que el sistema indicaba su existencia.
*   **Causa:** Los archivos que comienzan con un punto (`.env`, `.htaccess`) son tratados como archivos ocultos por defecto en servidores Linux.
*   **Solución:** Se ingresó a *Settings* (esquina superior derecha del Administrador de Archivos) y se activó la casilla **"Show Hidden Files (dotfiles)"**.

### 2. Confusión con la Estructura de Rutas de la Aplicación (Laravel)
*   **Problema:** El dominio principal arrojaba logs de *Auto Index is disabled* o *File not found* al intentar cargar el núcleo de Laravel.
*   **Causa:** El contenido de la carpeta `public` de Laravel se movió directamente a `public_html`, rompiendo los enlaces hacia las carpetas `vendor` y `bootstrap`.
*   **Solución:** Se modificó el archivo `/public_html/index.php` para corregir los paths absolutos hacia el directorio del núcleo del proyecto.

### 3. Incompatibilidad de Versión de PHP
*   **Error exacto:** `Composer detected issues in your platform: Your Composer dependencies require a PHP version ">= 8.4.0".`
*   **Causa:** Las dependencias del proyecto requerían PHP 8.4+, pero el hosting compartía una versión inferior (8.1 u 8.2) por defecto.
*   **Solución:** Se ingresó a la herramienta **"Seleccionar Versión PHP"** (*Select PHP Version*) en cPanel y se actualizó el entorno global a PHP 8.4.

### 4. Error de Apertura de Flujo en Ruta Relativa (Error 500 en Raíz)
*   **Error exacto:** `ErrorException file_get_contents(.../public/../../public_html/index.html): Failed to open stream: No such file or directory`
*   **Causa:** El helper `public_path()` dentro de `routes/web.php` fallaba al calcular los niveles de carpetas relativas (`../../`) para encontrar el `index.html` de React en cPanel.
*   **Solución:** Se reemplazó por una ruta absoluta configurable del sistema de archivos del hosting:

```php
Route::get('/', function () {
    return file_get_contents('/ruta/absoluta/a/public_html/index.html');
});
```

### 5. Error 500 en Login por Desconexión de Base de Datos (Scripts Híbridos)
*   **Error exacto:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` al llamar a `/admin-api.php?route=admin-login`.
*   **Causa:** El frontend de React utiliza un script PHP independiente (`admin-api.php`) que ejecuta un lector automático de entornos (`$envPaths`). Este lector buscaba el archivo `.env` en una ruta incorrecta del núcleo, omitiendo la subcarpeta interna `backend`. Al no encontrarlo, usaba las credenciales locales por defecto (root, sin contraseña), rompiendo la conexión en producción.
*   **Solución:** Se corrigió la ruta de búsqueda en el array del script para incluir el subdirectorio correcto:

```php
$envPaths = [
    __DIR__ . '/../.env',
    __DIR__ . '/../<ruta-al-core>/backend/.env'
];
```

### 6. Error 404 en el Cliente Público (`/menu`, `/variations`, `/sanctum`)
*   **Error exacto:** `Failed to load resource: the server responded with a status of 404 ()`
*   **Causa:** Al navegar por la parte pública, el cliente de React realizaba peticiones a rutas virtuales de Laravel. cPanel las buscaba como carpetas físicas reales dentro de `public_html` y, al no encontrarlas, denegaba el acceso sin redirigirlas al `index.php`.
*   **Solución:** Se borró el contenido del archivo `/public_html/.htaccess` y se reescribió por completo con las directivas oficiales de enrutamiento de Laravel, añadiendo excepciones para que no interfiriera con las APIs independientes (`admin-api.php`) y forzando la seguridad SSL:

```apache
# Redirección a HTTPS y Regla de Oro de Laravel en .htaccess
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L]
```

---

## Actualizacion: Modulo de Fidelizacion + Iconos (Agosto 2026)

### SQL a ejecutar en phpMyAdmin

Archivo: `backend/database/sql_updates/create_loyalty_customers_table.sql`

```sql
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

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('loyalty_required_orders', '15', 'Cantidad de pedidos requeridos para premio', NOW(), NOW())
ON DUPLICATE KEY UPDATE `key` = `key`;

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`)
VALUES ('loyalty_message_template', '¡Felicidades! Tienes un regalo por tus 15 pedidos.', 'Plantilla del mensaje de fidelización', NOW(), NOW())
ON DUPLICATE KEY UPDATE `key` = `key`;
```

### Archivos a subir a cPanel

| Archivo local | Destino en cPanel | Que cambio |
|---|---|---|
| `backend/public/admin-api.php` | `public_html/admin-api.php` | Paginacion loyalty, endpoint /loyalty/badge, fix telefono |
| `backend/public/admin/index.html` | `public_html/admin/index.html` | Tabla paginada, campanita, Lucide icons, colores modales |
| `backend/public/index.html` | `public_html/index.html` | Nuevo build del frontend (referencia al JS actualizado) |
| `backend/public/assets/index-*.js` | `public_html/assets/index-*.js` | Build con react-icons (reemplaza el viejo) |

### Pasos

1. Ejecutar el SQL de arriba en phpMyAdmin
2. Subir los 4 archivos listados
3. Eliminar los `index-*.js` viejos en `/assets/` (dejar solo el nuevo)
4. Hacer hard refresh (Ctrl+Shift+R) en el admin para cargar Lucide desde CDN

### Que se agrego

- Modulo de fidelizacion: tabla de clientes con paginacion, busqueda, premio por ciclo de pedidos
- Campanita de notificaciones: badge con polling cada 30s, dropdown con clientes premiados
- Iconos Lucide (admin) y react-icons (cliente) reemplazando todos los emojis
- Colores contextuales en modales de confirmar/cancelar pedido
- Icono WhatsApp real en todos los botones de mensajeria
