const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Función auxiliar centralizada para ejecutar peticiones HTTP y formatear errores.
 * Extrae de forma estandarizada el formato { error: "mensaje" } cuando !res.ok.
 */
async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(
                (data && data.error) ? data.error : `Error HTTP ${response.status}: ${response.statusText}`
            );
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (err) {
        // Preserva el error y su código HTTP
        throw err;
    }
}

// -----------------------------------------------------------------------------
// Productos
// -----------------------------------------------------------------------------

export async function getProductos({ q = '', categoria = '', orden = '' } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (categoria && categoria.trim()) params.append('categoria', categoria.trim());
    if (orden && orden.trim()) params.append('orden', orden.trim());

    const queryString = params.toString();
    const endpoint = `/productos${queryString ? `?${queryString}` : ''}`;
    return request(endpoint);
}

export async function getProductosCategorias() {
    return request('/productos/categorias');
}

export async function getProductoById(id) {
    return request(`/productos/${id}`);
}

// -----------------------------------------------------------------------------
// Clientes
// -----------------------------------------------------------------------------

export async function getClientes() {
    return request('/clientes');
}

// -----------------------------------------------------------------------------
// Cupones
// -----------------------------------------------------------------------------

export async function validarCupon({ codigo, cliente_id }) {
    return request('/cupones/validar', {
        method: 'POST',
        body: JSON.stringify({ codigo, cliente_id })
    });
}

// -----------------------------------------------------------------------------
// Órdenes
// -----------------------------------------------------------------------------

export async function crearOrden({ cliente_id, cupon_codigo, items }) {
    return request('/ordenes', {
        method: 'POST',
        body: JSON.stringify({
            cliente_id,
            cupon_codigo: cupon_codigo ? cupon_codigo.trim() : null,
            items
        })
    });
}

export async function cancelarOrden(id) {
    return request(`/ordenes/${id}/cancelar`, {
        method: 'PATCH'
    });
}

export async function getOrdenById(id) {
    return request(`/ordenes/${id}`);
}

// -----------------------------------------------------------------------------
// Métricas y Resumen Ejecutivo
// -----------------------------------------------------------------------------

export async function getResumen() {
    return request('/resumen');
}
