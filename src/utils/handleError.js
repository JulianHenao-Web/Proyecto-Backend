const HttpError = require('./httpError');

// Convierte cualquier error en una respuesta JSON.
// - HttpError: usa su código (400, 403, 404, 409...) y su mensaje.
// - Cualquier otro error es inesperado: se registra en consola y se responde 500
//   sin mostrar detalles internos al cliente.
module.exports = (res, err) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }

    console.error(err);
    return res.status(500).json({ message: 'Error interno del servidor' });
};
