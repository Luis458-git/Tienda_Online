-- =============================================================================
-- TRABAJO DE EXTENSIÓN: DISEÑO E IMPLEMENTACIÓN DE UNA BASE DE DATOS RELACIONAL
-- ASIGNATURA: BASES DE DATOS RELACIONALES
-- =============================================================================
-- 1. ENCABEZADO OFICIAL
-- Estudiante: Luis Diego Chaves Brenes
-- Caso de Uso: Tienda en Línea (e-commerce) - Caso 5: Tienda Online con Inventario, Cupones y Envíos
-- Fecha: 22 de Octubre de 2026
-- Gestor / Motor: PostgreSQL 17 (Compatible con PostgreSQL / MariaDB / SQL Server)
-- =============================================================================

-- =============================================================================
-- 2. CREATE DATABASE Y CONEXIÓN
-- =============================================================================
-- En PostgreSQL psql:
-- CREATE DATABASE tienda_online;
-- \c tienda_online;

-- Limpieza controlada en orden inverso de dependencias para ejecución idempotente
DROP TABLE IF EXISTS uso_cupones CASCADE;
DROP TABLE IF EXISTS orden_items CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS cupones CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;

-- =============================================================================
-- 3 y 4. CREATE TABLE, PRIMARY KEY, FOREIGN KEY Y RESTRICCIONES
-- 5. Restricciones implementadas: NOT NULL, UNIQUE, CHECK, DEFAULT, AUTO_INCREMENT (SERIAL)
-- 7. Comentarios (--) detallando cada entidad y sus relaciones
-- =============================================================================

