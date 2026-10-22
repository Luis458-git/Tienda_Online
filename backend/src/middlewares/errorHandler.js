/**
 * Middleware centralizado de manejo y captura de errores.
 * Garantiza un formato uniforme de respuesta de error: { error: "mensaje" }
 * y preserva los códigos de estado HTTP correctos (400, 404, 409, 500).
 */
function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || err.status || 500;
    let mensaje = err.message || 'Error interno del servidor';

    // JSON malformado en el body (lanzado por express.json())
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        mensaje = 'El cuerpo de la petición no es un JSON válido';
    }

    // Manejo especializado de errores nativos arrojados por PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // Violación de restricción UNIQUE
                statusCode = 409;
                mensaje = `Conflicto de duplicidad: ${err.detail || 'El registro ya existe en el sistema'}`;
                break;
            case '23503': // Violación de clave foránea
                statusCode = 400;
                mensaje = `Referencia no válida: ${err.detail || 'Elemento referenciado no existe'}`;
                break;
            case '23514': // Violación de CHECK constraint
                statusCode = 400;
                mensaje = `Los datos no cumplen con las restricciones de negocio: ${err.constraint || ''}`;
                break;
            case '22P02': // Sintaxis de entrada no válida para tipo de dato (ej. string en campo entero)
                statusCode = 400;
                mensaje = 'Tipo de dato incompatible suministrado en la consulta';
                break;
            default:
                break;
        }
    }

    if (statusCode >= 500) {
        console.error('[SERVER ERROR]:', err);
    }

    return res.status(statusCode).json({
        error: mensaje
    });
}

module.exports = errorHandler;
