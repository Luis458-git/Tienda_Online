-- =============================================================================
-- DATOS INICIALES DE PRUEBA (SEEDS): TIENDA ONLINE (CASO 5)
-- Cumplimiento estricto: Mínimo 10 registros por tabla con INSERT INTO
-- Coherencia matemática y respeto íntegro de llaves foráneas y reglas de negocio
-- =============================================================================

-- Limpieza previa respetando restricciones en cascada
TRUNCATE TABLE uso_cupones, orden_items, ordenes, cupones, clientes, productos RESTART IDENTITY CASCADE;

-- =============================================================================
-- 1. TABLA: clientes (12 registros >= 10 requerido)
-- =============================================================================
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
('Gabriel Méndez', 'gabriel.mendez@example.com', 'Cartago'); -- Cliente prospecto sin compras para LEFT JOIN

-- =============================================================================
-- 2. TABLA: productos (12 registros >= 10 requerido)
-- =============================================================================
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
('Cable HDMI 2.1 8K Ultra', 'Cable blindado de alta velocidad 48Gbps con soporte eARC y HDR dinámico', 9500.00, 50, 'Accesorios'); -- Producto sin ventas para anti-join

-- =============================================================================
-- 3. TABLA: cupones (10 registros >= 10 requerido)
-- =============================================================================
INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos) VALUES
('DESCUENTO10', 10.00, '2026-12-31', 100),
('SUPERTECH20', 20.00, '2026-12-31', 50),
('PROMOEXCLUSIVA50', 50.00, '2026-12-31', 5),
('BIENVENIDA15', 15.00, '2026-12-31', 200),
('GAMING25', 25.00, '2026-12-31', 30),
('CYBERMONDAY30', 30.00, '2026-12-31', 25),
('TECHFAN5', 5.00, '2026-12-31', 500),
('VIPCLIENT12', 12.00, '2026-12-31', 40),
('CUPONVENCIDO', 15.00, '2025-01-01', 50),  -- Para pruebas de error de negocio 409
('CUPONAGOTADO', 30.00, '2026-12-31', 1);   -- Límite 1 uso para pruebas 409

-- =============================================================================
-- 4. TABLA: ordenes (11 registros >= 10 requerido)
-- =============================================================================
-- Reglas de negocio:
--   envio: San José ₡0 (si subtotal >= ₡35000) o ₡2500; GAM ₡3500; Rural ₡5000.
--   descuento = subtotal * (porcentaje / 100)
--   total = subtotal - descuento + envio
INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion) VALUES
-- Orden 1: Juan Pérez (San José) con DESCUENTO10 (10%)
(1, 1, 'entregada', 67000.00, 6700.00, 0.00, 60300.00, CURRENT_TIMESTAMP - INTERVAL '15 days'),
-- Orden 2: María Gómez (Heredia) sin cupón
(2, NULL, 'pagada', 55000.00, 0.00, 0.00, 55000.00, CURRENT_TIMESTAMP - INTERVAL '12 days'),
-- Orden 3: Carlos Ruiz (Alajuela) con CUPONAGOTADO (30%)
(3, 10, 'enviada', 22000.00, 6600.00, 3500.00, 18900.00, CURRENT_TIMESTAMP - INTERVAL '10 days'),
-- Orden 4: Ana Solano (Cartago) sin cupón (cancelada)
(4, NULL, 'cancelada', 30000.00, 0.00, 3500.00, 33500.00, CURRENT_TIMESTAMP - INTERVAL '8 days'),
-- Orden 5: Diego Morales (Puntarenas) con SUPERTECH20 (20%)
(5, 2, 'entregada', 165000.00, 33000.00, 0.00, 132000.00, CURRENT_TIMESTAMP - INTERVAL '7 days'),
-- Orden 6: Sofía Ramírez (San José) con BIENVENIDA15 (15%)
(6, 4, 'pagada', 90000.00, 13500.00, 0.00, 76500.00, CURRENT_TIMESTAMP - INTERVAL '6 days'),
-- Orden 7: Elena Castro (Guanacaste) con GAMING25 (25%)
(7, 5, 'enviada', 67000.00, 16750.00, 5000.00, 55250.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
-- Orden 8: Roberto Vargas (Limón) con CYBERMONDAY30 (30%)
(8, 6, 'entregada', 58000.00, 17400.00, 5000.00, 45600.00, CURRENT_TIMESTAMP - INTERVAL '4 days'),
-- Orden 9: Valeria Herrera (Heredia) con TECHFAN5 (5%)
(9, 7, 'pagada', 50000.00, 2500.00, 0.00, 47500.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
-- Orden 10: Alejandro Rojas (San José) con VIPCLIENT12 (12%)
(10, 8, 'entregada', 520000.00, 62400.00, 0.00, 457600.00, CURRENT_TIMESTAMP - INTERVAL '2 days'),
-- Orden 11: Camila Navarro (Alajuela) con DESCUENTO10 (10%)
(11, 1, 'nueva', 45000.00, 4500.00, 0.00, 40500.00, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- =============================================================================
-- 5. TABLA: orden_items (15 registros >= 10 requerido)
-- =============================================================================
INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
-- Orden 1 items (subtotal = 45000 + 22000 = 67000)
(1, 1, 1, 45000.00),
(1, 2, 1, 22000.00),
-- Orden 2 items (subtotal = 55000)
(2, 4, 1, 55000.00),
-- Orden 3 items (subtotal = 22000)
(3, 2, 1, 22000.00),
-- Orden 4 items (subtotal = 12000 + 18000 = 30000)
(4, 5, 1, 12000.00),
(4, 9, 1, 18000.00),
-- Orden 5 items (subtotal = 165000)
(5, 3, 1, 165000.00),
-- Orden 6 items (subtotal = 32000 + 58000 = 90000)
(6, 6, 1, 32000.00),
(6, 7, 1, 58000.00),
-- Orden 7 items (subtotal = 45000 + 22000 = 67000)
(7, 1, 1, 45000.00),
(7, 2, 1, 22000.00),
-- Orden 8 items (subtotal = 58000)
(8, 7, 1, 58000.00),
-- Orden 9 items (subtotal = 22000 + 28000 = 50000)
(9, 2, 1, 22000.00),
(9, 10, 1, 28000.00),
-- Orden 10 items (subtotal = 520000)
(10, 8, 1, 520000.00),
-- Orden 11 items (subtotal = 45000)
(11, 1, 1, 45000.00);

-- =============================================================================
-- 6. TABLA: uso_cupones (10 registros >= 10 requerido)
-- =============================================================================
-- Cumple con UNIQUE (cliente_id, cupon_id)
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
