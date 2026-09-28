const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const ROLES = require('../utils/constants');

// Devuelve el usuario como objeto plano, sin la contraseña
const sinPassword = (user) => {
    const { password, ...datos } = user.toJSON();
    return datos;
};
 
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
 
// admin_from_token = id del administrador que hace la petición (sale del JWT)
exports.updateUser = async (id, nombre, email, rol_id, administrador_id, admin_from_token) => {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
 
        // Solo el administrador a cargo de este usuario puede modificarlo
        if (Number(user.administrador_id) !== Number(admin_from_token)) {
            throw new Error('No tienes permiso para modificar este usuario');
        }
 
        // Si cambia el email, que no lo tenga otro usuario
        if (email && email !== user.email) {
            const emailEnUso = await User.findOne({ where: { email } });
            if (emailEnUso) {
                throw new Error('El email ya está en uso');
            }
        }
 
        // Si cambia el rol, debe ser uno válido (1 = ADMIN, 2 = USER)
        if (rol_id !== undefined && !Object.values(ROLES).includes(Number(rol_id))) {
            throw new Error('El rol no es válido');
        }
 
        // Si cambia de administrador, ese administrador debe existir
        if (administrador_id !== undefined && administrador_id !== null) {
            const nuevoAdmin = await User.findByPk(administrador_id);
            if (!nuevoAdmin) {
                throw new Error('El administrador indicado no existe');
            }
        }
 
        // Solo se actualizan los campos que llegaron (los undefined se ignoran)
        await user.update({ nombre, email, rol_id, administrador_id });
 
        return sinPassword(user);
    } catch (err) {
        throw new Error(`Error al actualizar el usuario: ${err.message}`);
    }
};
 
// Lista los usuarios de un administrador
exports.getAllUsersByAdministradorId = async (administrador_id, email) => {
    try {
        const where = { administrador_id };
 
        if (email) {
            where.email = { [Op.iLike]: `%${email}%` };
        }
 
        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['nombre', 'ASC']]
        });
 
        return users;
    } catch (err) {
        throw new Error(`Error al obtener los usuarios: ${err.message}`);
    }
};
 
exports.deleteUser = async (id, admin_from_token) => {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
 
        // Un administrador no puede eliminarse a sí mismo
        if (Number(id) === Number(admin_from_token)) {
            throw new Error('No puedes eliminar tu propio usuario');
        }
 
        // Solo el administrador a cargo de este usuario puede eliminarlo
        if (Number(user.administrador_id) !== Number(admin_from_token)) {
            throw new Error('No tienes permiso para eliminar este usuario');
        }
 
        await user.destroy();
 
        return { message: 'Usuario eliminado correctamente' };
    } catch (err) {
        throw new Error(`Error al eliminar el usuario: ${err.message}`);
    }
};
 
exports.getAllUsersByRolId = async (rol_id) => {
    try {
        const users = await User.findAll({
            where: { rol_id },
            attributes: { exclude: ['password'] },
            order: [['nombre', 'ASC']]
        });
 
        return users;
    } catch (err) {
        throw new Error(`Error al obtener los usuarios por rol: ${err.message}`);
    }
};