const { Router } = require('express');

const router = Router();

/**
 * GET /api/ia/status
 * Verifica en tiempo real si:
 * 1. El proceso n8n está vivo (http://localhost:5678/healthz)
 * 2. El webhook de producción 'recomendador-ia' está activo y registrado
 * 3. O si está en modo de prueba (webhook-test)
 */
router.get('/status', async (req, res) => {
    const N8N_HOST = process.env.N8N_HOST || 'http://localhost:5678';
    const N8N_WEBHOOK = `${N8N_HOST}/webhook/recomendador-ia`;
    const N8N_WEBHOOK_TEST = `${N8N_HOST}/webhook-test/recomendador-ia`;

    let serverOnline = false;
    let webhookActive = false;
    let testWebhookActive = false;

    // 1. Probar si el servidor n8n está encendido
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const healthRes = await fetch(`${N8N_HOST}/healthz`, { signal: controller.signal });
        clearTimeout(timeout);
        if (healthRes.ok) {
            serverOnline = true;
        }
    } catch {
        serverOnline = false;
    }

    if (!serverOnline) {
        return res.json({
            ok: true,
            status: 'offline',
            serverOnline: false,
            webhookActive: false,
            badge: {
                texto: 'n8n Offline',
                color: 'red',
                descripcion: 'El servidor n8n no está respondiendo en el puerto 5678.'
            }
        });
    }

    // 2. Probar webhook de producción (rápido en <50ms sin disparar el LLM)
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const wbRes = await fetch(N8N_WEBHOOK, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        const txt = await wbRes.text();
        if (txt.includes('Did you mean to make a POST request') || wbRes.status === 200) {
            webhookActive = true;
        }
    } catch {
        webhookActive = false;
    }

    if (webhookActive) {
        return res.json({
            ok: true,
            status: 'active',
            serverOnline: true,
            webhookActive: true,
            badge: {
                texto: 'n8n Online',
                color: 'green',
                descripcion: 'El workflow está activo en n8n y respondiendo con DeepSeek / OpenAI.'
            }
        });
    }

    // 3. Probar webhook de test
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const wbTestRes = await fetch(N8N_WEBHOOK_TEST, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        const txt = await wbTestRes.text();
        if (txt.includes('Did you mean to make a POST request') || wbTestRes.status === 200) {
            testWebhookActive = true;
        }
    } catch {
        testWebhookActive = false;
    }

    if (testWebhookActive) {
        return res.json({
            ok: true,
            status: 'testing',
            serverOnline: true,
            webhookActive: true,
            badge: {
                texto: 'n8n Modo Test',
                color: 'cyan',
                descripcion: 'n8n está en modo de prueba escuchando en /webhook-test.'
            }
        });
    }

    // Servidor n8n vivo pero workflow inactivo
    return res.json({
        ok: true,
        status: 'inactive',
        serverOnline: true,
        webhookActive: false,
        badge: {
            texto: 'n8n Inactivo',
            color: 'amber',
            descripcion: 'Servidor n8n encendido, pero el workflow "recomendador-ia" no está activo en el editor.'
        }
    });
});

module.exports = router;
