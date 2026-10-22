const clientesService = require('../services/clientesService');

// GET /api/clientes
async function listar(req, res, next) {
    try {
        const clientes = await clientesService.listar();
        return res.status(200).json(clientes);
    } catch (err) {
        next(err);
    }
}

module.exports = { listar };
