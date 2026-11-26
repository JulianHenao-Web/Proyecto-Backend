const HttpError = require('./httpError');

// Convierte un valor (por ejemplo req.params.id, que llega como texto) en un entero positivo.
// Si no lo es, responde 400 en lugar de dejar que PostgreSQL falle con un error técnico.
const parseId = (value, etiqueta = 'El id') => {
    const numero = Number(value);

    if (!Number.isInteger(numero) || numero <= 0) {
        throw new HttpError(400, `${etiqueta} no es válido`);
    }

    return numero;
};

// Un texto obligatorio: debe ser string, no estar vacío y no pasar de `max` caracteres.
const textoObligatorio = (value, etiqueta, max = 255) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new HttpError(400, `${etiqueta} es obligatorio`);
    }

    if (value.trim().length > max) {
        throw new HttpError(400, `${etiqueta} no puede superar los ${max} caracteres`);
    }

    return value.trim();
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validarEmail = (value) => {
    if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim())) {
        throw new HttpError(400, 'El email no tiene un formato válido');
    }

    return value.trim();
};

const PASSWORD_MIN = 8;

const validarPassword = (value) => {
    if (typeof value !== 'string' || value.length < PASSWORD_MIN) {
        throw new HttpError(400, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`);
    }

    return value;
};

module.exports = { parseId, textoObligatorio, validarEmail, validarPassword, PASSWORD_MIN };
