const { Router } = require('express');
const clientesController = require('../controllers/clientesController');

const router = Router();

// GET /api/clientes
router.get('/', clientesController.listar);

module.exports = router;
