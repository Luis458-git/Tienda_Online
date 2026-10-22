# Lista de Verificación y Control de Cumplimiento

## Laboratorio #2 · Caso 5: Tienda Online con Inventario, Cupones y Envíos
> **Instrucciones para el desarrollador y el copiloto de IA:**
> Marca con una `[x]` cada tarea conforme quede implementada, probada y validada en el repositorio. Mantén las casillas como `[ ]` mientras estén pendientes.

---

## DÍA 1: Base de Datos y API REST con Reglas de Negocio

### 1. Preparación del Entorno y Base de Datos
- [x] Repositorio configurado con carpetas separadas `backend/` y `frontend/`.
- [x] Archivo `.gitignore` configurado (excluyendo `node_modules` y `.env`).
- [x] Base de datos PostgreSQL creada (`createdb tienda_online`).
- [x] Archivo `backend/database/schema.sql` creado con al menos 3 tablas relacionadas.
- [x] Restricciones `CHECK`, `NOT NULL`, `DEFAULT` y `UNIQUE` aplicadas correctamente en `schema.sql`.
- [x] Llaves foráneas (`REFERENCES`) y políticas de borrado (`ON DELETE`) definidas.
- [x] Archivo `backend/database/seeds.sql` con datos de prueba iniciales (productos, clientes, cupones).
- [x] Script `schema.sql` y `seeds.sql` ejecutados y validados sin errores de sintaxis en PostgreSQL.

### 2. Configuración y Estructura del Backend (Node.js + Express)
- [x] Proyecto backend inicializado (`npm init -y`) con dependencias: `express`, `cors`, `pg`, `dotenv` y `nodemon` (dev).
- [x] Archivo `.env` y `.env.example` configurados (`DATABASE_URL`, `PORT`).
- [x] Conexión a base de datos implementada en `src/config/db.js` usando un `Pool` de `pg`.
- [x] Servidor Express configurado en `src/app.js` con soporte para JSON y CORS.
- [x] Middleware centralizado `src/middlewares/errorHandler.js` respondiendo con `{ error: "mensaje" }`.

### 3. Rutas y Controladores Básicos
- [x] Arquitectura por capas implementada: `routes/`, `controllers/`, `services/`.
- [x] `GET /api/productos`: Retorna catálogo general con filtros de categoría y búsqueda.
- [x] `GET /api/productos/:id`: Retorna detalle de un producto individual (con código 404 si no existe).
- [x] `POST /api/cupones/validar`: Valida si el código existe, vigencia y si el cliente ya lo utilizó.

### 4. Lógica de Negocio y Transacciones ACID (Servicios)
- [x] **Transacción de Orden (`POST /api/ordenes`):**
  - [x] Implementación de `BEGIN`, `COMMIT` y `ROLLBACK` con un cliente del pool (`pool.connect()`).
  - [x] Bloqueo o verificación de stock suficiente para cada producto.
  - [x] Rechazo con código **409 Conflict** si no hay stock suficiente.
  - [x] Validación de cupón en el servidor (vigencia, usos máximos, uso previo por el cliente).
  - [x] Rechazo con código **409 Conflict** si el cupón es inválido o ya fue usado.
  - [x] Cálculo de costo de envío por ciudad (y envío gratuito si supera el umbral establecido).
  - [x] Inserción de la orden en `ordenes`.
  - [x] Inserción de cada ítem en `orden_items`.
  - [x] Registro del consumo en `uso_cupones`.
  - [x] Descuento atómico del inventario en `productos`.
  - [x] Liberación obligatoria del cliente (`client.release()`) en bloque `finally`.
  - [x] Respuesta con código **201 Created**.
- [x] **Cancelación de Orden con Reposición (`PATCH /api/ordenes/:id/cancelar`):**
  - [x] Validación de estado: solo cancelable en `nueva` o `pagada`.
  - [x] Rechazo con código **409 Conflict** si la orden ya está en `enviada` o `entregada`.
  - [x] Transacción con reposición de inventario a la tabla `productos`.
  - [x] Cambio de estado a `cancelada` y respuesta con código **200 OK**.

