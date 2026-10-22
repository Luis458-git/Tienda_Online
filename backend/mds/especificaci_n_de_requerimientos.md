# Especificación de Requerimientos de Software (SRS)
## Laboratorio #2 · Caso 5: Tienda Online con Inventario, Cupones y Envíos

- **Tipo de proyecto:** Aplicación Web Full-Stack (SPA + REST API + PostgreSQL + Agente n8n)
- **Modalidad:** Individual (2 sesiones de 6 horas)
- **Stack Tecnológico:** Node.js, Express, PostgreSQL, React (Vite), React Router, n8n (AI Agent)

---

## 1. Requerimientos Funcionales (RF)

### 1.1 Módulo de Productos e Inventario
- **RF-01 (Consulta de Catálogo):** La API debe retornar el listado de productos activos con soporte para búsqueda por texto en nombre/descripción, filtro por categoría y ordenamiento (por precio ascendente/descendente o nombre).
- **RF-02 (Detalle de Producto):** La API debe exponer el detalle individual de un producto por su identificador único (`/api/productos/:id`), informando stock en tiempo real.
- **RF-03 (Protección de Stock en Tiempo Real):** El sistema debe rechazar la creación de una orden si la cantidad solicitada de cualquiera de los productos supera el stock disponible en la base de datos.
- **RF-04 (Descuento Atómico de Inventario):** Al confirmar una orden válida, el stock de cada producto incluido debe restarse de manera atómica e indivisible.
- **RF-05 (Reposición por Cancelación):** Si una orden es cancelada de manera exitosa, las cantidades de los productos adquiridos deben devolverse automáticamente al inventario.

### 1.2 Módulo de Cupones de Descuento
- **RF-06 (Validación Integral de Cupón):** La API debe comprobar antes de procesar una orden:
  1. Que el código de cupón exista.
  2. Que la fecha actual no supere la fecha límite (`vigente_hasta >= CURRENT_DATE`).
  3. Que el contador global de canjes no haya superado `usos_maximos`.
  4. Que el cliente autenticado/solicitante no haya utilizado el cupón en compras previas (`uso_cupones`).
- **RF-07 (Cálculo de Descuento):** El descuento aplicable debe corresponder al porcentaje estipulado sobre el subtotal de los productos, sin afectar el costo del envío.
- **RF-08 (Registro de Uso de Cupón):** Al persistir la orden, se debe registrar el consumo del cupón por parte del cliente para inhabilitar futuros intentos de uso.

### 1.3 Módulo de Envíos y Tarifas
- **RF-09 (Cálculo de Envíos por Ciudad):** La API debe calcular el costo de envío con base en la ciudad del cliente:
  - *San José:* ₡2.000 (o $3.50)
  - *Heredia, Alajuela, Cartago:* ₡3.500 (o $6.00)
  - *Otras Ciudades:* ₡5.000 (o $9.00)
- **RF-10 (Umbral de Envío Gratuito):** Si el subtotal de la orden (tras aplicar el cupón de descuento) supera el monto umbral (definido en ₡35.000 o $60.00), el costo de envío se calculará automáticamente en ₡0.

### 1.4 Módulo de Órdenes y Ciclo de Vida
- **RF-11 (Creación de Orden):** Endpoint `POST /api/ordenes` que recibe `cliente_id`, lista de items (`producto_id`, `cantidad`) y código opcional de cupón.
- **RF-12 (Máquina de Estados de Orden):** El flujo de estados permitido es estrictamente:
  $$\text{nueva} \longrightarrow \text{pagada} \longrightarrow \text{enviada} \longrightarrow \text{entregada}$$
  $$\text{nueva o pagada} \longrightarrow \text{cancelada}$$
- **RF-13 (Cancelación Restringida):** Solo se permite cancelar una orden si su estado actual es `nueva` o `pagada`. Si la orden ya está en estado `enviada` o `entregada`, la petición debe ser rechazada.

### 1.5 Módulo de Analítica y Métricas
- **RF-14 (Resumen Gerencial):** Endpoint `GET /api/resumen` calculado mediante agregaciones SQL (`SUM`, `COUNT`, `AVG`, `GROUP BY`) que devuelva:
  1. Ventas netas acumuladas desglosadas por categoría de producto.
  2. Top 3 productos más vendidos (por volumen de unidades).
  3. Ticket promedio monetario por orden.

### 1.6 Módulo de Inteligencia Artificial (n8n Webhook)
- **RF-15 (Generador de Copy Comercial):** El agente de IA debe generar un texto persuasivo y comercial para el producto en función de su nombre, categoría y precio.
- **RF-16 (Recomendador de Productos):** El agente de IA debe analizar los productos que el usuario tiene cargados en el carrito y proponer al menos 2 productos complementarios del catálogo.
- **RF-17 (Contrato de Respuesta del Agente):** Toda llamada al Webhook de n8n debe retornar la estructura:
  ```json
  {
    "ok": true,
    "data": { ... },
    "error": null
  }
  ```

---

## 2. Requerimientos No Funcionales (RNF)

- **RNF-01 (Transaccionalidad ACID):** Todas las operaciones que involucren múltiples escrituras (crear orden + descontar stock + registrar uso de cupón, o cancelar orden + reponer stock) deben ejecutarse dentro de transacciones SQL explícitas (`BEGIN`, `COMMIT`, `ROLLBACK`).
- **RNF-02 (Seguridad contra Inyección SQL):** Queda estrictamente prohibida la concatenación de variables en sentencias SQL. Todas las consultas deben ser parametrizadas con placeholders (`$1, $2, ...`).
- **RNF-03 (Arquitectura por Capas en el Backend):** Separación modular y desacoplada en:
  - `routes/`: Enrutamiento y definición de métodos HTTP.
  - `controllers/`: Extracción de parámetros, invocación de servicios y retorno de códigos HTTP.
  - `services/`: Lógica de negocio, consultas SQL y transacciones.
  - `config/db.js`: Conexión mediante Pool de `pg`.
  - `middlewares/`: Manejador centralizado de errores.
