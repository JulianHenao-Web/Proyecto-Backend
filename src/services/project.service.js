const Project = require('../models/project.model');
const User = require('../models/user.model');
const UserProject = require('../models/userProject.model');
const ROLES = require('../utils/constants');
const HttpError = require('../utils/httpError');
const { parseId, textoObligatorio } = require('../utils/validators');

// ---------------------------------------------------------------------------
// Funciones de apoyo
// ---------------------------------------------------------------------------

// Busca el proyecto o responde 404.
const findProjectOrFail = async (id) => {
    const project = await Project.findByPk(parseId(id, 'El id del proyecto'));

    if (!project) {
        throw new HttpError(404, 'Proyecto no encontrado');
    }

    return project;
};

// Solo el administrador responsable del proyecto puede continuar; si no, responde 403.
// `accion` completa la frase: "No tienes permiso para <accion>".
const assertProjectOwner = (project, adminId, accion) => {
    if (Number(project.administrador_id) !== Number(adminId)) {
        throw new HttpError(403, `No tienes permiso para ${accion}`);
    }
};

// Los atributos del administrador que se muestran en las respuestas (nunca la contraseña).
const incluirAdministrador = { model: User, as: 'administrador', attributes: { exclude: ['password'] } };

// ---------------------------------------------------------------------------
// CRUD de proyectos
// ---------------------------------------------------------------------------

// data = { nombre, descripcion, administrador_id }
exports.createProject = async (data) => {
    const nombre = textoObligatorio(data.nombre, 'El nombre del proyecto');
    const { descripcion, administrador_id } = data;

    if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
        throw new HttpError(400, 'La descripción debe ser un texto');
    }

    const administrador = await User.findByPk(administrador_id);
    if (!administrador) {
        throw new HttpError(404, 'El administrador indicado no existe');
    }
    if (administrador.rol_id !== ROLES.ADMIN) {
        throw new HttpError(403, 'El usuario responsable debe tener el rol de Administrador');
    }

    return Project.create({ nombre, descripcion, administrador_id });
};

// Lista los proyectos que administra el usuario autenticado.
exports.getAllProjects = async (administrador_id) => {
    return Project.findAll({
        where: { administrador_id },
        include: [incluirAdministrador],
        order: [['id', 'ASC']]
    });
};

// Proyectos en los que el usuario participa (tabla usuario_proyectos).
exports.getProjectsByUserId = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new HttpError(404, 'Usuario no encontrado');
    }

    return user.getProyectos({
        include: [incluirAdministrador],
        joinTableAttributes: [],
        order: [['id', 'ASC']]
    });
};

// Solo el administrador del proyecto o un usuario asignado a él pueden consultarlo.
exports.getProjectById = async (id, userId) => {
    const project = await Project.findByPk(parseId(id, 'El id del proyecto'), {
        include: [
            incluirAdministrador,
            { model: User, as: 'usuarios', attributes: { exclude: ['password'] }, through: { attributes: [] } }
        ]
    });

    if (!project) {
        throw new HttpError(404, 'Proyecto no encontrado');
    }

    const esAdministrador = Number(project.administrador_id) === Number(userId);
    const esParticipante = project.usuarios.some((u) => Number(u.id) === Number(userId));

    if (!esAdministrador && !esParticipante) {
        throw new HttpError(403, 'No tienes acceso a este proyecto');
    }

    return project;
};

