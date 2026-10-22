const ordenesService = require('../services/ordenesService');

/**
 * Controlador de Órdenes de Compra.
 * Gestiona peticiones HTTP, validaciones primarias y mapeo de códigos 200, 201, 400, 404, 409.
 */
async function crear(req, res, next) {
    try {
        const { cliente_id, cupon_codigo, items } = req.body;

        // Validación inicial de datos de entrada (HTTP 400 Bad Request)
        if (!cliente_id) {
            return res.status(400).json({
                error: 'El campo cliente_id es obligatorio para registrar la orden'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'La orden debe contener al menos un producto en el listado de items'
            });
        }

        const ordenCreada = await ordenesService.crearOrden({
            cliente_id,
            cupon_codigo,
            items
        });

        // 201 Created: Orden registrada exitosamente con reserva de inventario
        return res.status(201).json(ordenCreada);
    } catch (err) {
        // Delegar al middleware de captura de errores manteniendo el statusCode establecido
        next(err);
    }
}

/**
 * Cancela una orden y desencadena la reposición de inventario
 */
async function cancelar(req, res, next) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({
                error: 'El parámetro :id de la orden debe ser un número entero'
            });
        }

        const resultado = await ordenesService.cancelarOrden(id);

        // 200 OK: Cancelación realizada y confirmación de reposición
        return res.status(200).json(resultado);
    } catch (err) {
        next(err);
    }
}

/**
 * Obtiene el detalle completo de una orden específica por su ID
 */
async function obtenerPorId(req, res, next) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({
                error: 'El parámetro :id de la orden debe ser un número válido'
            });
        }

        const orden = await ordenesService.obtenerOrdenPorId(id);
        return res.status(200).json(orden);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    crear,
    cancelar,
    obtenerPorId
};