- **RNF-04 (Gestión de Códigos de Estado HTTP):**
  - `200 OK`: Consultas y actualizaciones exitosas.
  - `201 Created`: Creación exitosa de órdenes o recursos.
  - `400 Bad Request`: Parámetros faltantes, formatos no válidos o datos malformados.
  - `404 Not Found`: Identificador de producto o pedido inexistente.
  - `409 Conflict`: Violación de regla de negocio (stock insuficiente, cupón expirado/agotado, orden ya enviada que no se puede cancelar).
- **RNF-05 (Estandarización de Errores):** Cualquier error retornado por la API debe mantener el formato JSON:
  ```json
  { "error": "Descripción legible del problema" }
  ```
- **RNF-06 (Seguridad y Variables de Entorno):** Las credenciales de base de datos, puertos y URLs de webhooks deben cargarse exclusivamente desde archivos `.env`, los cuales deben estar incluidos en el `.gitignore`.
- **RNF-07 (Frontend Reactivo y Desacoplado):** 
  - La interfaz de usuario debe desarrollarse como Single Page Application (SPA) con Vite y React Router.
  - Todas las peticiones HTTP externas deben canalizarse mediante `services/api.js`.
  - Debe usarse un custom hook (`useFetch`) para encapsular estados de carga (`loading`), error (`error`) y datos (`data`).

---

## 3. Modelo de Entidades y Restricciones (DDL)

```
+--------------------+        +--------------------+
|     clientes       |        |      cupones       |
+--------------------+        +--------------------+
| id (PK)            |        | id (PK)            |
| nombre             |        | codigo (UNIQUE)    |
| email (UNIQUE)     |        | porcentaje         |
| ciudad             |        | vigente_hasta      |
+---------+----------+        | usos_maximos       |
          |                   +---------+----------+
          | 1                           | 0..1
          |                             |
          |        +-----------------+  |
          +------->|     ordenes     |<-+
                 N +-----------------+
                   | id (PK)         |
                   | cliente_id (FK) |
                   | cupon_id (FK)   |
                   | estado          |
                   | subtotal        |
                   | descuento       |
                   | envio           |
                   | total           |
                   +--------+--------+
                            | 1
                            |
                            | N
                   +--------v--------+        +--------------------+
                   |   orden_items   |   N    |     productos      |
                   +-----------------+------->+--------------------+
                   | id (PK)         |        | id (PK)            |
                   | orden_id (FK)   |        | nombre             |
                   | producto_id (FK)|        | descripcion        |
                   | cantidad        |        | precio (>= 0)      |
                   | precio_unitario |        | stock (>= 0)       |
                   +-----------------+        | categoria          |
                                              +--------------------+
```

### Restricciones de Base de Datos
1. `productos.precio >= 0` y `productos.stock >= 0`.
2. `cupones.porcentaje > 0 AND cupones.porcentaje <= 100`.
3. `cupones.usos_maximos > 0`.
4. `ordenes.estado IN ('nueva', 'pagada', 'enviada', 'entregada', 'cancelada')`.
5. `orden_items.cantidad > 0`.
6. Tabla pivote `uso_cupones (cliente_id, cupon_id, orden_id, fecha)` para control de uso único.

---

## 4. Matriz de Cobertura de Rutas de la API

| Método | Endpoint | Caso de Éxito | Código Error | Condición de Fallo |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/productos` | `200 OK` (Array de productos) | - | Filtros vacíos devuelven arreglo vacío |
| **GET** | `/api/productos/:id` | `200 OK` (Objeto producto) | `404 Not Found` | Producto no existe en BD |
| **POST** | `/api/cupones/validar` | `200 OK` (Datos cupón y % desc.) | `404 / 409` | No existe, expiró, se agotó o el cliente ya lo usó |
| **POST** | `/api/ordenes` | `201 Created` (Orden e items creados)| `400 / 409` | Datos incompletos (400) o sin stock / cupón inválido (409) |
| **PATCH**| `/api/ordenes/:id/cancelar`| `200 OK` (Orden cancelada y stock restaurado)| `404 / 409` | Orden no existe (404) o estado es enviada/entregada (409) |
| **GET** | `/api/resumen` | `200 OK` (Métricas de ventas) | `500 Server Error` | Falla en consulta de agregación |

---

## 5. Criterios de Aceptación para la Entrega

- [ ] Script `schema.sql` y `seeds.sql` ejecutan sin errores y cargan datos de prueba consistentes.
- [ ] Todas las operaciones de modificación múltiple utilizan `BEGIN`, `COMMIT` y `ROLLBACK`.
- [ ] La colección de Postman/Thunder Client incluye ejecuciones exitosas y casos de prueba que provocan errores `400`, `404` y `409`.
- [ ] El frontend cuenta con al menos 4 vistas activas navegables mediante React Router (`/`, `/catalogo`, `/producto/:id`, `/checkout`).
- [ ] El custom hook implementado maneja reactivamente los estados `data`, `loading` y `error`.
- [ ] El formulario de Checkout captura las respuestas de error `409` del backend y las muestra al usuario sin refrescar la página.
- [ ] El workflow de n8n procesa la solicitud mediante webhook y retorna la respuesta con `{ ok, data, error }`.
- [ ] Archivo `BITACORA_IA.md` documenta al menos 5 interacciones con prompt, respuesta de la IA y corrección manual aplicada.