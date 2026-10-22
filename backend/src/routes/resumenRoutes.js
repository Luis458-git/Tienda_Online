const { Router } = require('express');
const resumenController = require('../controllers/resumenController');

const router = Router();

// GET /api/resumen - Métricas calculadas con SUM, COUNT, AVG y GROUP BY
router.get('/', resumenController.obtenerResumen);

module.exports = router;
