// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// La API responde bajo /api/v1 (lo que espera el frontend) y también bajo /api (compatibilidad con Postman)
const PREFIJOS = ['/api/v1', '/api'];

app.use(PREFIJOS, authRoutes);
app.use(PREFIJOS, userRoutes);
app.use(PREFIJOS, projectRoutes);

// Siempre al final: primero las rutas, luego "no encontrada" y por último el manejador de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
