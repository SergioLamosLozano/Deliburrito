# Cambios Realizados - 16 de Mayo 2026

## ✅ TASK 8: Duplicar productos con/sin adicionales (COMPLETADO)

### Descripción
Implementada funcionalidad para que al duplicar un producto del carrito, el usuario pueda elegir si desea incluir o excluir los ingredientes adicionales.

### Cambios realizados:

1. **Campo `is_addon` en categorías:**
   - Agregado checkbox "Es adicional" en formulario de categorías (admin)
   - Permite marcar categorías como adicionales (ej: bebidas, papas, extras)
   - Migración: `2026_05_16_000002_add_is_addon_to_categories.php`

2. **Lógica de duplicación inteligente:**
   - Modal de confirmación cuando el producto tiene adicionales
   - Dos opciones: "SÍ, CON ADICIONALES" o "NO, SIN ADICIONALES"
   - Si elige sin adicionales: filtra opciones de categorías con `is_addon: true` y recalcula precio
   - Si no hay adicionales: duplica directamente sin mostrar modal

3. **Archivos modificados:**
   - `frontend/src/App.jsx` - Lógica completa de duplicación
   - `backend/app/Models/Category.php` - Campo `is_addon` agregado
   - `backend/app/Http/Controllers/Admin/CategoryController.php` - Validación de `is_addon`
   - `backend/resources/js/Pages/Admin/Categories/Edit.jsx` - Checkbox en Inertia
   - `backend/resources/js/Pages/Admin/Categories/Create.jsx` - Checkbox en Inertia
   - `backend/public/admin-api.php` - Manejo de `is_addon`
   - `backend/public/admin/index.html` - Checkbox en admin HTML (CORREGIDO)

### SQL para producción:
```sql
ALTER TABLE `categories` ADD `is_addon` TINYINT(1) NOT NULL DEFAULT '0' AFTER `is_required`;
```

---

## ✅ TASK 9: Campo "Número de mesa" para pedidos locales (COMPLETADO)

### Descripción
Agregado campo "Número de mesa" que aparece cuando el cliente elige `delivery_type === 'local'`.

### Cambios realizados:

1. **Base de datos:**
   - Migración: `2026_05_16_000003_add_table_number_to_orders.php`
   - Campo `table_number` (varchar, nullable) en tabla `orders`

2. **Frontend:**
   - Campo visible solo cuando `delivery_type === 'local'`
   - Campo requerido con placeholder "Ej: Mesa 5"
   - Incluido en payload del pedido

3. **Backend:**
   - Modelo `Order.php` actualizado
   - `OrderController.php` con validación
   - `admin-api.php` guarda el campo

4. **Vista Admin:**
   - Emoji 🍽️ para pedidos locales
   - Muestra "🪑 Mesa X" cuando hay número de mesa
   - Mantiene lógica para domicilio y recoger

### Archivos modificados:
   - `backend/database/migrations/2026_05_16_000003_add_table_number_to_orders.php`
   - `backend/app/Models/Order.php`
   - `frontend/src/components/Checkout.jsx`
   - `backend/public/admin-api.php`
   - `backend/app/Http/Controllers/OrderController.php`
   - `backend/public/admin/index.html`

### SQL para producción:
```sql
ALTER TABLE `orders` ADD `table_number` VARCHAR(255) NULL AFTER `customer_address`;
```

---

## ✅ TASK 10: Mensajes de notificación personalizables (COMPLETADO)

### Descripción
Implementada funcionalidad para personalizar los mensajes de WhatsApp que se envían cuando se acepta o cancela un pedido.

### Cambios realizados:

1. **Nuevos settings en base de datos:**
   - `mensaje_pedido_aceptado`: Mensaje cuando se acepta un pedido
   - `mensaje_pedido_cancelado`: Mensaje cuando se cancela un pedido
   - Soportan variables: `{nombre}` y `{numero}`

2. **Interfaz en Admin:**
   - Sección "Mensajes de Notificación" en Settings
   - Dos campos de texto (textarea) para editar mensajes
   - Ejemplos y guía de uso de variables
   - Botón "GUARDAR AJUSTES" actualiza los tres settings

3. **Integración con WhatsApp:**
   - Función `sendWhatsApp()` actualizada
   - Lee el mensaje desde settings
   - Reemplaza variables `{nombre}` y `{numero}` con datos reales
   - Mensaje por defecto si no hay configuración

### Archivos modificados:
   - `backend/public/admin/index.html` - Interfaz completa
   - `backend/database/seeders/DatabaseSeeder.php` - Settings por defecto
   - `backend/database/sql_updates/add_notification_messages.sql` - SQL para producción

