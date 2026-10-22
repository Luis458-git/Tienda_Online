const { Router } = require('express');
const productosRoutes = require('./productosRoutes');
const cuponesRoutes = require('./cuponesRoutes');
const ordenesRoutes = require('./ordenesRoutes');
const resumenRoutes = require('./resumenRoutes');
const clientesRoutes = require('./clientesRoutes');

/**
 * Enrutador principal de la API. Se monta en /api desde app.js.
 */
const router = Router();

// GET /api/health - Comprobación rápida de que el servidor responde
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/productos', productosRoutes);
router.use('/cupones', cuponesRoutes);
router.use('/ordenes', ordenesRoutes);
router.use('/resumen', resumenRoutes);
router.use('/clientes', clientesRoutes);

module.exports = router;