### 5. Endpoint de Analítica y Métricas
- [x] `GET /api/resumen`: Implementado con consultas SQL de agregación (`SUM`, `COUNT`, `GROUP BY`).
  - [x] Métrica 1: Ventas totales agrupadas por categoría de producto.
  - [x] Métrica 2: Top 3 productos más vendidos por volumen.
  - [x] Métrica 3: Ticket promedio monetario por orden.

### 6. Checkpoint Día 1
- [x] Pruebas realizadas en Thunder Client o Postman para todos los endpoints.
- [x] Respuestas probadas y documentadas para: `200`, `201`, `400`, `404` y `409`.
- [ ] Colección exportada o capturas guardadas en la carpeta `docs/`.
- [ ] Commit y push al repositorio remoto al cierre del Día 1.
- [ ] `BITACORA_IA.md` iniciada con las primeras consultas y ajustes realizados con el copiloto.

---

## DÍA 2: Frontend (React), Integración IA (n8n) y Cierre

### 7. Inicialización y Estructura del Frontend
- [x] Proyecto React creado con Vite (`npm create vite@latest frontend -- --template react`).
- [x] Instalación de dependencias: `react-router-dom`.
- [x] Enrutador configurado con al menos 4 vistas funcionales:
  - [x] Vista 1: Panel / Dashboard (`/`).
  - [x] Vista 2: Catálogo de productos (`/catalogo`).
  - [x] Vista 3: Detalle de producto (`/producto/:id`).
  - [x] Vista 4: Formulario de Checkout / Compra (`/checkout`).
- [x] Componente de navegación global (`Navbar`) para moverse entre vistas.

### 8. Capa de Servicios y Custom Hooks
- [x] Archivo `src/services/api.js` centralizando todas las llamadas `fetch` al backend.
- [x] Custom hook propio implementado (`useFetch`) gestionando:
  - [x] Estado de datos (`data`).
  - [x] Estado de carga (`loading`).
  - [x] Estado de error (`error`).

### 9. Componentes y Vistas del Cliente
- [x] Catálogo con:
  - [x] Búsqueda reactiva por texto.
  - [x] Filtro interactivo por categoría.
  - [x] Criterio de ordenamiento (precio o nombre).
  - [x] Vista de detalle de producto mostrando información técnica y stock en tiempo real.
- [x] Formulario de Checkout controlado:
  - [x] Selección de cliente / ciudad.
  - [x] Cálculo reactivo del costo de envío según ciudad.
  - [x] Campo para ingresar y validar cupón de descuento.
  - [x] Captura visual de errores **400** y **409** enviados por la API sin recargar la página.

### 10. Vista de Métricas
- [x] Vista de Dashboard que consume `GET /api/resumen`.
- [x] Visualización de ventas por categoría, top 3 productos y valor promedio por orden en tarjetas métricas (`MetricCard`).

### 11. Agente de IA en n8n
- [ ] Workflow en n8n creado con nodo **Webhook (POST)** y nodo **AI Agent**.
- [ ] Prompt del agente configurado para generar descripciones persuasivas o sugerencias de productos complementarios.
- [ ] Nodo de respuesta configurado bajo el contrato estricto `{ ok: true, data: { ... }, error: null }`.
- [x] Frontend conectado al Webhook de n8n mediante `src/services/aiService.js`.
- [x] Botón en la interfaz de React para invocar al agente y mostrar su respuesta visualmente.
- [ ] Workflow de n8n exportado en `workflow_n8n.json` (sin credenciales ni API keys).

### 12. Documentación y Entrega Final
- [ ] Archivo `BITACORA_IA.md` completo con al menos 5 registros obligatorios (prompt, respuesta de la IA, ajuste manual).
- [ ] Archivo `README.md` completo:
  - [ ] Descripción del caso elegido.
  - [ ] Diagrama entidad-relación.
  - [ ] Instrucciones paso a paso para levantar la base de datos, backend, frontend y n8n.
  - [ ] Lista de endpoints implementados y reglas de negocio soportadas.
- [ ] Verificación de código limpio: sin secretos en `.env`, sin concatenaciones SQL.
- [ ] Repaso personal para la defensa individual (capacidad de explicar y modificar en vivo cualquier parte del código).