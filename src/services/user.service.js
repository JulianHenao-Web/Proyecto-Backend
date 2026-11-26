const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const ROLES = require('../utils/constants');
const HttpError = require('../utils/httpError');
const { parseId, textoObligatorio, validarEmail, validarPassword } = require('../utils/validators');

const ROLES_VALIDOS = Object.values(ROLES);

// Devuelve el usuario como objeto plano, sin la contraseña
const sinPassword = (user) => {
    const { password, ...datos } = user.toJSON();
    return datos;
};

const validarRol = (rol_id) => {
    if (!ROLES_VALIDOS.includes(Number(rol_id))) {
        throw new HttpError(400, 'El rol no es válido');
    }
    return Number(rol_id);
};

// Busca el usuario o responde 404.
const findUserOrFail = async (id) => {
    const user = await User.findByPk(parseId(id, 'El id del usuario'));

    if (!user) {
        throw new HttpError(404, 'Usuario no encontrado');
    }

    return user;
};

// El usuario debe estar a cargo del administrador que hace la petición; si no, responde 403.
const assertManagedBy = (user, adminId, accion) => {
    if (Number(user.administrador_id) !== Number(adminId)) {
        throw new HttpError(403, `No tienes permiso para ${accion} este usuario`);
    }
};

// administrador_id = id del administrador que crea el usuario (sale del JWT)
exports.createUser = async (nombre, email, password, rol_id, administrador_id) => {
    const nombreLimpio = textoObligatorio(nombre, 'El nombre');
    const emailLimpio = validarEmail(email);
    validarPassword(password);
    const rol = validarRol(rol_id);

    const userExists = await User.findOne({ where: { email: emailLimpio } });
    if (userExists) {
        throw new HttpError(409, 'El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return User.create({
        nombre: nombreLimpio,
        email: emailLimpio,
        password: hashedPassword,
        rol_id: rol,
        administrador_id
    });
};

// admin_from_token = id del administrador que hace la petición (sale del JWT)
exports.updateUser = async (id, nombre, email, rol_id, administrador_id, admin_from_token) => {
    const user = await findUserOrFail(id);

    // Solo el administrador a cargo de este usuario puede modificarlo
    assertManagedBy(user, admin_from_token, 'modificar a');

    const cambios = {};

    if (nombre !== undefined) {
        cambios.nombre = textoObligatorio(nombre, 'El nombre');
    }

    if (email !== undefined) {
        const emailLimpio = validarEmail(email);
        if (emailLimpio !== user.email) {
            const emailEnUso = await User.findOne({ where: { email: emailLimpio } });
            if (emailEnUso) {
                throw new HttpError(409, 'El email ya está en uso');
            }
        }
        cambios.email = emailLimpio;
    }

    if (rol_id !== undefined) {
        cambios.rol_id = validarRol(rol_id);
    }

    if (administrador_id !== undefined && administrador_id !== null) {
        // Si cambia de administrador, ese usuario debe existir y tener rol de Administrador
        const nuevoAdmin = await User.findByPk(parseId(administrador_id, 'El id del administrador'));
        if (!nuevoAdmin) {
            throw new HttpError(404, 'El administrador indicado no existe');
        }
        if (nuevoAdmin.rol_id !== ROLES.ADMIN) {
            throw new HttpError(403, 'El usuario indicado debe tener el rol de Administrador');
        }
        cambios.administrador_id = nuevoAdmin.id;
    }

    if (Object.keys(cambios).length === 0) {
        throw new HttpError(400, 'Debes enviar al menos un campo para actualizar: nombre, email, rol_id o administrador_id');
    }

    await user.update(cambios);

    return sinPassword(user);
};

// Lista los usuarios de un administrador; `email` filtra por coincidencia parcial
exports.getAllUsersByAdministradorId = async (administrador_id, email) => {
    const where = { administrador_id };

    if (email) {
        where.email = { [Op.iLike]: `%${email}%` };
    }

    return User.findAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['nombre', 'ASC']]
    });
};

exports.deleteUser = async (id, admin_from_token) => {
    const user = await findUserOrFail(id);

    // Un administrador no puede eliminarse a sí mismo
    if (Number(user.id) === Number(admin_from_token)) {
        throw new HttpError(400, 'No puedes eliminar tu propio usuario');
    }

    // Solo el administrador a cargo de este usuario puede eliminarlo
    assertManagedBy(user, admin_from_token, 'eliminar a');

    // Si es responsable de proyectos, eliminarlo borraría esos proyectos en cascada
    const proyectosAdministrados = await Project.count({ where: { administrador_id: user.id } });
    if (proyectosAdministrados > 0) {
        throw new HttpError(
            409,
            'El usuario es responsable de proyectos; reasígnalos a otro administrador antes de eliminarlo'
        );
    }

    await user.destroy();

    return { message: 'Usuario eliminado correctamente' };
};

// Lista los usuarios de un rol que están a cargo del administrador que hace la petición
exports.getAllUsersByRolId = async (rol_id, administrador_id) => {
    const rol = validarRol(rol_id);

    return User.findAll({
        where: { rol_id: rol, administrador_id },
        attributes: { exclude: ['password'] },
        order: [['nombre', 'ASC']]
    });
};
