-- =============================================================================
-- DATOS INICIALES DE PRUEBA (SEEDS): TIENDA ONLINE (CASO 5)
-- Datos de prueba para validaciones, transacciones y métricas
-- =============================================================================

-- 1. Insertar Clientes en diversas ciudades para validación de políticas de envío
INSERT INTO clientes (nombre, email, ciudad) VALUES
('Juan Pérez', 'juan.perez@example.com', 'San José'),
('María Gómez', 'maria.gomez@example.com', 'Heredia'),
('Carlos Ruiz', 'carlos.ruiz@example.com', 'Alajuela'),
('Ana Solano', 'ana.solano@example.com', 'Cartago'),
('Diego Morales', 'diego.morales@example.com', 'Puntarenas'),
('Sofía Ramírez', 'sofia.ramirez@example.com', 'San José');

-- 2. Insertar Catálogo de Productos Tecnológicos
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
('Cámara Web Full HD 1080p', 'Webcam profesional con micrófono dual estéreo y corrección automática de luz', 28000.00, 22, 'Periféricos');

-- 3. Insertar Cupones de Descuento (Vigentes, Vencidos y Límite de Usos para Pruebas 409)
INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos) VALUES
('DESCUENTO10', 10.00, '2026-12-31', 100),
('SUPERTECH20', 20.00, '2026-12-31', 50),
('PROMOEXCLUSIVA50', 50.00, '2026-12-31', 5),
('CUPONVENCIDO', 15.00, '2025-01-01', 50),  -- Cupón expirado para validar HTTP 409
('CUPONAGOTADO', 30.00, '2026-12-31', 1);    -- Cupón con 1 solo uso para validar límite HTTP 409

-- 4. Insertar Órdenes Históricas de Demostración (para cálculo inmediato de métricas)
-- Orden 1: Juan Pérez (San José) - Entregada con cupón DESCUENTO10
-- 67000 - 10% (6700) = 60300 > 35000 => envío gratis
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion)
VALUES (1, 1, 'entregada', 67000.00, 6700.00, 0.00, 60300.00, CURRENT_TIMESTAMP - INTERVAL '5 days');

INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
(1, 1, 1, 45000.00),
(1, 2, 1, 22000.00);

INSERT INTO uso_cupones (cliente_id, cupon_id, orden_id, fecha_uso)
VALUES (1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Orden 2: María Gómez (Heredia) - Pagada sin cupón
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion)
VALUES (2, NULL, 'pagada', 55000.00, 0.00, 0.00, 55000.00, CURRENT_TIMESTAMP - INTERVAL '3 days');

INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
(2, 4, 1, 55000.00);

-- Orden 3: Carlos Ruiz (Alajuela) - Enviada con CUPONAGOTADO
-- 22000 - 30% (6600) = 15400 + envío Alajuela 3500 = 18900
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion)
VALUES (3, 5, 'enviada', 22000.00, 6600.00, 3500.00, 18900.00, CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
(3, 2, 1, 22000.00);

INSERT INTO uso_cupones (cliente_id, cupon_id, orden_id, fecha_uso)
VALUES (3, 5, 3, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Orden 4: Ana Solano (Cartago) - Nueva (disponible para probar cancelación y reposición)
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion)
VALUES (4, NULL, 'nueva', 30000.00, 0.00, 3500.00, 33500.00, CURRENT_TIMESTAMP);

INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
(4, 5, 1, 12000.00),
(4, 9, 1, 18000.00);
