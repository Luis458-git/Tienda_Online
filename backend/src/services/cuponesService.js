const pool = require('../config/db');

/**
 * Crea un Error con statusCode HTTP para que el errorHandler lo traduzca.
 */
function httpError(statusCode, mensaje) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

/**
 * Validación integral de un cupón (RF-06). Reutilizable dentro y fuera de transacciones.
 *
 * @param {object} db - pool o client de pg (si es client dentro de BEGIN, se bloquea la fila)
 * @param {string} codigo - código del cupón
 * @param {number} clienteId - cliente que intenta usarlo
 * @param {object} opciones
 * @param {boolean} opciones.bloquear - aplica FOR UPDATE (solo dentro de una transacción)
 * @param {number} opciones.statusInexistente - 404 para /validar, 409 al crear orden
 * @returns {Promise<{id, codigo, porcentaje, vigente_hasta, usos_maximos, usos_actuales}>}
 */
async function validarCupon(db, codigo, clienteId, { bloquear = false, statusInexistente = 404 } = {}) {
    const codigoLimpio = String(codigo || '').trim().toUpperCase();
    if (!codigoLimpio) {
        throw httpError(400, 'El código del cupón es obligatorio');
    }

    // 1. Existencia (la vigencia se calcula en SQL para evitar problemas de zona horaria)
    const cuponRes = await db.query(
        `SELECT id, codigo, porcentaje, vigente_hasta, usos_maximos,
                (vigente_hasta >= CURRENT_DATE) AS vigente
         FROM cupones
         WHERE UPPER(codigo) = $1
         ${bloquear ? 'FOR UPDATE' : ''}`,
        [codigoLimpio]
    );

    if (cuponRes.rows.length === 0) {
        throw httpError(statusInexistente, `El cupón '${codigoLimpio}' no existe`);
    }

    const cupon = cuponRes.rows[0];

    // 2. Vigencia temporal
    if (!cupon.vigente) {
        throw httpError(409, `El cupón '${cupon.codigo}' está vencido`);
    }

    // 3. Usos máximos globales
    const usosRes = await db.query(
        'SELECT COUNT(*)::int AS total FROM uso_cupones WHERE cupon_id = $1',
        [cupon.id]
    );
    const usosActuales = usosRes.rows[0].total;

    if (usosActuales >= cupon.usos_maximos) {
        throw httpError(409, `El cupón '${cupon.codigo}' alcanzó su límite de ${cupon.usos_maximos} usos`);
    }

    // 4. Uso previo por el mismo cliente
    const usoPrevioRes = await db.query(
        'SELECT 1 FROM uso_cupones WHERE cliente_id = $1 AND cupon_id = $2',
        [clienteId, cupon.id]
    );

    if (usoPrevioRes.rows.length > 0) {
        throw httpError(409, `El cliente ya utilizó el cupón '${cupon.codigo}' anteriormente`);
    }

    return {
        id: cupon.id,
        codigo: cupon.codigo,
        porcentaje: parseFloat(cupon.porcentaje),
        vigente_hasta: cupon.vigente_hasta,
        usos_maximos: cupon.usos_maximos,
        usos_actuales: usosActuales
    };
}

/**
 * POST /api/cupones/validar - Valida un cupón para un cliente sin consumirlo.
 */
async function validarParaCliente({ codigo, cliente_id }) {
    const clienteId = parseInt(cliente_id, 10);
    if (!codigo || !clienteId) {
        throw httpError(400, 'Los campos codigo y cliente_id son obligatorios');
    }

    const clienteRes = await pool.query('SELECT id FROM clientes WHERE id = $1', [clienteId]);
    if (clienteRes.rows.length === 0) {
        throw httpError(404, `El cliente con ID ${clienteId} no existe`);
    }

    const cupon = await validarCupon(pool, codigo, clienteId, { statusInexistente: 404 });

    return {
        valido: true,
        mensaje: `Cupón válido: ${cupon.porcentaje}% de descuento sobre el subtotal`,
        cupon
    };
}

