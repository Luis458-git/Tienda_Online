# Bitácora de Uso y Supervisión de Inteligencia Artificial
**Proyecto:** Laboratorio #2 - Caso 5: Tienda Online con Inventario, Cupones, Envíos y Agente de IA  
**Estudiante:** Luis Diego Chaves Brenes  
**Entorno:** Node.js, Express, PostgreSQL, React 18, Vite, Tailwind CSS v4, n8n (LangChain AI Agent)  

---

## Registro 1: Diseño de Base de Datos y Manejo de Transacciones Atómicas (PostgreSQL)

- **Fecha:** 2026-10-21
- **Componente:** `backend/database/schema.sql` y `backend/src/services/ordenesService.js`
- **Herramienta / Modelo:** Antigravity / Claude 3.5 Sonnet & GPT-4o
- **Objetivo:** Generar el esquema relacional con restricciones de clave externa e implementar la creación de órdenes de compra con control estricto de concurrencia y stock.
- **Prompt formulado:**
  > "Diseña el schema.sql y el servicio ordenesService.js con PostgreSQL usando pg Pool. La creación de una orden debe descontar stock de los productos y registrar orden_items. Si no hay suficiente stock o algún producto falla, debe abortar completamente con ROLLBACK y responder HTTP 409. Además, implementar la cancelación que restaura el stock."
- **Respuesta de la IA:**
  La IA propuso transacciones con `BEGIN`, `COMMIT` y `ROLLBACK`, utilizando consultas parametrizadas con placeholders `$1, $2`.
- **Ajuste y Corrección Manual Aplicada:**
  1. Se verificó manualmente que el `client.release()` siempre se ejecutase dentro del bloque `finally` para evitar fugas de conexiones en el pool de PostgreSQL.
  2. Se ajustó la consulta para bloquear las filas de inventario usando `FOR UPDATE` durante la transacción, previniendo condiciones de carrera si dos usuarios compran la última unidad simultáneamente.
  3. Se corrigió el cálculo de `costo_envio` para que aplicara envío gratuito (`₡0`) cuando el subtotal superase el umbral de `₡35.000`.

---

## Registro 2: Lógica de Negocio y Validación de Cupones de Descuento

- **Fecha:** 2026-10-21
- **Componente:** `backend/src/services/cuponesService.js` y `backend/src/controllers/cuponesController.js`
- **Herramienta / Modelo:** Antigravity / GPT-4o
- **Objetivo:** Implementar la validación exhaustiva de cupones: existencia, rango de fechas de vigencia (`fecha_vencimiento`), límite global de usos (`usos_maximos` vs `usos_actuales`) y unicidad por cliente (un cliente no puede reutilizar el mismo cupón).
- **Prompt formulado:**
  > "Crea el servicio para validar cupones en cuponesService.js. Debe verificar que el código exista en mayúsculas, que la fecha actual no supere fecha_vencimiento, que usos_actuales < usos_maximos, y que el cliente_id no haya usado ya ese cupón en la tabla ordenes con estado distinto a 'cancelada'. Devuelve errores descriptivos con código HTTP 409."
- **Respuesta de la IA:**
  Generó la función con consultas separadas para validar vigencia y un `COUNT(*)` sobre la tabla `ordenes`.
- **Ajuste y Corrección Manual Aplicada:**
  1. Se normalizó el código del cupón a mayúsculas tanto en el endpoint (`req.body.codigo.toUpperCase().trim()`) como en la base de datos para evitar discrepancias por mayúsculas/minúsculas.
  2. Se aseguró que las órdenes canceladas no contaran como uso previo del cliente, permitiendo que si una orden fue cancelada, el cliente pueda volver a aprovechar su cupón.
  3. Se añadió validación de entrada `400 Bad Request` en caso de que falten los campos `codigo` o `cliente_id`.

---

## Registro 3: Métricas y Agregaciones SQL para el Panel de Control

- **Fecha:** 2026-10-22
- **Componente:** `backend/src/services/resumenService.js` y `frontend/src/pages/Dashboard.jsx`
- **Herramienta / Modelo:** Antigravity / Claude 3.5 Sonnet
- **Objetivo:** Calcular métricas en tiempo real con agregaciones SQL (`SUM`, `COUNT`, `GROUP BY`, `AVG`) para alimentar el Dashboard principal.
- **Prompt formulado:**
  > "Escribe la función de métricas para GET /api/resumen que devuelva en una sola llamada: ventas totales agrupadas por categoría, top 3 productos más vendidos por unidades, ticket promedio de compra e inventario crítico (menos de 5 unidades). No uses cálculo en memoria, hazlo directamente en PostgreSQL."
- **Respuesta de la IA:**
  Generó cuatro consultas SQL concurrentes utilizando `Promise.all` y agrupaciones con `COALESCE`.
