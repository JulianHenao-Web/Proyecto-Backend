const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

// Verifica el token del header "Authorization: Bearer <token>".
// Si es válido, deja los datos del usuario en req.user para que los usen los controladores.
const authenticateToken = (req, res, next) => {
    const [esquema, token] = (req.header('Authorization') || '').split(' ');

    if (esquema !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Acceso denegado, no se proporcionó un token' });
    }

    jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token no válido' });
        }
        req.user = user;
        next();
    });
};

// Deja pasar solo a los roles indicados. Debe usarse después de authenticateToken.
const checkRole = (roles) => {
    return (req, res, next) => {
        const { rol_id } = req.user;

        if (!roles.includes(rol_id)) {
            return res.status(403).json({ message: 'Acceso denegado, no tienes permiso para realizar esta acción' });
        }

        next();
    };
};

module.exports = { authenticateToken, checkRole };
