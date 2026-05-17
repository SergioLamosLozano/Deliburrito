# Configurar Corte Parcial en Impresora Térmica

## 🎯 Objetivo
Hacer que la impresora térmica haga un **corte parcial** (partial cut) entre las dos secciones del ticket, dejando un pequeño pedazo de papel conectando ambas partes.

---

## ⚠️ Limitación Importante

Los navegadores web **NO pueden enviar comandos ESC/POS directamente** a las impresoras. El corte parcial debe configurarse en:
1. El **driver de la impresora**
2. O usando **software especializado** (como PrintNode, QZ Tray, etc.)

---

## 🔧 Solución 1: Configurar el Driver de la Impresora (Recomendado)

### Windows:

1. **Abrir Configuración de Impresoras:**
   - Panel de Control → Dispositivos e impresoras
   - Clic derecho en tu impresora térmica → "Preferencias de impresión"

2. **Buscar opciones de corte:**
   - Pestaña "Avanzado" o "Configuración"
   - Buscar opciones como:
     - "Tipo de corte" → Seleccionar **"Corte parcial"** o **"Partial cut"**
     - "Cut mode" → Seleccionar **"Partial"**
     - "Paper cut" → Seleccionar **"Partial cut"**

3. **Configurar cuándo cortar:**
   - Algunas impresoras permiten configurar "Cortar después de X líneas"
   - O "Cortar en salto de página"

4. **Guardar y probar**

---

## 🔧 Solución 2: Software Especializado

### Opción A: QZ Tray (Gratuito)

**QZ Tray** permite enviar comandos ESC/POS desde el navegador:

1. **Instalar QZ Tray:**
   ```
   https://qz.io/download/
   ```

2. **Modificar el código para usar QZ Tray:**
   - Requiere JavaScript adicional
   - Puede enviar comandos ESC/POS directamente
   - Comando de corte parcial: `\x1B\x6D`

### Opción B: PrintNode (Pago)

**PrintNode** es un servicio cloud para impresión:
- Soporta comandos ESC/POS
- Funciona desde cualquier navegador
- Requiere suscripción mensual

---

## 🔧 Solución 3: Configuración Manual del Ticket

Si no puedes configurar el corte parcial automático, puedes:

### Opción actual (implementada):
- El ticket se imprime en una sola hoja continua
- Tiene una línea visual de tijeras: `✂ ✂ ✂ ✂ ✂`
- Se puede rasgar manualmente por esa línea
- Queda un pequeño pedazo conectando ambas partes

### Ventajas:
- ✅ Funciona en cualquier impresora
- ✅ No requiere configuración especial
- ✅ Fácil de separar manualmente
- ✅ Ahorra papel

---

## 📋 Comandos ESC/POS de Corte

Para referencia técnica:

```
Corte completo:  ESC i    (1B 69)
Corte parcial:   ESC m    (1B 6D)
Feed y corte:    GS V 66  (1D 56 42)
```

---

## 🎯 Recomendación Final

**Para tu caso específico:**

1. **Mejor opción:** Configurar el driver de la impresora para hacer corte parcial
2. **Alternativa:** Usar el ticket actual con línea visual (ya implementado)
3. **Avanzado:** Implementar QZ Tray si necesitas control total

---

## 📝 Notas

- La mayoría de impresoras térmicas modernas soportan corte parcial
- Consulta el manual de tu impresora específica
- Marcas comunes: Epson TM, Star Micronics, Bixolon, etc.
- Cada marca puede tener nombres diferentes para la misma función

---

## 🔍 Identificar tu Impresora

Para saber qué opciones tiene tu impresora:

1. Busca el modelo exacto (ej: "Epson TM-T20II")
2. Descarga el manual del fabricante
3. Busca la sección "ESC/POS commands" o "Comandos de corte"
4. Verifica si soporta "Partial cut" o "Corte parcial"

---

**Fecha:** 16 de Mayo 2026
**Estado:** Ticket con línea visual implementado - Corte parcial requiere configuración de driver
