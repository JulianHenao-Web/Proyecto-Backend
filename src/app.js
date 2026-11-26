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

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', projectRoutes);

// Siempre al final: primero las rutas, luego "no encontrada" y por último el manejador de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
