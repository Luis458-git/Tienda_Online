const pool = require('../config/db');
const { httpError } = require('./cuponesService');

/**
 * Lista blanca de criterios de ordenamiento.
 * ORDER BY no admite placeholders ($1), por eso el valor del usuario se traduce
 * a una cláusula fija y NUNCA se concatena directamente (RNF-02).
 */
const ORDENAMIENTOS = {
    precio_asc: 'precio ASC',
    precio_desc: 'precio DESC',
    nombre_asc: 'nombre ASC',
    nombre_desc: 'nombre DESC',
    stock_desc: 'stock DESC'
};

/**
 * GET /api/productos?q=&categoria=&orden= (RF-01)
 */
async function listar({ q, categoria, orden } = {}) {
    const condiciones = [];
    const valores = [];

    if (q && q.trim() !== '') {
        valores.push(`%${q.trim()}%`);
        condiciones.push(`(nombre ILIKE $${valores.length} OR descripcion ILIKE $${valores.length})`);
    }

    if (categoria && categoria.trim() !== '') {
        valores.push(categoria.trim());
        condiciones.push(`categoria = $${valores.length}`);
    }

    if (orden && !ORDENAMIENTOS[orden]) {
        throw httpError(400, `Criterio de orden inválido. Valores permitidos: ${Object.keys(ORDENAMIENTOS).join(', ')}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const orderBy = ORDENAMIENTOS[orden] || 'id ASC';

    const res = await pool.query(
        `SELECT id, nombre, descripcion, precio, stock, categoria
         FROM productos
         ${where}
         ORDER BY ${orderBy}`,
        valores
    );
    return res.rows;
}

/**
 * GET /api/productos/categorias - Categorías distintas (para el filtro del front)
 */
async function listarCategorias() {
    const res = await pool.query(
        'SELECT DISTINCT categoria FROM productos ORDER BY categoria ASC'
    );
    return res.rows.map(r => r.categoria);
}

/**
 * GET /api/productos/:id (RF-02) - incluye unidades vendidas como dato relacionado
 */
async function obtenerPorId(id) {
    const res = await pool.query(
        `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.categoria,
                COALESCE(SUM(oi.cantidad) FILTER (WHERE o.estado <> 'cancelada'), 0)::int AS unidades_vendidas
         FROM productos p
         LEFT JOIN orden_items oi ON oi.producto_id = p.id
         LEFT JOIN ordenes o ON o.id = oi.orden_id
         WHERE p.id = $1
         GROUP BY p.id`,
        [id]
    );
    if (res.rows.length === 0) {
        throw httpError(404, `Producto con ID ${id} no encontrado`);
    }
    return res.rows[0];
}

/**
 * Valida el cuerpo de un producto. Lanza 400 si algún campo es inválido.
 */
function validarDatosProducto({ nombre, descripcion, precio, stock, categoria }) {
    if (!nombre || String(nombre).trim() === '') {
        throw httpError(400, 'El campo nombre es obligatorio');
    }
    if (!categoria || String(categoria).trim() === '') {
        throw httpError(400, 'El campo categoria es obligatorio');
    }
    const precioNum = Number(precio);
    if (precio === undefined || !Number.isFinite(precioNum) || precioNum < 0) {
        throw httpError(400, 'El precio debe ser un número mayor o igual a 0');
    }
    const stockNum = stock === undefined ? 0 : Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
        throw httpError(400, 'El stock debe ser un entero mayor o igual a 0');
    }
    return {
        nombre: String(nombre).trim(),
        descripcion: descripcion ? String(descripcion).trim() : null,
        precio: precioNum,
        stock: stockNum,
        categoria: String(categoria).trim()
    };
}

async function crear(datos) {
    const p = validarDatosProducto(datos);
    const res = await pool.query(
        `INSERT INTO productos (nombre, descripcion, precio, stock, categoria)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nombre, descripcion, precio, stock, categoria`,
        [p.nombre, p.descripcion, p.precio, p.stock, p.categoria]
    );
    return res.rows[0];
}

async function actualizar(id, datos) {
    const p = validarDatosProducto(datos);
    const res = await pool.query(
        `UPDATE productos
         SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria = $5
         WHERE id = $6
         RETURNING id, nombre, descripcion, precio, stock, categoria`,
        [p.nombre, p.descripcion, p.precio, p.stock, p.categoria, id]
    );
    if (res.rows.length === 0) {
        throw httpError(404, `Producto con ID ${id} no encontrado`);
    }
    return res.rows[0];
}

async function eliminar(id) {
    try {
        const res = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING id, nombre',
            [id]
        );
        if (res.rows.length === 0) {
            throw httpError(404, `Producto con ID ${id} no encontrado`);
        }
        return res.rows[0];
    } catch (err) {
        // 23503: el producto está referenciado en orden_items (historial de ventas)
        if (err.code === '23503') {
            throw httpError(409, 'No se puede eliminar el producto porque tiene órdenes asociadas');
        }
        throw err;
    }
}

module.exports = {
    listar,
    listarCategorias,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