-- TABLA 1: productos
-- Tipo de entidad: Entidad Fuerte (Padre).
-- Relaciones:
--   - 1:N hacia orden_items (Un producto puede aparecer en muchas líneas de orden).
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - NOT NULL en nombre, precio, stock, categoria
--   - CHECK (precio >= 0) y CHECK (stock >= 0) para prevenir valores negativos
--   - DEFAULT en stock (0) y creado_en (CURRENT_TIMESTAMP)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 2: clientes
-- Tipo de entidad: Entidad Fuerte (Padre).
-- Relaciones:
--   - 1:N hacia ordenes (Un cliente puede emitir múltiples órdenes de compra).
--   - 1:N hacia uso_cupones (Un cliente puede canjear múltiples cupones distintos).
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - UNIQUE y NOT NULL en email (identificador unívoco del usuario)
--   - NOT NULL en nombre y ciudad
--   - DEFAULT en creado_en
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 3: cupones
-- Tipo de entidad: Entidad Fuerte (Catálogo promocional).
-- Relaciones:
--   - 1:N hacia ordenes (Un cupón puede asociarse a órdenes).
--   - N:M con clientes resuelta mediante la tabla asociativa uso_cupones.
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - UNIQUE en codigo (códigos alfanuméricos únicos como 'DESCUENTO10')
--   - CHECK (porcentaje > 0 AND porcentaje <= 100)
--   - CHECK (usos_maximos > 0)
--   - DEFAULT en usos_maximos (1)
CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    porcentaje NUMERIC(5, 2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    vigente_hasta DATE NOT NULL,
    usos_maximos INT NOT NULL DEFAULT 1 CHECK (usos_maximos > 0),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 4: ordenes
-- Tipo de entidad: Entidad Dependiente / Transaccional.
-- Relaciones:
--   - N:1 con clientes (Cada orden pertenece obligatoriamente a un cliente).
--   - N:1 con cupones (Cada orden puede tener opcionalmente 0 o 1 cupón aplicado).
--   - 1:N hacia orden_items (Una orden contiene 1 o más detalles de productos).
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON UPDATE CASCADE
--   - FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON UPDATE CASCADE
--   - CHECK estado IN ('nueva', 'pagada', 'enviada', 'entregada', 'cancelada')
--   - CHECK subtotal >= 0, descuento >= 0, envio >= 0, total >= 0
--   - DEFAULT estado 'nueva', descuento 0
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE,
    cupon_id INT REFERENCES cupones(id) ON UPDATE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'nueva' CHECK (
        estado IN ('nueva', 'pagada', 'enviada', 'entregada', 'cancelada')
    ),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    descuento NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    envio NUMERIC(10, 2) NOT NULL CHECK (envio >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA 5: orden_items
-- Tipo de entidad: Tabla Intermedia / Detalle de la Relación N:M entre ordenes y productos.
-- Relaciones:
--   - N:1 con ordenes (ON DELETE CASCADE: si se elimina la cabecera, se borran sus líneas).
--   - N:1 con productos (ON UPDATE CASCADE).
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY orden_id REFERENCES ordenes(id) ON DELETE CASCADE
--   - FOREIGN KEY producto_id REFERENCES productos(id)
--   - CHECK (cantidad > 0)
--   - CHECK (precio_unitario >= 0)
CREATE TABLE orden_items (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON UPDATE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);

-- TABLA 6: uso_cupones
-- Tipo de entidad: Tabla Intermedia de la Relación N:M entre clientes y cupones.
-- Relaciones:
--   - N:1 con clientes.
--   - N:1 con cupones.
--   - N:1 con ordenes (ON DELETE CASCADE).
-- Restricciones aplicadas:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY (cliente_id) REFERENCES clientes(id)
--   - FOREIGN KEY (cupon_id) REFERENCES cupones(id)
--   - FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
--   - CONSTRAINT unique_cliente_cupon UNIQUE (cliente_id, cupon_id)
--     (Regla de negocio: Un cliente solo puede utilizar un cupón específico una única vez).
CREATE TABLE uso_cupones (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE,
    cupon_id INT NOT NULL REFERENCES cupones(id) ON UPDATE CASCADE,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cliente_cupon UNIQUE (cliente_id, cupon_id)
);

-- Índices estratégicos para rendimiento de búsquedas y joins
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_ordenes_cliente ON ordenes(cliente_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX idx_orden_items_producto ON orden_items(producto_id);
CREATE INDEX idx_cupones_codigo ON cupones(codigo);

-- =============================================================================
-- 6. INSERCIÓN DE DATOS DE PRUEBA (MÍNIMO 10 REGISTROS POR TABLA)
-- Coherencia matemática y respeto íntegro de integridad referencial
-- =============================================================================

-- 6.1. Clientes (12 registros)
INSERT INTO clientes (nombre, email, ciudad) VALUES
('Juan Pérez', 'juan.perez@example.com', 'San José'),
('María Gómez', 'maria.gomez@example.com', 'Heredia'),
('Carlos Ruiz', 'carlos.ruiz@example.com', 'Alajuela'),
('Ana Solano', 'ana.solano@example.com', 'Cartago'),
('Diego Morales', 'diego.morales@example.com', 'Puntarenas'),
('Sofía Ramírez', 'sofia.ramirez@example.com', 'San José'),
('Elena Castro', 'elena.castro@example.com', 'Guanacaste'),
('Roberto Vargas', 'roberto.vargas@example.com', 'Limón'),
('Valeria Herrera', 'valeria.herrera@example.com', 'Heredia'),
('Alejandro Rojas', 'alejandro.rojas@example.com', 'San José'),
('Camila Navarro', 'camila.navarro@example.com', 'Alajuela'),
('Gabriel Méndez', 'gabriel.mendez@example.com', 'Cartago');

-- 6.2. Productos (12 registros)
INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES
('Teclado Mecánico RGB', 'Teclado mecánico con switches táctiles red y retroiluminación RGB por tecla', 45000.00, 20, 'Periféricos'),
('Mouse Gamer Óptico', 'Mouse ergonómico para gaming con sensor óptico de 16.000 DPI y 6 botones programables', 22000.00, 25, 'Periféricos'),
('Monitor 27 Pulgadas 144Hz', 'Monitor curvo gaming 144Hz 1ms FreeSync con resolución Quad HD', 165000.00, 8, 'Monitores'),
('Headset Inalámbrico Pro', 'Auriculares circumaurales inalámbricos con cancelación activa de ruido y micrófono estéreo', 55000.00, 15, 'Audio'),
('Mouse Pad XL', 'Alfombrilla extendida para mouse y teclado con superficie microtexturizada antideslizante', 12000.00, 35, 'Accesorios'),
('Memoria RAM 16GB DDR4', 'Módulo de memoria RAM 16GB 3200MHz CL16 con disipador de calor de aluminio', 32000.00, 30, 'Componentes'),
('Disco SSD NVMe 1TB', 'Unidad de estado sólido NVMe M.2 con velocidades de lectura de hasta 3500 MB/s', 58000.00, 18, 'Componentes'),
('Laptop Ultrabook 14"', 'Laptop ultra ligera con procesador Core i7, 16GB RAM y 512GB SSD', 520000.00, 6, 'Computadoras'),
('Soporte Ergonómico para Laptop', 'Base de aluminio ajustable en altura y ángulo con ventilación pasiva', 18000.00, 40, 'Accesorios'),
('Cámara Web Full HD 1080p', 'Webcam profesional con micrófono dual estéreo y corrección automática de luz', 28000.00, 22, 'Periféricos'),
('Micrófono Condensador USB', 'Micrófono de estudio cardioide con filtro antipop y soporte antivibración', 38000.00, 14, 'Audio'),
('Cable HDMI 2.1 8K Ultra', 'Cable blindado de alta velocidad 48Gbps con soporte eARC y HDR dinámico', 9500.00, 50, 'Accesorios');

-- 6.3. Cupones (10 registros)
INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos) VALUES
('DESCUENTO10', 10.00, '2026-12-31', 100),
('SUPERTECH20', 20.00, '2026-12-31', 50),
('PROMOEXCLUSIVA50', 50.00, '2026-12-31', 5),
('BIENVENIDA15', 15.00, '2026-12-31', 200),
('GAMING25', 25.00, '2026-12-31', 30),
('CYBERMONDAY30', 30.00, '2026-12-31', 25),
('TECHFAN5', 5.00, '2026-12-31', 500),
('VIPCLIENT12', 12.00, '2026-12-31', 40),
('CUPONVENCIDO', 15.00, '2025-01-01', 50),
('CUPONAGOTADO', 30.00, '2026-12-31', 1);

-- 6.4. Órdenes (11 registros)
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion) VALUES
(1, 1, 'entregada', 67000.00, 6700.00, 0.00, 60300.00, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, NULL, 'pagada', 55000.00, 0.00, 0.00, 55000.00, CURRENT_TIMESTAMP - INTERVAL '12 days'),
(3, 10, 'enviada', 22000.00, 6600.00, 3500.00, 18900.00, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(4, NULL, 'cancelada', 30000.00, 0.00, 3500.00, 33500.00, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(5, 2, 'entregada', 165000.00, 33000.00, 0.00, 132000.00, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(6, 4, 'pagada', 90000.00, 13500.00, 0.00, 76500.00, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(7, 5, 'enviada', 67000.00, 16750.00, 5000.00, 55250.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(8, 6, 'entregada', 58000.00, 17400.00, 5000.00, 45600.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(9, 7, 'pagada', 50000.00, 2500.00, 0.00, 47500.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(10, 8, 'entregada', 520000.00, 62400.00, 0.00, 457600.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(11, 1, 'nueva', 45000.00, 4500.00, 0.00, 40500.00, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 6.5. Ítems de la orden (16 registros)
INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 45000.00),
(1, 2, 1, 22000.00),
(2, 4, 1, 55000.00),
(3, 2, 1, 22000.00),
(4, 5, 1, 12000.00),
(4, 9, 1, 18000.00),
(5, 3, 1, 165000.00),
(6, 6, 1, 32000.00),
(6, 7, 1, 58000.00),
(7, 1, 1, 45000.00),
(7, 2, 1, 22000.00),
(8, 7, 1, 58000.00),
(9, 2, 1, 22000.00),
(9, 10, 1, 28000.00),
(10, 8, 1, 520000.00),
(11, 1, 1, 45000.00);

-- 6.6. Historial de uso de cupones (10 registros)
INSERT INTO uso_cupones (cliente_id, cupon_id, orden_id, fecha_uso) VALUES
(1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(3, 10, 3, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(5, 2, 5, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(6, 4, 6, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(7, 5, 7, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(8, 6, 8, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(9, 7, 9, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(10, 8, 10, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(11, 1, 11, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(2, 3, 2, CURRENT_TIMESTAMP - INTERVAL '12 days');


-- =============================================================================
-- 8. PUNTOS EXTRA: 5 CONSULTAS SELECT CON JOIN QUE DEMUESTRAN QUE LAS RELACIONES FUNCIONAN
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONSULTA 1: FACTURACIÓN Y DETALLE MULTINIVEL DE ÓRDENES
-- Demuestra: Relación 1:N (clientes -> ordenes) y N:M (ordenes -> orden_items -> productos)
-- Tipo de JOIN: INNER JOIN múltiple entre 4 tablas
-- -----------------------------------------------------------------------------
SELECT 
    c.id AS id_cliente,
    c.nombre AS nombre_cliente,
    c.ciudad AS ciudad_entrega,
    o.id AS num_orden,
    o.fecha_creacion::date AS fecha_compra,
    o.estado AS estado_orden,
    p.nombre AS producto_adquirido,
    p.categoria AS categoria_producto,
    oi.cantidad AS unidades_compradas,
    oi.precio_unitario AS precio_unitario_colones,
    (oi.cantidad * oi.precio_unitario) AS subtotal_linea_colones,
    o.descuento AS descuento_aplicado,
    o.envio AS costo_envio,
    o.total AS total_orden_colones
FROM clientes c
INNER JOIN ordenes o ON c.id = o.cliente_id
INNER JOIN orden_items oi ON o.id = oi.orden_id
INNER JOIN productos p ON oi.producto_id = p.id
ORDER BY o.id ASC, oi.id ASC;

-- -----------------------------------------------------------------------------
-- CONSULTA 2: ANÁLISIS DE ACTIVIDAD DE CLIENTES (VALOR DE VIDA DEL CLIENTE - LTV)
-- Demuestra: Relación 1:N (clientes -> ordenes)
-- Tipo de JOIN: LEFT OUTER JOIN con funciones de agregación (COUNT, SUM, COALESCE)
-- -----------------------------------------------------------------------------
SELECT 
    c.id AS id_cliente,
    c.nombre AS cliente,
    c.email,
    c.ciudad,
    COUNT(o.id) AS total_pedidos_registrados,
    COALESCE(SUM(CASE WHEN o.estado != 'cancelada' THEN o.total ELSE 0 END), 0.00) AS gasto_neto_acumulado,
    CASE 
        WHEN COUNT(o.id) = 0 THEN 'Prospecto Inactivo (Sin compras)'
        WHEN COUNT(o.id) >= 2 AND SUM(o.total) > 100000 THEN 'Cliente VIP / Alto Valor'
        ELSE 'Cliente Regular'
    END AS segmento_marketing
FROM clientes c
LEFT JOIN ordenes o ON c.id = o.cliente_id
GROUP BY c.id, c.nombre, c.email, c.ciudad
ORDER BY gasto_neto_acumulado DESC, total_pedidos_registrados DESC;

-- -----------------------------------------------------------------------------
-- CONSULTA 3: AUDITORÍA Y TRAZABILIDAD DE CUPONES PROMOCIONALES (N:M RESUELTA)
-- Demuestra: Relación N:M entre clientes y cupones resuelta con `uso_cupones` y 1:N con `ordenes`
-- Tipo de JOIN: INNER JOIN entre 4 entidades (uso_cupones, clientes, cupones, ordenes)
-- -----------------------------------------------------------------------------
SELECT 
    uc.id AS folio_auditoria_cupon,
    cup.codigo AS codigo_cupon,
    CONCAT(cup.porcentaje, '%') AS porcentaje_descuento,
    c.nombre AS cliente_beneficiario,
    c.email AS correo_cliente,
    o.id AS num_orden_asociada,
    o.subtotal AS subtotal_bruto,
    o.descuento AS monto_descontado_colones,
    o.total AS total_final_facturado,
    uc.fecha_uso AS momento_canje
FROM uso_cupones uc
INNER JOIN clientes c ON uc.cliente_id = c.id
INNER JOIN cupones cup ON uc.cupon_id = cup.id
INNER JOIN ordenes o ON uc.orden_id = o.id
ORDER BY uc.fecha_uso DESC;

-- -----------------------------------------------------------------------------
-- CONSULTA 4: RENDIMIENTO COMERCIAL POR CATEGORÍA Y PRODUCTO CON FILTRO DE VOLUMEN
-- Demuestra: Relación 1:N (productos -> orden_items) y N:1 (orden_items -> ordenes)
-- Tipo de JOIN: INNER JOIN con GROUP BY y cláusula HAVING
-- -----------------------------------------------------------------------------
SELECT 
    p.categoria,
    p.id AS id_producto,
    p.nombre AS nombre_producto,
    p.precio AS precio_catalogo,
    p.stock AS inventario_disponible,
    SUM(oi.cantidad) AS total_unidades_despachadas,
    SUM(oi.cantidad * oi.precio_unitario) AS ingresos_totales_generados
FROM productos p
INNER JOIN orden_items oi ON p.id = oi.producto_id
INNER JOIN ordenes o ON oi.orden_id = o.id
WHERE o.estado != 'cancelada'
GROUP BY p.categoria, p.id, p.nombre, p.precio, p.stock
HAVING SUM(oi.cantidad) >= 2
ORDER BY ingresos_totales_generados DESC, total_unidades_despachadas DESC;

-- -----------------------------------------------------------------------------
-- CONSULTA 5: DETECCIÓN DE STOCK INMOVILIZADO / PRODUCTOS SIN ROTACIÓN (ANTI-JOIN)
-- Demuestra: Relación 1:N (productos -> orden_items)
-- Tipo de JOIN: LEFT OUTER JOIN con cláusula WHERE ... IS NULL
-- -----------------------------------------------------------------------------
SELECT 
    p.id AS id_producto,
    p.nombre AS producto_sin_ventas,
    p.categoria,
    p.precio AS precio_unitario,
    p.stock AS unidades_estancadas,
    (p.precio * p.stock) AS capital_inmovilizado_colones,
    'Sin ventas registradas en órdenes' AS diagnostico_almacen
FROM productos p
LEFT JOIN orden_items oi ON p.id = oi.producto_id
WHERE oi.id IS NULL AND p.stock > 0
ORDER BY capital_inmovilizado_colones DESC;
