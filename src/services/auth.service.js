const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const RolePermission = require('../models/rolePermission.model');
const HttpError = require('../utils/httpError');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

// Mismo mensaje para "usuario inexistente" y "contraseña incorrecta":
// así nadie puede averiguar qué correos están registrados.
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

exports.loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new HttpError(401, CREDENCIALES_INVALIDAS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new HttpError(401, CREDENCIALES_INVALIDAS);
    }

    // Permisos asociados al rol del usuario
    const rolePermissions = await RolePermission.findAll({
        where: { rol_id: user.rol_id },
        attributes: ['permiso_id']
    });
    const permisos = rolePermissions.map((rp) => rp.permiso_id);

    // El token dura una hora y lleva lo necesario para autorizar cada petición
    return jwt.sign(
        { id: user.id, nombre: user.nombre, email: user.email, rol_id: user.rol_id, permisos },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
};
