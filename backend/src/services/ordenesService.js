const pool = require('../config/db');
const { validarCupon } = require('./cuponesService');

/**
 * Normaliza y calcula el costo de envío según la ciudad de destino y el subtotal neto.
 * Regla de negocio:
 * - San José: ₡2.000
 * - Heredia, Alajuela, Cartago: ₡3.500
 * - Otras ciudades: ₡5.000
 * - Envío Gratuito: Subtotal neto > ₡35.000
 */
function calcularEnvio(ciudad, subtotalNeto) {
    if (subtotalNeto > 35000) {
        return 0.00;
    }

    const ciudadNormalizada = (ciudad || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (ciudadNormalizada === 'san jose') {
        return 2000.00;
    }
    if (['heredia', 'alajuela', 'cartago'].includes(ciudadNormalizada)) {
        return 3500.00;
    }
    return 5000.00;
}

/**
 * Crea una nueva orden de compra ejecutando un bloque transaccional atómico.
 * Valida stock con bloqueo FOR UPDATE, valida cupones y descuenta stock.
 */
async function crearOrden({ cliente_id, cupon_codigo, items }) {
    if (!cliente_id || !Array.isArray(items) || items.length === 0) {
        const error = new Error('cliente_id y una lista no vacía de items son obligatorios');
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Validar existencia del cliente y obtener su ciudad
        const clienteRes = await client.query(
            'SELECT id, nombre, email, ciudad FROM clientes WHERE id = $1',
            [cliente_id]
        );

        if (clienteRes.rows.length === 0) {
            const error = new Error(`El cliente con ID ${cliente_id} no existe`);
            error.statusCode = 404;
            throw error;
        }

        const cliente = clienteRes.rows[0];

        // 2. Extraer IDs de productos y validar duplicados o cantidades inválidas
        const productMap = new Map();
        for (const item of items) {
            const productoId = Number(item.producto_id);
            const cantidad = Number(item.cantidad);
            if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
                const error = new Error('Cada ítem debe contener producto_id y una cantidad entera mayor a 0');
                error.statusCode = 400;
                throw error;
            }
            // Se agrupan cantidades si el mismo producto viene repetido
            productMap.set(productoId, (productMap.get(productoId) || 0) + cantidad);
        }

        const productIds = Array.from(productMap.keys());

        // 3. Bloqueo pesimista (FOR UPDATE) para garantizar consistencia de inventario concurrente
        const productosRes = await client.query(
            'SELECT id, nombre, precio, stock FROM productos WHERE id = ANY($1::int[]) FOR UPDATE',
            [productIds]
        );

        if (productosRes.rows.length !== productIds.length) {
            const error = new Error('Uno o más productos solicitados no existen en el catálogo');
            error.statusCode = 404;
            throw error;
        }

        // 4. Validar disponibilidad de stock y calcular subtotal bruto
        let subtotal = 0;
        const productosDbMap = new Map();

        for (const prod of productosRes.rows) {
            const cantidadSolicitada = productMap.get(prod.id);
            if (prod.stock < cantidadSolicitada) {
                const error = new Error(
                    `Stock insuficiente para el producto '${prod.nombre}'. Disponible: ${prod.stock}, solicitado: ${cantidadSolicitada}`
                );
                error.statusCode = 409; // Conflicto de regla de negocio
                throw error;
            }

            productosDbMap.set(prod.id, prod);
            subtotal += parseFloat(prod.precio) * cantidadSolicitada;
        }

        // 5. Validar cupón de descuento si fue suministrado (bloqueando la fila del cupón
        //    con FOR UPDATE para que dos órdenes simultáneas no superen usos_maximos)
        let cuponId = null;
        let porcentajeDescuento = 0;

        if (cupon_codigo && String(cupon_codigo).trim() !== '') {
            const cupon = await validarCupon(client, cupon_codigo, cliente.id, {
                bloquear: true,
                statusInexistente: 409
            });
            cuponId = cupon.id;
            porcentajeDescuento = cupon.porcentaje;
        }

        // 6. Cálculos financieros: el descuento aplica solo al subtotal, no al envío (RF-07)
        const descuentoMonto = parseFloat((subtotal * (porcentajeDescuento / 100)).toFixed(2));
        const subtotalNeto = subtotal - descuentoMonto;
        const costoEnvio = calcularEnvio(cliente.ciudad, subtotalNeto);
        const total = parseFloat((subtotalNeto + costoEnvio).toFixed(2));

        // 7. Insertar registro cabecera de la Orden
        const ordenInsertRes = await client.query(
            `INSERT INTO ordenes (cliente_id, cupon_id, estado, subtotal, descuento, envio, total)
             VALUES ($1, $2, 'nueva', $3, $4, $5, $6)
             RETURNING id, cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion`,
            [cliente.id, cuponId, subtotal, descuentoMonto, costoEnvio, total]
        );

        const nuevaOrden = ordenInsertRes.rows[0];

        // 8. Insertar ítems de la orden y descontar inventario
        const itemsInsertados = [];
        for (const [productoId, cantidad] of productMap.entries()) {
            const prod = productosDbMap.get(productoId);
            const precioUnitario = parseFloat(prod.precio);

            const itemRes = await client.query(
                `INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, orden_id, producto_id, cantidad, precio_unitario`,
                [nuevaOrden.id, productoId, cantidad, precioUnitario]
            );

            itemsInsertados.push({
                ...itemRes.rows[0],
                nombre: prod.nombre
            });

            // Descontar inventario en productos
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [cantidad, productoId]
            );
        }

        // 9. Registrar uso del cupón si aplica
        if (cuponId) {
            await client.query(
                `INSERT INTO uso_cupones (cliente_id, cupon_id, orden_id)
                 VALUES ($1, $2, $3)`,
                [cliente.id, cuponId, nuevaOrden.id]
            );
        }

        // Confirmar transacción
        await client.query('COMMIT');

        return {
            ...nuevaOrden,
            descuento_porcentaje: porcentajeDescuento,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                email: cliente.email,
                ciudad: cliente.ciudad
            },
            items: itemsInsertados
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Cancela una orden si su estado es 'nueva' o 'pagada' y repone el stock.
 * Si ya fue 'enviada' o 'entregada', rechaza la operación con código HTTP 409.
 */
async function cancelarOrden(ordenId) {
    const id = parseInt(ordenId, 10);
    if (!id || isNaN(id)) {
        const error = new Error('El ID de orden debe ser un número entero válido');
        error.statusCode = 400;
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener la orden con bloqueo FOR UPDATE
        const ordenRes = await client.query(
            'SELECT id, cliente_id, estado, total FROM ordenes WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (ordenRes.rows.length === 0) {
            const error = new Error(`Orden con ID ${id} no encontrada`);
            error.statusCode = 404;
            throw error;
        }

        const orden = ordenRes.rows[0];

        // 2. Regla de negocio crítica: verificación de estado
        if (['enviada', 'entregada'].includes(orden.estado)) {
            const error = new Error('No es posible cancelar una orden que ya ha sido despachada');
            error.statusCode = 409;
            throw error;
        }

        if (orden.estado === 'cancelada') {
            const error = new Error('La orden ya se encuentra en estado cancelada');
            error.statusCode = 409;
            throw error;
        }

        // 3. Consultar los ítems asociados a la orden para reponer inventario
        const itemsRes = await client.query(
            'SELECT producto_id, cantidad FROM orden_items WHERE orden_id = $1',
            [id]
        );

        // 4. Reponer stock atómicamente por cada ítem
        for (const item of itemsRes.rows) {
            await client.query(
                'UPDATE productos SET stock = stock + $1 WHERE id = $2',
                [item.cantidad, item.producto_id]
            );
        }

        // 5. Actualizar estado de la orden a 'cancelada'
        const updatedOrdenRes = await client.query(
            `UPDATE ordenes
             SET estado = 'cancelada'
             WHERE id = $1
             RETURNING id, cliente_id, cupon_id, estado, subtotal, descuento, envio, total, fecha_creacion`,
            [id]
        );

        await client.query('COMMIT');

        return {
            mensaje: 'Orden cancelada exitosamente y stock repuesto en catálogo',
            orden: updatedOrdenRes.rows[0],
            items_repuestos: itemsRes.rows
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Consulta el detalle completo de una orden por ID
 */
async function obtenerOrdenPorId(ordenId) {
    const id = parseInt(ordenId, 10);
    if (!id || isNaN(id)) {
        const error = new Error('ID de orden inválido');
        error.statusCode = 400;
        throw error;
    }

    const query = `
        SELECT 
            o.id, o.estado, o.subtotal, o.descuento, o.envio, o.total, o.fecha_creacion,
            c.id AS cliente_id, c.nombre AS cliente_nombre, c.email AS cliente_email, c.ciudad AS cliente_ciudad,
            cp.codigo AS cupon_codigo, cp.porcentaje AS cupon_porcentaje,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', oi.id,
                        'producto_id', oi.producto_id,
                        'producto_nombre', p.nombre,
                        'cantidad', oi.cantidad,
                        'precio_unitario', oi.precio_unitario
                    )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
            ) AS items
        FROM ordenes o
        JOIN clientes c ON o.cliente_id = c.id
        LEFT JOIN cupones cp ON o.cupon_id = cp.id
        LEFT JOIN orden_items oi ON o.id = oi.orden_id
        LEFT JOIN productos p ON oi.producto_id = p.id
        WHERE o.id = $1
        GROUP BY o.id, c.id, cp.id;
    `;

    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) {
        const error = new Error(`Orden con ID ${id} no encontrada`);
        error.statusCode = 404;
        throw error;
    }

    return res.rows[0];
}

module.exports = {
    crearOrden,
    cancelarOrden,
    obtenerOrdenPorId,
    calcularEnvio
};
