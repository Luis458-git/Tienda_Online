const pool = require('../config/db');

/**
 * GET /api/clientes - Listado de clientes con su ciudad (para el checkout).
 */
async function listar() {
    const res = await pool.query(
        'SELECT id, nombre, email, ciudad FROM clientes ORDER BY nombre ASC'
    );
    return res.rows;
}

module.exports = { listar };
