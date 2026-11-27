const userService = require('../services/user.service');
const handleError = require('../utils/handleError');

// Crea un usuario. Queda a cargo del administrador indicado en el body (administrador_id)
// o, si no se envía, del administrador autenticado (req.user.id).
exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password, rol_id, administrador_id } = req.body;

        if (!nombre || !email || !password || !rol_id) {
            return res.status(400).json({ message: 'nombre, email, password y rol_id son obligatorios' });
        }

        const newUser = await userService.createUser(nombre, email, password, rol_id, req.user.id, administrador_id);
        const { password: _omit, ...userSinPassword } = newUser.toJSON();

        return res.status(201).json({ message: 'Usuario creado correctamente', user: userSinPassword });
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

        return res.status(200).json({ message: 'Usuario actualizado correctamente', user: updatedUser });
    } catch (err) {
        return handleError(res, err);
    }
};

// Lista los usuarios a cargo del administrador autenticado.
// Filtros opcionales por coincidencia parcial: ?nombre= y ?email=
exports.getAllUsersByAdministradorId = async (req, res) => {
    try {
        const { nombre, email } = req.query;
        const users = await userService.getAllUsersByAdministradorId(req.user.id, { nombre, email });
        return res.status(200).json({ users });
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

// Usuarios de un rol: los administradores (para elegir responsable) o los usuarios a cargo del autenticado
exports.getAllUsersByRolId = async (req, res) => {
    try {
        const users = await userService.getAllUsersByRolId(req.params.id, req.user.id);
        return res.status(200).json({ users });
    } catch (err) {
        return handleError(res, err);
    }
};
