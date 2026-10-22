const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuración del Pool de conexiones a PostgreSQL.
 * Soporta tanto una cadena completa DATABASE_URL como variables discretas de entorno.
 */
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'tienda_online',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        max: 20, // Máximo número de clientes concurrentes en el pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Evento de confirmación de conexión exitosa
pool.on('connect', () => {
    // Conexión adquirida silenciosamente o con log mínimo
});

// Evento de captura de errores inesperados en clientes inactivos
pool.on('error', (err) => {
    console.error('Error inesperado en cliente inactivo de PostgreSQL:', err.message);
});

module.exports = pool;
