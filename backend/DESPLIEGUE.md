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
| **DB_PASSWORD** | `Santitover149*` | *(Tu contraseña de cPanel)* |

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
*   **Solución:** Se modificó el archivo `/public_html/index.php` para corregir los paths absolutos hacia el directorio del núcleo del proyecto (`/deliburrito_core/backend/`).

### 3. Incompatibilidad de Versión de PHP
*   **Error exacto:** `Composer detected issues in your platform: Your Composer dependencies require a PHP version ">= 8.4.0".`
*   **Causa:** Las dependencias del proyecto requerían PHP 8.4+, pero el hosting compartía una versión inferior (8.1 u 8.2) por defecto.
*   **Solución:** Se ingresó a la herramienta **"Seleccionar Versión PHP"** (*Select PHP Version*) en cPanel y se actualizó el entorno global a PHP 8.4.

### 4. Error de Apertura de Flujo en Ruta Relativa (Error 500 en Raíz)
*   **Error exacto:** `ErrorException file_get_contents(.../public/../../public_html/index.html): Failed to open stream: No such file or directory`
*   **Causa:** El helper `public_path()` dentro de `routes/web.php` fallaba al calcular los niveles de carpetas relativas (`../../`) para encontrar el `index.html` de React en cPanel.
*   **Solución:** Se reemplazó por la ruta absoluta directa del sistema de archivos de cPanel:

```php
Route::get('/', function () {    
    return file_get_contents('/home/deliburr/public_html/index.html');
});
```

### 5. Error 500 en Login por Desconexión de Base de Datos (Scripts Híbridos)
*   **Error exacto:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` al llamar a `/admin-api.php?route=admin-login`.
*   **Causa:** El frontend de React utiliza un script PHP independiente (`admin-api.php`) que ejecuta un lector automático de entornos (`$envPaths`). Este lector buscaba el archivo `.env` en `/deliburrito_core/.env`, omitiendo la subcarpeta interna `backend`. Al no encontrarlo, usaba las credenciales locales por defecto (root, sin contraseña), rompiendo la conexión en producción.
*   **Solución:** Se corrigió la ruta de búsqueda en el array del script para incluir el subdirectorio correcto:

```php
$envPaths = [
    __DIR__ . '/../.env',
    __DIR__ . '/../deliburrito_core/backend/.env' // RUTA CORREGIDA
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
