# Deliburrito

Resumen breve
- Deliburrito es una aplicación minimalista para tomar pedidos (frontend React + Vite + Tailwind, y backend PHP + MySQL).
- El frontend (cliente) es una SPA desarrollada con React; el backend ofrece una API REST mínima y páginas estáticas de administración.

Estructura del proyecto
- `frontend/` — código fuente del cliente (React + Vite).
  - `frontend/src/` — componentes React y fuentes.
  - `frontend/dist/` — build de producción (assets compilados).
  - `frontend/vite.config.js` — configuración del servidor dev y proxy.
- `backend/` — servidor y API PHP.
  - `backend/public/` — carpeta pública servida por PHP (páginas admin y, opcionalmente, assets `dist`).
  - `backend/public/api.php` — entrada principal de la API (routing por `?route=...`).
  - `backend/public/admin/` — páginas estáticas del panel administrativo.

Base de datos
- Motor: MySQL 8+ (ejemplo usado en desarrollo).
- Tablas principales: `categories`, `options`, `orders`, `order_items`, `order_item_options`.
- Nota de seguridad: no incluyas credenciales en el repo. Usa variables de entorno o un archivo de configuración local que esté en `.gitignore`.

Rutas y API
- API entry: `backend/public/api.php?route=...`.
  - `route=orders` — POST para crear pedidos, GET para listar.
  - Otras rutas: `categories`, `options`, `reports`, y acciones para aceptar/cancelar/imprimir pedidos. Revisa `api.php` para la lista completa y detalles.

Flujos de trabajo
- Desarrollo (recomendado):
  1. Levantar backend (PHP built-in):
     ```powershell
     cd "C:\Users\sergi\Desktop\Deliburrito 2\backend"
     php -S localhost:8000 -t public
     ```
  2. Levantar frontend (Vite) con HMR:
     ```powershell
     cd "C:\Users\sergi\Desktop\Deliburrito 2\frontend"
     npm install    # si no están instaladas las dependencias
     npm run dev
     ```
  3. Acceder a la app cliente en `http://localhost:5173` y al admin en `http://localhost:8000/admin/`.

- Producción (servir desde backend):
  1. Generar build del frontend:
     ```powershell
     cd "C:\Users\sergi\Desktop\Deliburrito 2\frontend"
     npm run build
     ```
  2. Copiar `frontend/dist` dentro de `backend/public` (por ejemplo en `backend/public/dist`) o actualizar las referencias en las páginas admin para apuntar al build.
  3. Servir `backend/public` con PHP/Apache/Nginx.

Consideraciones técnicas y debugging
- Vite proxy: en `frontend/vite.config.js` la proxy debe usar el formato objeto y `changeOrigin: true` para reenviar correctamente las peticiones al backend durante el desarrollo.
- Tipo de IDs: el frontend debe enviar `option_id` numéricos que coincidan con la DB; strings o tokens custom pueden causar errores en el backend.
- Routing: la API usa query-string (`?route=`) por compatibilidad con el servidor PHP embebido (evita depender de PATH_INFO en este entorno).
- Manejo de errores: revisar logs del servidor PHP y las respuestas JSON del API para mensajes detallados.

Checklist para onboarding rápido
- [ ] Importar la base de datos inicial y poblarla con datos (categorías, opciones).
- [ ] Ajustar credenciales DB en configuración local (no subirlas).
- [ ] En desarrollo: arrancar PHP y Vite como se indica arriba.
- [ ] Si quieres solo el backend + UI estática, construir `frontend/dist` y copiarlo a `backend/public`.

Archivos clave a revisar
- `backend/public/api.php` — lógica y rutas del API.
- `backend/public/admin/` — páginas del panel de administración.
- `frontend/src/` — fuentes React (.jsx/.js) y componentes.
- `frontend/vite.config.js` — configuración del dev server y proxy.

Si necesitas que prepare comandos de despliegue, scripts de base de datos, o un `.env.example`, dímelo y lo agrego.

-- Fin --
# Deli Burrito — Proyecto

Estructura inicial generada automáticamente: migraciones, modelos y seeders (Fase 1), y un ejemplo de frontend React adaptado del HTML provisto.

Siguientes pasos:
- Revisar migraciones y modelos.
- Ejecutar `composer install` y `php artisan migrate --seed` en un entorno Laravel.
- Compilar assets del frontend localmente y desplegar `public` en hosting compartido.
