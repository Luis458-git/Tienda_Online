require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api', apiRoutes);

// 404 para cualquier ruta no definida
app.use((req, res) => {
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador centralizado de errores (siempre al final)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API Tienda Online escuchando en http://localhost:${PORT}/api`);
});

module.exports = app;
