const cuponesService = require('../services/cuponesService');

function parseId(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El parámetro :id debe ser un entero positivo' });
        return null;
    }
    return id;
}

// POST /api/cupones/validar  body: { codigo, cliente_id }
// 200 válido | 400 datos faltantes | 404 cupón/cliente inexistente | 409 vencido, agotado o ya usado
async function validar(req, res, next) {
    try {
        const { codigo, cliente_id } = req.body || {};
        if (!codigo || !cliente_id) {
            return res.status(400).json({ error: 'Los campos codigo y cliente_id son obligatorios' });
        }
        const resultado = await cuponesService.validarParaCliente({ codigo, cliente_id });
        return res.status(200).json(resultado);
    } catch (err) {
        next(err);
    }
}

// GET /api/cupones
async function listar(req, res, next) {
    try {
        return res.status(200).json(await cuponesService.listar());
    } catch (err) {
        next(err);
    }
}

// GET /api/cupones/:id
async function obtenerPorId(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        return res.status(200).json(await cuponesService.obtenerPorId(id));
    } catch (err) {
        next(err);
    }
}

// POST /api/cupones
async function crear(req, res, next) {
    try {
        const cupon = await cuponesService.crear(req.body || {});
        return res.status(201).json(cupon);
    } catch (err) {
        next(err);
    }
}

// PUT /api/cupones/:id
async function actualizar(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        return res.status(200).json(await cuponesService.actualizar(id, req.body || {}));
    } catch (err) {
        next(err);
    }
}

// DELETE /api/cupones/:id
async function eliminar(req, res, next) {
    try {
        const id = parseId(req, res);
        if (id === null) return;
        const eliminado = await cuponesService.eliminar(id);
        return res.status(200).json({ mensaje: 'Cupón eliminado', cupon: eliminado });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validar,
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
