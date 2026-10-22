const productosService = require('../services/productosService');

/**
 * Convierte el parámetro :id en entero positivo o responde 400.
 * Devuelve null si ya se respondió.
 */
function parseId(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El parámetro :id debe ser un entero positivo' });
        return null;
    }
    return id;
}

// GET /api/productos?q=&categoria=&orden=
async function listar(req, res, next) {
    try {
        const { q, categoria, orden } = req.query;
        const productos = await productosService.listar({ q, categoria, orden });
        return res.status(200).json(productos);
    } catch (err) {
        next(err);
    }
}

// GET /api/productos/categorias
async function listarCategorias(req, res, next) {
    try {
        const categorias = await productosService.listarCategorias();
        return res.status(200).json(categorias);
    } catch (err) {
        next(err);
    }
}

// GET /api/productos/:id
async function obtenerPorId(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        const producto = await productosService.obtenerPorId(id);
        return res.status(200).json(producto);
    } catch (err) {
        next(err);
    }
}

// POST /api/productos
async function crear(req, res, next) {
    try {
        const producto = await productosService.crear(req.body || {});
        return res.status(201).json(producto);
    } catch (err) {
        next(err);
    }
}

// PUT /api/productos/:id
async function actualizar(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        const producto = await productosService.actualizar(id, req.body || {});
        return res.status(200).json(producto);
    } catch (err) {
        next(err);
    }
}

// DELETE /api/productos/:id
async function eliminar(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        const eliminado = await productosService.eliminar(id);
        return res.status(200).json({ mensaje: 'Producto eliminado', producto: eliminado });
    } catch (err) {
        next(err);
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
