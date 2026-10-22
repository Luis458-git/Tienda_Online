const resumenService = require('../services/resumenService');

/**
 * Controlador de Métricas y Resumen Ejecutivo para el Dashboard.
 */
async function obtenerResumen(req, res, next) {
    try {
        const resumen = await resumenService.obtenerResumenMetricas();
        // 200 OK: Métricas calculadas exitosamente con SQL
        return res.status(200).json(resumen);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    obtenerResumen
};
