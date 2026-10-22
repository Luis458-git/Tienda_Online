const { Router } = require('express');
const productosController = require('../controllers/productosController');

const router = Router();

// GET /api/productos?q=texto&categoria=Periféricos&orden=precio_asc
router.get('/', productosController.listar);

// GET /api/productos/categorias (debe ir antes de /:id)
router.get('/categorias', productosController.listarCategorias);

// GET /api/productos/:id
router.get('/:id', productosController.obtenerPorId);

// POST /api/productos
router.post('/', productosController.crear);

// PUT /api/productos/:id
router.put('/:id', productosController.actualizar);

// DELETE /api/productos/:id
router.delete('/:id', productosController.eliminar);

module.exports = router;
