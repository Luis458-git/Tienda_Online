const { Router } = require('express');
const cuponesController = require('../controllers/cuponesController');

const router = Router();

// POST /api/cupones/validar  { codigo, cliente_id }
router.post('/validar', cuponesController.validar);

// CRUD
router.get('/', cuponesController.listar);
router.get('/:id', cuponesController.obtenerPorId);
router.post('/', cuponesController.crear);
router.put('/:id', cuponesController.actualizar);
router.delete('/:id', cuponesController.eliminar);

module.exports = router;
