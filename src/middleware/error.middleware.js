// Ruta que no existe: responde 404 en JSON
const notFound = (req, res) => {
    res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Manejador global de errores: atrapa lo que no se atrapó en los controladores
// (por ejemplo, un JSON mal formado en el body de la petición).
const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'El body de la petición no es un JSON válido' });
    }

    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = { notFound, errorHandler };
