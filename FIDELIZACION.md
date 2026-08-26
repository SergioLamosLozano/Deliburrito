# Fidelizacion

Este documento resume como funciona el modulo de fidelizacion de Deli Burrito y como esta pensado para operar en local y en produccion.

## Objetivo

El modulo de fidelizacion premia a un cliente cuando completa una cantidad configurada de pedidos aceptados. El flujo principal es:

1. El sistema cuenta los pedidos con estado `aceptado` por numero de telefono.
2. Compara el total contra el umbral configurado en `loyalty_required_orders`.
3. Cuando el cliente llega al limite, el admin puede enviar un mensaje de WhatsApp con la recompensa.
4. Al notificarse el premio, el ciclo se reinicia usando la tabla `loyalty_customers`.

## Datos y configuracion

El modulo usa estas claves de configuracion:

- `loyalty_required_orders`: cantidad de pedidos necesarios para ganar el premio.
- `loyalty_message_template`: texto base del mensaje de WhatsApp.
- `comercio_abierto`: estado del negocio para el frontend publico.

Tambien usa estas tablas:

- `orders`: historial de pedidos aceptados.
- `loyalty_customers`: guarda el ultimo total premiado por cliente y la fecha del ultimo canje.
- `settings`: almacena las claves de configuracion.

## Como se calcula el premio

El sistema agrupa los pedidos por `customer_phone` y calcula:

- `total_orders`: total historico de pedidos aceptados.
- `current_cycle_orders`: pedidos acumulados desde el ultimo premio.
- `reward_ready`: si el cliente ya alcanzo el umbral.

Un cliente solo puede ser notificado cuando `current_cycle_orders` es mayor o igual que `loyalty_required_orders`.

## Flujo de notificacion

Cuando el admin presiona el boton de notificacion:

1. Se valida que el telefono exista.
2. Se verifica que el cliente ya cumpla el umbral.
3. Se construye el enlace de WhatsApp con el mensaje configurado.
4. Se abre WhatsApp en una pestaña nueva.
5. Se actualiza `loyalty_customers` para registrar el ultimo canje.

En produccion el ciclo se consume normalmente. En local se mantiene el mismo comportamiento para que las pruebas reflejen el flujo real.

## Interfaces disponibles

Hay dos superficies de administracion en el proyecto:

- Panel moderno Laravel/Inertia en `backend/resources/js/Pages/Admin/Loyalty`.
- Panel legado en `backend/public/admin/index.html`, que es el que se usa para las pruebas operativas del proyecto.

Ambos consumen la logica del backend y muestran el listado de clientes con el estado del ciclo.

## Datos de prueba

El seeder de fidelizacion crea un cliente de prueba con 15 pedidos aceptados para facilitar validaciones locales.

- Telefono de prueba: `3043515689`
- Umbral por defecto: `15`
- Estado inicial del comercio: cerrado, a traves de `comercio_abierto = 0`

## Comportamiento del comercio cerrado

Cuando `comercio_abierto` vale `0`, el frontend publico muestra el aviso de comercio cerrado y no deja seguir con el flujo normal de compra. Si vale `1`, el sitio funciona con normalidad.

## Archivos relacionados

- `backend/public/admin-api.php`
- `backend/public/admin/index.html`
- `backend/app/Http/Controllers/Admin/LoyaltyController.php`
- `backend/database/seeders/DatabaseSeeder.php`
- `backend/database/seeders/LoyaltyTestOrdersSeeder.php`
- `backend/app/Http/Controllers/MenuController.php`
- `frontend/src/App.jsx`

## Nota operativa

Si vas a subir cambios para que otra persona pruebe varios pedidos, asegúrate de mantener:

- el cliente de prueba con pedidos suficientes,
- el estado del comercio configurado segun la prueba,
- y el mensaje de WhatsApp ajustado al escenario que quieras validar.
