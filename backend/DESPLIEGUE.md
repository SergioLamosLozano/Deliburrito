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
