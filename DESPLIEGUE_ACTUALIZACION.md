# 🚀 Guía de Despliegue - Actualización de Precios y Mejoras

## ⚠️ ANTES DE EMPEZAR

1. **HACER BACKUP COMPLETO** de:
   - Base de datos (exportar desde phpMyAdmin)
   - Carpeta `backend/` completa en cPanel

---

## 📦 PASO 1: Actualizar Base de Datos

### Opción A: Con acceso SSH (RECOMENDADO)
```bash
cd /home/tu_usuario/public_html/backend
php artisan migrate
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Opción B: Sin SSH (usar phpMyAdmin)
1. Ir a phpMyAdmin en cPanel
2. Seleccionar tu base de datos
3. Ir a la pestaña "SQL"
4. Copiar y pegar el contenido de `migration_manual.sql`
5. Hacer clic en "Continuar"
6. Verificar que no haya errores

---

## 📁 PASO 2: Subir Archivos Actualizados

### Archivos del Frontend (Cliente)
Subir a `/public_html/` o donde esté tu frontend:

```
✅ backend/public/index.html
✅ backend/public/assets/index-8ccsd8tQ.js
```

**IMPORTANTE:** Eliminar archivos viejos en `/assets/`:
- Borrar todos los `index-*.js` EXCEPTO `index-8ccsd8tQ.js`

### Archivos del Backend (API)
Subir a `/public_html/backend/` o tu ruta de backend:

```
✅ backend/public/admin-api.php
✅ backend/public/admin/index.html
✅ backend/app/Models/Option.php
✅ backend/app/Models/ProductVariation.php
✅ backend/app/Models/Category.php
✅ backend/app/Http/Controllers/Admin/OptionController.php
✅ backend/app/Http/Controllers/Admin/ProductVariationController.php
✅ backend/app/Http/Controllers/Admin/CategoryController.php
```

### Archivos de Migración (para referencia)
Subir a `/backend/database/migrations/`:

```
✅ backend/database/migrations/2026_05_16_000001_normalize_price_fields.php
```

### Archivos de Seeders (actualizados)
Subir a `/backend/database/seeders/`:

```
✅ backend/database/seeders/DatabaseSeeder.php
```

---

## 🧪 PASO 3: Verificar en Producción

### 1. Verificar Base de Datos
En phpMyAdmin, ejecutar:
```sql
-- Verificar que la columna 'price' existe en options
DESCRIBE options;

-- Verificar que la columna 'price' existe en product_variations
DESCRIBE product_variations;

-- Ver algunos datos
SELECT id, name, price FROM options LIMIT 5;
SELECT id, name, price FROM product_variations LIMIT 5;
```

### 2. Verificar Frontend Cliente
1. Abrir tu sitio web (frontend)
2. Hacer `Ctrl + Shift + R` (hard refresh)
3. Probar:
   - ✅ Crear un pedido
   - ✅ Ver precios correctos
   - ✅ Duplicar un producto en el carrito
   - ✅ Eliminar un producto del carrito

### 3. Verificar Admin Dashboard
1. Ir a `/admin` o tu ruta de admin
2. Hacer `Ctrl + Shift + R` (hard refresh)
3. Probar:
   - ✅ Ver lista de opciones (debe mostrar solo "Precio")
   - ✅ Editar una opción (debe tener un solo campo de precio)
   - ✅ Ver lista de variaciones (debe mostrar solo "Precio")
   - ✅ Editar una categoría (checkbox "Es obligatorio" debe funcionar)

---

## 🔧 PASO 4: Limpiar Caché (Opcional pero Recomendado)

Si tienes acceso SSH:
```bash
cd /home/tu_usuario/public_html/backend
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

Si NO tienes SSH:
- Eliminar manualmente la carpeta `/backend/bootstrap/cache/` (se regenerará automáticamente)

---

## 📝 Cambios Implementados

### ✅ Normalización de Precios
- **Antes:** `options` tenía `price_base` y `price_extra`
- **Ahora:** `options` tiene solo `price`
- **Antes:** `product_variations` tenía `base_price`
- **Ahora:** `product_variations` tiene solo `price`

### ✅ Duplicar en Carrito
- Botón "Duplicar" en el checkout
- Crea una copia exacta del producto con todas sus opciones

### ✅ Fix: Campo "Es obligatorio"
- Ahora guarda correctamente el estado del checkbox
- Se agregó cast booleano en el modelo `Category`

---

## ⚠️ Problemas Comunes

### "Error: Column 'price_base' not found"
- La migración no se ejecutó correctamente
- Ejecutar `migration_manual.sql` en phpMyAdmin

### "El admin muestra campos vacíos"
- Hacer hard refresh: `Ctrl + Shift + R`
- Limpiar caché del navegador

### "Los precios están en 0"
- Verificar que la migración copió los datos: `SELECT * FROM options LIMIT 5;`
- Si están en 0, restaurar backup y volver a ejecutar migración

---

## 🆘 Rollback (Si algo sale mal)

1. Restaurar backup de la base de datos desde phpMyAdmin
2. Restaurar archivos del backup de cPanel
3. Contactar soporte si es necesario

---

## ✅ Checklist Final

- [ ] Backup de base de datos hecho
- [ ] Backup de archivos hecho
- [ ] Migración ejecutada sin errores
- [ ] Archivos subidos correctamente
- [ ] Frontend funciona (crear pedido, duplicar)
- [ ] Admin funciona (editar opciones, categorías)
- [ ] Precios se muestran correctamente
- [ ] Archivos viejos de `/assets/` eliminados

---

**Fecha de actualización:** 16 de Mayo, 2026
**Versión:** 2.0 - Normalización de Precios
