const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

exports.createUser = async (nombre, email, password, rol_id, administrador_id) => {
    try {
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            throw new Error('El usuario ya existe');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            nombre,
            email,
            password: hashedPassword,
            rol_id,
            administrador_id
        });

        return newUser;
    } catch (err) {
        throw new Error(`Error al crear el usuario: ${err.message}`);
    }
};

exports.updateUser = async (id, nombre, email, rol_id, administrador_id, admin_from_token) => {
};

exports.getAllUsersByAdministradorId = async (administrador_id, email) => {
};

exports.deleteUser = async (id, admin_from_token) => {
};

exports.getAllUsersByRolId = async (rol_id) => {
};
