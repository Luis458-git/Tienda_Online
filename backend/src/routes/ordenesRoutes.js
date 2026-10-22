const { Router } = require('express');
const ordenesController = require('../controllers/ordenesController');

const router = Router();

// POST /api/ordenes - Crear orden y reservar stock de forma transaccional
router.post('/', ordenesController.crear);

// PATCH y PUT /api/ordenes/:id/cancelar - Cancelar orden y reponer inventario
router.patch('/:id/cancelar', ordenesController.cancelar);
router.put('/:id/cancelar', ordenesController.cancelar);

// GET /api/ordenes/:id - Detalle completo de una orden
router.get('/:id', ordenesController.obtenerPorId);

module.exports = router;
