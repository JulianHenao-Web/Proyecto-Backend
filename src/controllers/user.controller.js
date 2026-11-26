const userService = require('../services/user.service');
const handleError = require('../utils/handleError');

// Crea un usuario; queda a cargo del administrador autenticado (req.user.id)
exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password, rol_id } = req.body;

        if (!nombre || !email || !password || !rol_id) {
            return res.status(400).json({ message: 'nombre, email, password y rol_id son obligatorios' });
        }

        const newUser = await userService.createUser(nombre, email, password, rol_id, req.user.id);
        const { password: _omit, ...userSinPassword } = newUser.toJSON();

        return res.status(201).json(userSinPassword);
    } catch (err) {
        return handleError(res, err);
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { nombre, email, rol_id, administrador_id } = req.body;

        const updatedUser = await userService.updateUser(
            req.params.id,
            nombre,
            email,
            rol_id,
            administrador_id,
            req.user.id
        );

        return res.status(200).json(updatedUser);
    } catch (err) {
        return handleError(res, err);
    }
};

// Lista los usuarios a cargo del administrador autenticado; ?email= filtra por coincidencia parcial
exports.getAllUsersByAdministradorId = async (req, res) => {
    try {
        const users = await userService.getAllUsersByAdministradorId(req.user.id, req.query.email);
        return res.status(200).json(users);
    } catch (err) {
        return handleError(res, err);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return handleError(res, err);
    }
};

// Usuarios de un rol que están a cargo del administrador autenticado
exports.getAllUsersByRolId = async (req, res) => {
    try {
        const users = await userService.getAllUsersByRolId(req.params.id, req.user.id);
        return res.status(200).json(users);
    } catch (err) {
        return handleError(res, err);
    }
};
