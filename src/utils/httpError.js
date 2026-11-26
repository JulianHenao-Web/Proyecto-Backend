// Error con código HTTP. Los servicios lo lanzan (throw new HttpError(404, '...'))
// y el controlador lo convierte en la respuesta correcta con handleError.
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

module.exports = HttpError;
