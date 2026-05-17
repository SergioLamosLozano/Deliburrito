# 🕐 Configuración de Zona Horaria - Colombia

## Problema
Los pedidos de ayer aparecen como de hoy porque las fechas se guardan en UTC pero se muestran sin convertir a hora de Colombia (UTC-5).

## Solución

### 1. Actualizar archivo `.env` en producción

Edita el archivo `.env` en el servidor (ruta: `deliburrito_core/backend/.env`) y agrega esta línea después de `APP_URL`:

```env
APP_TIMEZONE=America/Bogota
```

**Ejemplo completo:**
```env
APP_NAME="Deli Burrito"
APP_ENV=production
APP_KEY=base64:tu_key_aqui
APP_DEBUG=false
APP_URL=https://tudominio.com
APP_TIMEZONE=America/Bogota
```

### 2. Archivos ya actualizados (subir a cPanel)

Los siguientes archivos ya tienen la corrección de zona horaria:

- ✅ `backend/public/admin-api.php` - Configurado con `date_default_timezone_set('America/Bogota')`
- ✅ `backend/public/admin/index.html` - JavaScript convierte fechas UTC correctamente

### 3. Verificación

Después de subir los archivos y actualizar el `.env`:

1. Haz un pedido de prueba
2. Verifica que aparezca en "Hoy" en el admin
3. Verifica que la hora del ticket sea correcta (hora de Colombia)

## ¿Cómo funciona?

### Antes (❌ Incorrecto):
```
Pedido a las 11:30 PM Colombia
↓
Se guarda como 4:30 AM UTC (día siguiente)
↓
Se muestra como 4:30 AM (día siguiente) ❌
```

### Después (✅ Correcto):
```
Pedido a las 11:30 PM Colombia
↓
Se guarda como 4:30 AM UTC (día siguiente)
↓
Se convierte a 11:30 PM Colombia (día correcto) ✅
```

## Notas importantes

- Las fechas en la base de datos **siempre se guardan en UTC** (esto es correcto)
- La conversión a hora local se hace al **mostrar** las fechas
- Esto asegura que funcione correctamente sin importar dónde esté el servidor