### SQL para producción:
```sql
INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_aceptado', 'Hola {nombre}, tu pedido con identificador #{numero} ha sido aceptado y está en preparación. ¡Gracias por elegir Deli Burrito!', 'Mensaje de WhatsApp cuando se acepta un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_cancelado', 'Hola {nombre}, lamentamos informarte que tu pedido #{numero} ha sido cancelado. Disculpa las molestias.', 'Mensaje de WhatsApp cuando se cancela un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();
```

---

## 🐛 CORRECCIONES

### Bug: Checkbox de variaciones no guardaba
**Problema:** Al editar una categoría y marcar/desmarcar variaciones, los cambios no se guardaban.
**Solución:** Agregado procesamiento de `is_addon` en el submit del formulario de categorías.
**Archivo:** `backend/public/admin/index.html`

---

## 📦 ARCHIVOS PARA SUBIR A CPANEL

### Archivos modificados que debes reemplazar:

1. **Backend - Modelos:**
   - `backend/app/Models/Order.php`
   - `backend/app/Models/Category.php`

2. **Backend - Controllers:**
   - `backend/app/Http/Controllers/OrderController.php`
   - `backend/app/Http/Controllers/Admin/CategoryController.php`

3. **Backend - API:**
   - `backend/public/admin-api.php`

4. **Backend - Vistas Admin:**
   - `backend/public/admin/index.html`

5. **Frontend - Cliente:**
   - `backend/public/index.html`
   - `backend/public/assets/index-KxlFLEG_.js` (nuevo)

6. **Backend - Inertia (si usas Laravel admin):**
   - `backend/resources/js/Pages/Admin/Categories/Edit.jsx`
   - `backend/resources/js/Pages/Admin/Categories/Create.jsx`

### Archivos nuevos:
   - `backend/database/migrations/2026_05_16_000002_add_is_addon_to_categories.php`
   - `backend/database/migrations/2026_05_16_000003_add_table_number_to_orders.php`
   - `backend/database/sql_updates/add_notification_messages.sql`

---

## 🗄️ SQL A EJECUTAR EN PHPMYADMIN

Ejecuta estos comandos en orden:

```sql
-- 1. Agregar campo is_addon a categorías
ALTER TABLE `categories` ADD `is_addon` TINYINT(1) NOT NULL DEFAULT '0' AFTER `is_required`;

-- 2. Agregar campo table_number a orders
ALTER TABLE `orders` ADD `table_number` VARCHAR(255) NULL AFTER `customer_address`;

-- 3. Agregar settings de mensajes de notificación
INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_aceptado', 'Hola {nombre}, tu pedido con identificador #{numero} ha sido aceptado y está en preparación. ¡Gracias por elegir Deli Burrito!', 'Mensaje de WhatsApp cuando se acepta un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();

INSERT INTO `settings` (`key`, `value`, `description`, `created_at`, `updated_at`) 
VALUES 
('mensaje_pedido_cancelado', 'Hola {nombre}, lamentamos informarte que tu pedido #{numero} ha sido cancelado. Disculpa las molestias.', 'Mensaje de WhatsApp cuando se cancela un pedido', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();
```

---

## 🧪 PRUEBAS RECOMENDADAS

### 1. Duplicar con adicionales:
   - Armar un producto con bebida o papas (categoría marcada como adicional)
   - Agregarlo al carrito
   - Hacer clic en "Duplicar"
   - Verificar que aparece el modal con dos opciones
   - Probar ambas opciones y verificar precios

### 2. Número de mesa:
   - En checkout, elegir "Local"
   - Verificar que aparece campo "Número de mesa"
   - Completar y enviar pedido
   - Verificar en admin que se muestra el número de mesa

### 3. Mensajes personalizables:
   - Ir a Settings en admin
   - Editar los mensajes de notificación
   - Guardar cambios
   - Aceptar un pedido con teléfono
   - Verificar que el mensaje de WhatsApp usa el texto personalizado

### 4. Variaciones en categorías:
   - Editar una categoría
   - Marcar/desmarcar variaciones
   - Guardar
   - Verificar que los cambios se mantienen al reabrir

---

## 📝 NOTAS IMPORTANTES

1. **Build del frontend:** Ya está compilado en `index-KxlFLEG_.js`
2. **Archivos antiguos:** Puedes eliminar `index-Dy1O4s4A.js` del servidor
3. **Cache:** Recuerda hacer Ctrl + Shift + R después de subir archivos
4. **Variables en mensajes:** Solo `{nombre}` y `{numero}` están soportadas
5. **Categorías adicionales:** Marca como adicionales: bebidas, papas, aros de cebolla, etc.

---

## 🎯 FUNCIONALIDADES COMPLETADAS

✅ Duplicar productos con/sin adicionales
✅ Campo número de mesa para pedidos locales
✅ Mensajes de notificación personalizables
✅ Corrección de bug de variaciones en categorías
✅ Interfaz completa en Settings para configuración

---

**Fecha:** 16 de Mayo 2026
**Versión:** 2.1.0
**Estado:** Listo para producción
