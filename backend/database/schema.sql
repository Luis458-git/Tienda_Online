-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: TIENDA ONLINE (CASO 5)
-- PostgreSQL DDL con Integridad Referencial y Restricciones CHECK
-- =============================================================================

DROP TABLE IF EXISTS uso_cupones CASCADE;
DROP TABLE IF EXISTS orden_items CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS cupones CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;

-- 1. Tabla de Productos (con validación de precio y stock no negativos)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categoria VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes (email único y obligatorio)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Cupones de Descuento (código único, porcentaje entre 1 y 100)
CREATE TABLE cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    porcentaje NUMERIC(5, 2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    vigente_hasta DATE NOT NULL,
    usos_maximos INT NOT NULL DEFAULT 1 CHECK (usos_maximos > 0),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Órdenes de Compra
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE,
    cupon_id INT REFERENCES cupones(id) ON UPDATE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'nueva' CHECK (
        estado IN ('nueva', 'pagada', 'enviada', 'entregada', 'cancelada')
    ),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),          -- Suma bruta de items
    descuento NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (descuento >= 0), -- Monto descontado por cupón
    envio NUMERIC(10, 2) NOT NULL CHECK (envio >= 0),
    -- total = subtotal - descuento + envio
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Ítems de la Orden (detalle con ON DELETE CASCADE a ordenes)
CREATE TABLE orden_items (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON UPDATE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);

-- 6. Historial de Uso de Cupones (Garantiza unicidad de cupón por cliente)
CREATE TABLE uso_cupones (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON UPDATE CASCADE,
    cupon_id INT NOT NULL REFERENCES cupones(id) ON UPDATE CASCADE,
    orden_id INT NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cliente_cupon UNIQUE (cliente_id, cupon_id)
);

-- Índices estratégicos para optimización de consultas frecuentes
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_ordenes_cliente ON ordenes(cliente_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX idx_orden_items_producto ON orden_items(producto_id);
CREATE INDEX idx_cupones_codigo ON cupones(codigo);