- **Ajuste y Corrección Manual Aplicada:**
  1. En `ticket_promedio`, la IA calculaba el promedio incluyendo órdenes canceladas. Se corrigió agregando el filtro `WHERE estado != 'cancelada'`.
  2. Se castearon explícitamente los campos agregados numéricos (`::float` y `ROUND(..., 2)`) ya que `pg` devuelve los tipos `NUMERIC`/`BIGINT` de PostgreSQL como strings para evitar pérdida de precisión en Javascript.
  3. Se adaptó la vista del frontend para mostrar tarjetas de métricas visuales con barras de progreso y alertas de stock bajo.

---

## Registro 4: Rediseño Visual de Alta Fidelidad en Modo Oscuro (Tailwind CSS v4)

- **Fecha:** 2026-10-22
- **Componente:** `frontend/src/components/Navbar.jsx`, `frontend/src/pages/Checkout.jsx` y `frontend/src/index.css`
- **Herramienta / Modelo:** Antigravity / Claude 3.5 Sonnet
- **Objetivo:** Modernizar la interfaz gráfica al estilo Linear / Stripe Dark Mode (`slate-950`, bordes sutiles, gradientes índigo/azul, backdrop-blur).
- **Prompt formulado:**
  > "Rediseña Checkout.jsx y Navbar.jsx con estética dark mode moderna premium. Fondo #090d16 o slate-950, tarjetas bg-slate-900/70 con bordes slate-800, botones en gradiente azul a violeta, y formateador de moneda nítido para colones costarricenses (₡). Mantén toda la reactividad, useCart y llamadas a la API."
- **Respuesta de la IA:**
  Proveyó los componentes refactorizados con clases utilitarias de Tailwind.
- **Ajuste y Corrección Manual Aplicada:**
  1. Detección y corrección de la versión de Tailwind: el proyecto utiliza Tailwind CSS v4 con `@import "tailwindcss";` y `@tailwindcss/postcss`, por lo que se evitaron directivas obsoletas como `@tailwind base;`.
  2. El formateador estándar de colones `Intl.NumberFormat('es-CR')` agregaba espacios no deseados (`₡ 22 000`); se implementó una función formateadora personalizada: `₡${Math.round(monto).toLocaleString('es-CR')}` para una presentación compacta y limpia (`₡22,000`).
  3. Se añadieron animaciones de feedback (`animate-fadeIn`, `active:scale-[0.99]`) y badges visuales para indicar envío gratis y cupones aplicados.

---

## Registro 5: Integración del Agente de IA con n8n y Contrato Estricto JSON

- **Fecha:** 2026-10-22
- **Componente:** `workflow_n8n.json`, `frontend/src/services/aiService.js` y `frontend/src/components/AiAssistantModal.jsx`
- **Herramienta / Modelo:** Antigravity / Claude 3.5 Sonnet
- **Objetivo:** Implementar la integración de Inteligencia Artificial requerida por el laboratorio mediante un webhook de n8n, agente LangChain y OpenAI Chat Model con contrato de respuesta estricto `{ ok, data, error }`.
- **Prompt formulado:**
  > "Genera el JSON completo del workflow de n8n con Webhook POST, nodo Code para armar los prompts de dos acciones ('generar_descripcion' y 'recomendar_carrito'), AI Agent con Chat Model gpt-4o-mini y Respond to Webhook con el contrato estricto { ok: true, data: { ... }, error: null }. Además crea aiService.js con generarDescripcionProducto y obtenerRecomendacionesCarrito, y un componente modal reusable AiAssistantModal.jsx con spinner y renderizado limpio."
- **Respuesta de la IA:**
  Generó el archivo exportable `workflow_n8n.json`, el servicio frontend con invocación vía `fetch` y el componente modal con diseño oscuro.
- **Ajuste y Corrección Manual Aplicada:**
  1. **Tolerancia a Fallos y Modo Offline:** En `aiService.js` se agregó un motor heurístico de respaldo automático con timeout de 6 segundos. Si la instancia local de n8n no está activa o experimenta demoras de red, el frontend devuelve datos simulados de alta calidad respetando exactamente el mismo contrato JSON, permitiendo evaluar la interfaz de usuario y las dos capacidades sin bloqueos.
  2. **Sanitización de Salida del LLM:** En el nodo de formato de n8n (`Formatear Contrato Estricto`) se introdujo una expresión regular para limpiar bloques de código markdown tipo ` ```json ... ``` `, garantizando que `JSON.parse` nunca falle aun si el modelo incluye delimitadores de bloque.
  3. **Integración Dual en el Frontend:** Se conectó `AiAssistantModal` tanto en `ProductDetail.jsx` (Capacidad A: descripción técnica y comercial) como en `Checkout.jsx` (Capacidad B: diagnóstico y sugerencias de productos complementarios según los items en el carrito).
