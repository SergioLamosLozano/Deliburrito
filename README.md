# Deli Burrito

Sistema de pedidos en linea para restaurante de comida rapida. Constructor de pedidos dinamico para clientes + panel de administracion en tiempo real.

## Stack

- **Frontend cliente:** React 18, Vite, Tailwind CSS, react-icons
- **Panel admin:** HTML/JS vanilla, Tailwind (CDN), Lucide Icons (CDN)
- **Backend/API:** PHP puro (`admin-api.php`) — sin framework en runtime
- **Base de datos:** MySQL 8+
- **Framework (migraciones/modelos):** Laravel 11 (solo para tooling, seeders y migraciones)

## Estructura del proyecto

```
frontend/               → Codigo fuente React (cliente)
frontend/src/           → Componentes React
frontend/vite.config.js → Proxy a backend + output a backend/public

backend/                → Servidor PHP + API + Admin
backend/public/         → Carpeta publica (servida por PHP o Apache)
backend/public/admin/   → Panel de administracion (SPA HTML)
backend/public/admin-api.php → API REST del admin y del cliente
backend/public/index.html    → Frontend compilado (output de Vite build)
backend/public/assets/       → JS/CSS compilado del frontend

backend/database/migrations/   → Migraciones Laravel
backend/database/seeders/      → Seeders de datos iniciales y prueba
backend/database/sql_updates/  → SQL listos para ejecutar en phpMyAdmin (produccion)
```

## Iniciar en desarrollo

Un solo comando levanta todo (frontend compilado + admin + API):

```powershell
cd backend
php -S localhost:8000 -t public
```

Accesos:
- Cliente: http://localhost:8000
- Admin: http://localhost:8000/admin/

### Modo desarrollo con HMR (opcional)

Si vas a editar el frontend React y quieres hot reload:

```powershell
# Terminal 1 — Backend
cd backend
php -S localhost:8000 -t public

# Terminal 2 — Frontend con HMR
cd frontend
npm install
npm run dev
```

Con Vite corriendo, el cliente se ve en http://localhost:5173 (proxy automatico al backend).

## Compilar frontend para produccion

```powershell
cd frontend
npm run build
```

Esto genera `backend/public/index.html` y `backend/public/assets/index-*.js` que son los archivos que se suben a produccion.

**Importante:** Despues del build, eliminar los `index-*.js` viejos en `backend/public/assets/` y dejar solo el nuevo.

## Base de datos

### Desarrollo (primera vez)

```powershell
cd backend
composer install
php artisan migrate --seed
```

### Produccion (actualizaciones)

Los cambios de BD se aplican via phpMyAdmin usando los archivos SQL en:
`backend/database/sql_updates/`

Cada archivo SQL tiene un comentario con la fecha y lo que hace.

## Despliegue a produccion (cPanel)

Ver `backend/DESPLIEGUE.md` para la guia completa.

Resumen rapido de una actualizacion:
1. Compilar frontend: `npm run build` en `/frontend`
2. Ejecutar SQL en phpMyAdmin (si hay cambios de BD)
3. Subir archivos modificados via cPanel File Manager
4. Eliminar assets JS viejos en `/assets/`

## Documentacion adicional

| Archivo | Contenido |
|---|---|
| `backend/DESPLIEGUE.md` | Guia de despliegue a cPanel paso a paso |
| `FIDELIZACION.md` | Modulo de fidelizacion — logica y flujo |
| `ANALISIS_ARQUITECTURA_Y_BD.md` | Arquitectura del sistema y modelo de datos |
| `SECURITY_AUDIT.md` | Auditoria de seguridad y parches aplicados |
