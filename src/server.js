const dotenv = require('dotenv');

dotenv.config();

// Falla al arrancar (y con un mensaje claro) si falta alguna variable de entorno obligatoria
const REQUERIDAS = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'JWT_SECRET'];
const faltantes = REQUERIDAS.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
    console.error(`Faltan variables de entorno en el archivo .env: ${faltantes.join(', ')}`);
    console.error('Copia .env.example a .env y completa los valores.');
    process.exit(1);
}

const sequelize = require('./config/db');
const app = require('./app');
require('./models/associations');

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conectado a PostgreSQL con Sequelize');

        // Crea las tablas que falten (no borra ni modifica las existentes)
        await sequelize.sync({ force: false });
        console.log('Base de datos sincronizada');

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err.message);
        process.exit(1);
    }
};

iniciar();
