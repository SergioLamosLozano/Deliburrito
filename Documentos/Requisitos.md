# Documento de Alcance y Requerimientos

**Proyecto:** Plataforma de Pedidos y Gestión "Deli Burrito"  
**Fecha:** 27 de Abril de 2026  

---

## 1. Objetivo del Proyecto
Desarrollar una plataforma web a la medida que reemplace el actual sistema de formularios (Whatsform), centralizando la recepción de pedidos, mejorando la experiencia de compra del cliente en dispositivos móviles y otorgando control total de administración y finanzas a la gerencia a través de un panel de escritorio.

## 2. Experiencia del Cliente (Interfaz Móvil)
El diseño estará optimizado para celulares, utilizando los colores corporativos de la marca (Amarillo, Rojo, Verde y Crema).

* **Navegación Fluida:** El usuario podrá avanzar en el armado de su pedido haciendo clic en los botones tradicionales o de forma automática al tocar una opción en la pantalla.
* **Lógica de Precios Dinámica:** Los productos (Burritos y Tortihamburguesas) no tendrán un precio fijo base. El costo total iniciará según la "Proteína Principal" seleccionada (Ej. Res = $13.000, Cerdo Pesto = $14.000, Costilla = $15.000).
* **Flujo de Armado (Paso a Paso):**
  * Elección de Proteína Obligatoria.
  * Selección de hasta 2 proteínas adicionales (con costo extra predefinido, ej. +$4.000 o +$5.000).
  * Sabor Crunch.
  * Tipo de Queso.
  * Salsa 1 y Salsa 2.
  * Adiciones Extra (Papas a la francesa, Bebidas, etc.).
* **Modalidad de Entrega:** Al finalizar, el cliente seleccionará el método de entrega: Domicilio (calcula costo adicional), Comer en el local, o Pasar a recoger.
* **Pantalla de Confirmación:** Un resumen detallado con el costo total exacto para que el cliente valide su información (Nombre, Celular, Dirección) antes de enviar el pedido a la cocina.

## 3. Panel de Administración (Interfaz de Escritorio)
Un sistema robusto diseñado para usarse en monitores, pensado para la agilidad en la operación del restaurante.

* **Gestión del Menú (Constructor Dinámico):** El administrador tendrá total autonomía para crear, editar o eliminar categorías del formulario, agregar nuevos ingredientes, ocultar productos agotados y modificar precios sin depender de soporte técnico.
* **Tablero de Pedidos (Dashboard):** Recepción de pedidos en tiempo real organizados en una "cola" por orden de llegada mediante tarjetas visuales.
* **Gestión de Tarjetas de Pedido:** Cada tarjeta mostrará la información del cliente y el detalle del consumo. Incluirá botones de acción rápida: "Aceptar Pedido" o "Cancelar".
* **Automatización por WhatsApp:** Al hacer clic en "Aceptar Pedido", el sistema generará y enviará automáticamente un mensaje al WhatsApp del cliente confirmando que su comida está en preparación.
* **Impresión de Comandas:** Botón integrado en cada pedido para generar un formato estandarizado y enviar directamente a la impresora térmica (Ticket físico con datos del cliente y detalle de preparación).
* **Configuraciones Generales:** Módulo para que el administrador actualice el costo base de los domicilios según sea necesario.

## 4. Módulo de Reportes y Analítica
* **Cierre de Caja:** Visualización de la cantidad de pedidos procesados en el día.
* **Ingresos Brutos:** Cálculo del dinero total generado por las ventas a través de la plataforma para facilitar la contabilidad del negocio.

## 5. Próximos Pasos
Una vez aprobado este documento de alcance, el equipo de desarrollo procederá con:
1. Modelado de la Base de Datos (Estructura de tablas para ingredientes, precios dinámicos y pedidos).
2. Diseño de la interfaz gráfica final.
3. Desarrollo del código (Backend en Laravel y Frontend en React).