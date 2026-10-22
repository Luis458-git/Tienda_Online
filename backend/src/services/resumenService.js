const pool = require('../config/db');

/**
 * Servicio de métricas analíticas para el panel Dashboard.
 * Utiliza funciones de agregación SQL (SUM, COUNT, AVG, GROUP BY).
 */
async function obtenerResumenMetricas() {
    // 1. Consulta de Métricas Globales y Ticket Promedio
    const kpisQuery = `
        SELECT 
            COUNT(id)::int AS total_ordenes,
            COALESCE(ROUND(AVG(CASE WHEN estado != 'cancelada' THEN total END), 2), 0.00)::numeric(10,2) AS ticket_promedio,
            COALESCE(SUM(CASE WHEN estado != 'cancelada' THEN total ELSE 0 END), 0.00)::numeric(10,2) AS ingreso_total,
            COALESCE(SUM(CASE WHEN estado = 'entregada' THEN 1 ELSE 0 END), 0)::int AS ordenes_entregadas,
            COALESCE(SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END), 0)::int AS ordenes_canceladas,
            COALESCE(SUM(CASE WHEN estado IN ('nueva', 'pagada', 'enviada') THEN 1 ELSE 0 END), 0)::int AS ordenes_activas
        FROM ordenes;
    `;

    // 2. Consulta de Ventas Agrupadas por Categoría
    const ventasPorCategoriaQuery = `
        SELECT 
            p.categoria,
            COUNT(DISTINCT o.id)::int AS ordenes_asociadas,
            COALESCE(SUM(oi.cantidad), 0)::int AS unidades_vendidas,
            COALESCE(SUM(oi.cantidad * oi.precio_unitario), 0.00)::numeric(10,2) AS total_ventas
        FROM orden_items oi
        JOIN productos p ON oi.producto_id = p.id
        JOIN ordenes o ON oi.orden_id = o.id
        WHERE o.estado != 'cancelada'
        GROUP BY p.categoria
        ORDER BY total_ventas DESC;
    `;

    // 3. Consulta de los 3 Productos Más Vendidos
    const top3ProductosQuery = `
        SELECT 
            p.id,
            p.nombre,
            p.categoria,
            p.precio,
            COALESCE(SUM(oi.cantidad), 0)::int AS unidades_vendidas,
            COALESCE(SUM(oi.cantidad * oi.precio_unitario), 0.00)::numeric(10,2) AS ingresos_generados
        FROM orden_items oi
        JOIN productos p ON oi.producto_id = p.id
        JOIN ordenes o ON oi.orden_id = o.id
        WHERE o.estado != 'cancelada'
        GROUP BY p.id, p.nombre, p.categoria, p.precio
        ORDER BY unidades_vendidas DESC, ingresos_generados DESC
        LIMIT 3;
    `;

    // Ejecución paralela de las consultas de agregación para optimizar latencia
    const [kpisRes, categoriasRes, top3Res] = await Promise.all([
        pool.query(kpisQuery),
        pool.query(ventasPorCategoriaQuery),
        pool.query(top3ProductosQuery)
    ]);

    const kpis = kpisRes.rows[0] || {
        total_ordenes: 0,
        ticket_promedio: 0,
        ingreso_total: 0,
        ordenes_entregadas: 0,
        ordenes_canceladas: 0,
        ordenes_activas: 0
    };

    return {
        kpis: {
            total_ordenes: parseInt(kpis.total_ordenes, 10),
            ticket_promedio: parseFloat(kpis.ticket_promedio),
            ingreso_total: parseFloat(kpis.ingreso_total),
            ordenes_entregadas: parseInt(kpis.ordenes_entregadas, 10),
            ordenes_canceladas: parseInt(kpis.ordenes_canceladas, 10),
            ordenes_activas: parseInt(kpis.ordenes_activas, 10)
        },
        ventas_por_categoria: categoriasRes.rows.map(row => ({
            categoria: row.categoria,
            ordenes_asociadas: parseInt(row.ordenes_asociadas, 10),
            unidades_vendidas: parseInt(row.unidades_vendidas, 10),
            total_ventas: parseFloat(row.total_ventas)
        })),
        top_productos: top3Res.rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            categoria: row.categoria,
            precio: parseFloat(row.precio),
            unidades_vendidas: parseInt(row.unidades_vendidas, 10),
            ingresos_generados: parseFloat(row.ingresos_generados)
        }))
    };
}

module.exports = {
    obtenerResumenMetricas
};