// data = { id, nombre, descripcion, administrador_id, admin_from_token }
// admin_from_token = id del administrador que hace la petición (sale del JWT)
exports.updateProject = async (data) => {
    const { id, nombre, descripcion, administrador_id, admin_from_token } = data;

    const project = await findProjectOrFail(id);
    assertProjectOwner(project, admin_from_token, 'modificar este proyecto');

    const cambios = {};

    if (nombre !== undefined) {
        cambios.nombre = textoObligatorio(nombre, 'El nombre del proyecto');
    }
    if (descripcion !== undefined) {
        if (descripcion !== null && typeof descripcion !== 'string') {
            throw new HttpError(400, 'La descripción debe ser un texto');
        }
        cambios.descripcion = descripcion;
    }
    if (administrador_id !== undefined) {
        // Si cambia de administrador, el nuevo debe existir y tener rol de Administrador
        const nuevoAdmin = await User.findByPk(parseId(administrador_id, 'El id del nuevo administrador'));
        if (!nuevoAdmin) {
            throw new HttpError(404, 'El nuevo administrador indicado no existe');
        }
        if (nuevoAdmin.rol_id !== ROLES.ADMIN) {
            throw new HttpError(403, 'El nuevo administrador debe tener el rol de Administrador');
        }
        cambios.administrador_id = nuevoAdmin.id;
    }

    if (Object.keys(cambios).length === 0) {
        throw new HttpError(400, 'Debes enviar al menos un campo para actualizar: nombre, descripcion o administrador_id');
    }

    await project.update(cambios);

    return project;
};

// Solo el administrador responsable puede eliminar el proyecto.
// Sus asignaciones en usuario_proyectos se eliminan en cascada (ON DELETE CASCADE).
exports.deleteProject = async (id, admin_from_token) => {
    const project = await findProjectOrFail(id);
    assertProjectOwner(project, admin_from_token, 'eliminar este proyecto');

    await project.destroy();

    return { message: 'Proyecto eliminado correctamente' };
};

// ---------------------------------------------------------------------------
// Asociación usuarios <-> proyectos
// ---------------------------------------------------------------------------

// data = { proyecto_id, usuario_ids, admin_from_token }
// usuario_ids puede ser un id o un arreglo de ids. Solo el administrador del proyecto puede asignar.
exports.assignUsersToProject = async (data) => {
    const { proyecto_id, usuario_ids, admin_from_token } = data;

    const project = await findProjectOrFail(proyecto_id);
    assertProjectOwner(project, admin_from_token, 'asignar usuarios a este proyecto');

    // Se normaliza a un arreglo de enteros sin repetidos
    const lista = Array.isArray(usuario_ids) ? usuario_ids : [usuario_ids];
    if (lista.length === 0) {
        throw new HttpError(400, 'usuario_ids no puede estar vacío');
    }
    const ids = [...new Set(lista.map((valor) => parseId(valor, 'Cada id de usuario')))];

    // Antes de guardar nada, todos los usuarios deben existir (si uno falla, no se asigna ninguno)
    const usuarios = await User.findAll({ where: { id: ids }, attributes: ['id'] });
    const existentes = usuarios.map((u) => u.id);
    const inexistentes = ids.filter((id) => !existentes.includes(id));
    if (inexistentes.length > 0) {
        throw new HttpError(404, `Los usuarios con id ${inexistentes.join(', ')} no existen`);
    }

    // Los que ya participaban se omiten sin romper el resto de la lista
    const yaAsignados = await UserProject.findAll({ where: { proyecto_id: project.id, usuario_id: ids } });
    const idsYaAsignados = yaAsignados.map((r) => r.usuario_id);
    const nuevos = ids.filter((id) => !idsYaAsignados.includes(id));

    const asignados = await UserProject.bulkCreate(
        nuevos.map((usuario_id) => ({ usuario_id, proyecto_id: project.id }))
    );

    return {
        message: asignados.length > 0
            ? 'Usuarios asignados al proyecto correctamente'
            : 'Todos los usuarios indicados ya participaban en el proyecto',
        asignados,
        yaParticipaban: idsYaAsignados
    };
};

// data = { proyecto_id, usuario_id, admin_from_token }
// Solo el administrador del proyecto puede quitar usuarios.
exports.removeUserFromProject = async (data) => {
    const { proyecto_id, usuario_id, admin_from_token } = data;

    const project = await findProjectOrFail(proyecto_id);
    assertProjectOwner(project, admin_from_token, 'quitar usuarios de este proyecto');

    const registro = await UserProject.findOne({
        where: { usuario_id: parseId(usuario_id, 'El id del usuario'), proyecto_id: project.id }
    });
    if (!registro) {
        throw new HttpError(404, 'El usuario no participa en este proyecto');
    }

    await registro.destroy();

    return { message: 'Usuario removido del proyecto correctamente' };
};