// ----------------------------------------------------------------------------
// CRUD de cupones
// ----------------------------------------------------------------------------

/**
 * Valida el cuerpo para crear/actualizar un cupón. Lanza 400 si es inválido.
 */
function validarDatosCupon({ codigo, porcentaje, vigente_hasta, usos_maximos }) {
    if (!codigo || String(codigo).trim() === '') {
        throw httpError(400, 'El campo codigo es obligatorio');
    }
    const pct = Number(porcentaje);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        throw httpError(400, 'El porcentaje debe ser un número mayor a 0 y menor o igual a 100');
    }
    if (!vigente_hasta || isNaN(Date.parse(vigente_hasta))) {
        throw httpError(400, 'vigente_hasta debe ser una fecha válida (YYYY-MM-DD)');
    }
    const usos = usos_maximos === undefined ? 1 : Number(usos_maximos);
    if (!Number.isInteger(usos) || usos <= 0) {
        throw httpError(400, 'usos_maximos debe ser un entero mayor a 0');
    }
    return {
        codigo: String(codigo).trim().toUpperCase(),
        porcentaje: pct,
        vigente_hasta,
        usos_maximos: usos
    };
}

async function listar() {
    const res = await pool.query(
        `SELECT c.id, c.codigo, c.porcentaje, c.vigente_hasta, c.usos_maximos,
                COUNT(u.id)::int AS usos_actuales,
                (c.vigente_hasta >= CURRENT_DATE) AS vigente
         FROM cupones c
         LEFT JOIN uso_cupones u ON u.cupon_id = c.id
         GROUP BY c.id
         ORDER BY c.id`
    );
    return res.rows;
}

async function obtenerPorId(id) {
    const res = await pool.query(
        `SELECT c.id, c.codigo, c.porcentaje, c.vigente_hasta, c.usos_maximos,
                COUNT(u.id)::int AS usos_actuales,
                (c.vigente_hasta >= CURRENT_DATE) AS vigente
         FROM cupones c
         LEFT JOIN uso_cupones u ON u.cupon_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`,
        [id]
    );
    if (res.rows.length === 0) {
        throw httpError(404, `Cupón con ID ${id} no encontrado`);
    }
    return res.rows[0];
}

async function crear(datos) {
    const c = validarDatosCupon(datos);
    // Un código duplicado dispara 23505 -> el errorHandler responde 409
    const res = await pool.query(
        `INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos)
         VALUES ($1, $2, $3, $4)
         RETURNING id, codigo, porcentaje, vigente_hasta, usos_maximos`,
        [c.codigo, c.porcentaje, c.vigente_hasta, c.usos_maximos]
    );
    return res.rows[0];
}

async function actualizar(id, datos) {
    const c = validarDatosCupon(datos);
    const res = await pool.query(
        `UPDATE cupones
         SET codigo = $1, porcentaje = $2, vigente_hasta = $3, usos_maximos = $4
         WHERE id = $5
         RETURNING id, codigo, porcentaje, vigente_hasta, usos_maximos`,
        [c.codigo, c.porcentaje, c.vigente_hasta, c.usos_maximos, id]
    );
    if (res.rows.length === 0) {
        throw httpError(404, `Cupón con ID ${id} no encontrado`);
    }
    return res.rows[0];
}

async function eliminar(id) {
    try {
        const res = await pool.query('DELETE FROM cupones WHERE id = $1 RETURNING id, codigo', [id]);
        if (res.rows.length === 0) {
            throw httpError(404, `Cupón con ID ${id} no encontrado`);
        }
        return res.rows[0];
    } catch (err) {
        // 23503: el cupón está referenciado por órdenes o historial de uso
        if (err.code === '23503') {
            throw httpError(409, 'No se puede eliminar el cupón porque ya fue utilizado en órdenes');
        }
        throw err;
    }
}

module.exports = {
    httpError,
    validarCupon,
    validarParaCliente,
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
