const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/recomendador-ia';

/**
 * Intenta invocar el webhook de n8n (soporta URL de producción y URL de test)
 */
async function intentarWebhookN8N(payload, timeoutMs = 25000) {
    const urls = [
        N8N_WEBHOOK_URL.replace('/webhook/', '/webhook-test/'),
        N8N_WEBHOOK_URL
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                if (json && (json.ok !== false)) {
                    return json;
                }
            }
        } catch {
            // Continúa con la siguiente URL o retorna null
        }
    }
    return null;
}

/**
 * Cliente exclusivo para el Copiloto de Inteligencia Artificial conectado a n8n.
 * NO genera contenido simulado: únicamente entrega lo que la IA de n8n responda.
 */
async function invocarWebhookN8N(payload) {
    if (payload.action === 'generar_descripcion') {
        const respuestaN8n = await intentarWebhookN8N(payload, 30000);
        if (respuestaN8n) {
            const raw = respuestaN8n.data || respuestaN8n;
            if (raw.copy_comercial || raw.titular || raw.resultado_texto || raw.output) {
                return {
                    ok: true,
                    origen: 'n8n',
                    data: {
                        titular: raw.titular || 'Análisis Generado por IA',
                        copy_comercial: raw.copy_comercial || raw.resultado_texto || raw.output,
                        puntos_clave: raw.puntos_clave || [],
                        recomendados: raw.recomendados || []
                    },
                    error: null
                };
            }
        }

        return {
            ok: false,
            data: null,
            error: 'El workflow de n8n está inactivo en http://localhost:5678. Debes activar el interruptor "Active" en n8n para que la IA genere el contenido.'
        };
    }

    if (payload.action === 'recomendar_carrito') {
        const respuestaN8n = await intentarWebhookN8N(payload, 30000);
        if (respuestaN8n) {
            const raw = respuestaN8n.data || respuestaN8n;
            if (raw.recomendados || raw.analisis_carrito) {
                return {
                    ok: true,
                    origen: 'n8n',
                    data: raw,
                    error: null
                };
            }
        }

        return {
            ok: false,
            data: null,
            error: 'El workflow de n8n no está activo para analizar el carrito.'
        };
    }

    if (payload.action === 'responder_pregunta') {
        const respuestaN8n = await intentarWebhookN8N(payload, 30000);
        if (respuestaN8n) {
            const raw = respuestaN8n.data || respuestaN8n;
            const resTexto = raw.respuesta || raw.resultado_texto || raw.output || (typeof raw === 'string' ? raw : null);
            if (resTexto) {
                return {
                    ok: true,
                    origen: 'n8n',
                    data: {
                        respuesta: resTexto,
                        sugerencias: raw.sugerencias || ["Ver catálogo", "Ver carrito", "Consultar especificaciones"],
                        producto_recomendado: raw.producto_recomendado || null
                    },
                    error: null
                };
            }
        }

        return {
            ok: false,
            data: null,
            error: 'El workflow de n8n está inactivo en http://localhost:5678. Activa el interruptor "Active" en n8n para que la IA responda tu consulta.'
        };
    }

    return {
        ok: false,
        data: null,
        error: 'Acción no soportada'
    };
}

/**
 * Capacidad A: Generar descripción comercial persuasiva y técnica de un producto con n8n
 */
export async function generarDescripcionProducto(nombre, categoria) {
    const payload = {
        action: 'generar_descripcion',
        producto: {
            nombre,
            categoria
        }
    };
    return invocarWebhookN8N(payload);
}

/**
 * Capacidad B: Analizar productos actuales del carrito y sugerir complementos con n8n
 */
export async function obtenerRecomendacionesCarrito(items = []) {
    const payload = {
        action: 'recomendar_carrito',
        items: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria || 'Tecnología',
            precio: parseFloat(item.precio || 0),
            cantidad: item.cantidad || 1
        }))
    };
    return invocarWebhookN8N(payload);
}

/**
 * Capacidad C: Responder preguntas interactivas en lenguaje natural conectada a n8n
 */
export async function responderPreguntaIA(pregunta, contexto = {}) {
    const payload = {
        action: 'responder_pregunta',
        pregunta,
        producto: contexto.producto || null,
        items: contexto.items || []
    };
    return invocarWebhookN8N(payload);
}

export async function consultarAgenteIA(producto) {
    return generarDescripcionProducto(producto.nombre, producto.categoria);
}

/**
 * Consulta el estado real de conectividad con n8n y su webhook
 */
export async function consultarEstadoN8N() {
    try {
        const res = await fetch('http://localhost:3000/api/ia/status');
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // En caso de error de red
    }
    return {
        ok: true,
        status: 'offline',
        serverOnline: false,
        webhookActive: false,
        badge: {
            texto: 'n8n Offline',
            color: 'red',
            descripcion: 'El servidor n8n no está respondiendo en el puerto 5678.'
        }
    };
}
