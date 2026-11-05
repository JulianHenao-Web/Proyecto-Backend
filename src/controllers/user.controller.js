const userService = require('../services/user.service');
 
// Crea un usuario; queda a cargo del administrador autenticado (req.user.id)
exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password, rol_id } = req.body;
        const administrador_id = req.user.id;
 
        if (!nombre || !email || !password || !rol_id) {
            return res.status(400).json({ message: 'nombre, email, password y rol_id son obligatorios' });
        }
 
        const newUser = await userService.createUser(nombre, email, password, rol_id, administrador_id);
        const { password: _omit, ...userSinPassword } = newUser.toJSON();
 
        return res.status(201).json(userSinPassword);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol_id, administrador_id } = req.body;
        const admin_from_token = req.user.id;
 
        const updatedUser = await userService.updateUser(id, nombre, email, rol_id, administrador_id, admin_from_token);
 
        return res.status(200).json(updatedUser);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
// Lista los usuarios a cargo del administrador autenticado; ?email= filtra por coincidencia parcial
exports.getAllUsersByAdministradorId = async (req, res) => {
    try {
        const administrador_id = req.user.id;
        const { email } = req.query;
 
        const users = await userService.getAllUsersByAdministradorId(administrador_id, email);
 
        return res.status(200).json(users);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const admin_from_token = req.user.id;
 
        const result = await userService.deleteUser(id, admin_from_token);
 
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.getAllUsersByRolId = async (req, res) => {
    try {
        const rol_id = req.params.id;
 
        const users = await userService.getAllUsersByRolId(rol_id);
 
        return res.status(200).json(users);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};