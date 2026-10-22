-- =============================================================================
-- TRABAJO DE EXTENSIÓN: BASES DE DATOS RELACIONALES
-- PUNTOS EXTRA (RETO EXTRA): 5 CONSULTAS SELECT CON JOIN
-- Caso de Uso: Tienda Online con Inventario, Cupones y Envíos (Caso 5)
-- Estudiante: Luis Diego Chaves Brenes
-- Motor: PostgreSQL 17
-- =============================================================================
-- Estas consultas demuestran el funcionamiento de la integridad referencial,
-- tipos de relaciones (1:N, N:M con tabla intermedia) y diferentes tipos de JOIN
-- (INNER JOIN, LEFT JOIN, agregaciones multirrango y anti-joins).
-- =============================================================================


-- =============================================================================
-- CONSULTA 1: FACTURACIÓN Y DETALLE MULTINIVEL DE ÓRDENES
-- Tipo de Relación Demostrada: 1:N (clientes -> ordenes) y N:M (ordenes -> orden_items -> productos)
-- Tipos de JOIN: INNER JOIN múltiple entre 4 tablas
-- =============================================================================
-- Propósito de Negocio:
--   Genera un reporte consolidado de auditoría fiscal y detalle de compra.
--   Permite comprobar que cada ítem facturado está enlazado a un producto existente,
--   que cada orden pertenece a un cliente real con ciudad identificada, y calcula el
--   subtotal por línea (cantidad * precio_unitario) comparado con el total final pagado.
-- =============================================================================

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



-- =============================================================================
-- CONSULTA 2: ANÁLISIS DE ACTIVIDAD DE CLIENTES (VALOR DE VIDA DEL CLIENTE - LTV)
-- Tipo de Relación Demostrada: 1:N (clientes -> ordenes)
-- Tipos de JOIN: LEFT OUTER JOIN con funciones de agregación (COUNT, SUM, COALESCE)
-- =============================================================================
-- Propósito de Negocio:
--   Demuestra el uso esencial de un LEFT JOIN para evitar la pérdida de registros padre.
--   Clasifica a todos los clientes registrados: aquellos que han generado pedidos recurrentes
--   frente a prospectos registrados que aún no realizan ninguna compra (mostrando ₡0 y 0 órdenes).
--   Filtra órdenes canceladas para que no inflen el gasto neto real acumulado.
-- =============================================================================

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



-- =============================================================================
-- CONSULTA 3: AUDITORÍA Y TRAZABILIDAD DE CUPONES PROMOCIONALES (N:M RESUELTA)
-- Tipo de Relación Demostrada: N:M entre clientes y cupones resuelta mediante `uso_cupones`
--                             y 1:N vinculada con `ordenes`
-- Tipos de JOIN: INNER JOIN entre 4 entidades (uso_cupones, clientes, cupones, ordenes)
-- =============================================================================
-- Propósito de Negocio:
--   Valida el cumplimiento estricto de la regla de negocio de uso único de cupón por cliente
--   (garantizada por la restricción UNIQUE(cliente_id, cupon_id) en uso_cupones).
--   Permite al departamento financiero auditar los descuentos aplicados, qué cliente se benefició,
--   cuál cupón fue canjeado, el porcentaje de descuento y la orden en la cual se efectuó la rebaja.
-- =============================================================================

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



-- =============================================================================
-- CONSULTA 4: RENDIMIENTO COMERCIAL POR CATEGORÍA Y PRODUCTO CON FILTRO DE VOLUMEN
-- Tipo de Relación Demostrada: 1:N (productos -> orden_items) y N:1 (orden_items -> ordenes)
-- Tipos de JOIN: INNER JOIN con GROUP BY y cláusula HAVING
-- =============================================================================
-- Propósito de Negocio:
--   Inteligencia de negocios para el control de inventario y reabastecimiento.
--   Calcula las unidades totales vendidas e ingresos monetarios por producto únicamente
--   en órdenes confirmadas (excluyendo cancelaciones).
--   Aplica un filtro con HAVING para aislar productos con rotación destacada (>= 2 unidades).
-- =============================================================================

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



-- =============================================================================
-- CONSULTA 5: DETECCIÓN DE STOCK INMOVILIZADO / PRODUCTOS SIN ROTACIÓN (ANTI-JOIN)
-- Tipo de Relación Demostrada: 1:N (productos -> orden_items)
-- Tipos de JOIN: LEFT OUTER JOIN con cláusula WHERE ... IS NULL
-- =============================================================================
-- Propósito de Negocio:
--   Diagnóstico logístico de bodega. Emplea un anti-join mediante LEFT JOIN
--   para encontrar productos que existen en inventario físico (stock > 0) pero
--   que NUNCA han sido incluidos en ninguna orden de compra por los clientes.
--   Calcula el capital financiero retenido para priorizarlos en promociones con el Agente de IA.
-- =============================================================================

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
