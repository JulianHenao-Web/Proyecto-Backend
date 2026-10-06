const Project = require('../models/project.model');
const User = require('../models/user.model');
const UserProject = require('../models/userProject.model');
const ROLES = require('../utils/constants');

exports.createProject = async (data) => {
    try {
        const { nombre, descripcion, administrador_id } = data;
 
        if (!administrador_id) {
            throw new Error('El proyecto debe tener un administrador responsable');
        }
 
        const administrador = await User.findByPk(administrador_id);
        if (!administrador) {
            throw new Error('El administrador indicado no existe');
        }
        if (administrador.rol_id !== ROLES.ADMIN) {
            throw new Error('El usuario responsable debe tener el rol de Administrador');
        }
 
        const newProject = await Project.create({ nombre, descripcion, administrador_id });
 
        return newProject;
    } catch (err) {
        throw new Error(`Error al crear el proyecto: ${err.message}`);
    }
};

exports.getAllProjects = async () => {
    try {
        const projects = await Project.findAll({
            include: [
                { model: User, as: 'administrador', attributes: { exclude: ['password'] } }
            ],
            order: [['nombre', 'ASC']]
        });
 
        return projects;
    } catch (err) {
        throw new Error(`Error al obtener los proyectos: ${err.message}`);
    }
};

exports.getProjectsByUserId = async (userId) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
 
        const projects = await user.getProyectos({
            include: [
                { model: User, as: 'administrador', attributes: { exclude: ['password'] } }
            ]
        });
 
        return projects;
    } catch (err) {
        throw new Error(`Error al obtener los proyectos del usuario: ${err.message}`);
    }
};

// data = { proyecto_id, usuario_ids } — usuario_ids puede ser un id o un arreglo de ids
exports.assignUsersToProject = async (data) => {
    try {
        const { proyecto_id, usuario_ids } = data;
 
        const project = await Project.findByPk(proyecto_id);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
 
        const ids = Array.isArray(usuario_ids) ? usuario_ids : [usuario_ids];
        const asignados = [];
 
        for (const usuario_id of ids) {
            const user = await User.findByPk(usuario_id);
            if (!user) {
                throw new Error(`El usuario con id ${usuario_id} no existe`);
            }
 
            const yaAsignado = await UserProject.findOne({ where: { usuario_id, proyecto_id } });
            if (yaAsignado) {
                continue; // ya participaba en el proyecto; se omite sin romper el resto de la lista
            }
 
            const registro = await UserProject.create({ usuario_id, proyecto_id });
            asignados.push(registro);
        }
 
        return asignados;
    } catch (err) {
        throw new Error(`Error al asignar usuarios al proyecto: ${err.message}`);
    }
};

// data = { proyecto_id, usuario_id }
exports.removeUserFromProject = async (data) => {
    try {
        const { proyecto_id, usuario_id } = data;
 
        const registro = await UserProject.findOne({ where: { usuario_id, proyecto_id } });
        if (!registro) {
            throw new Error('El usuario no participa en este proyecto');
        }
 
        await registro.destroy();
 
        return { message: 'Usuario removido del proyecto correctamente' };
    } catch (err) {
        throw new Error(`Error al remover el usuario del proyecto: ${err.message}`);
    }
};

// data = { id, nombre, descripcion, administrador_id, admin_from_token }
// admin_from_token = id del administrador que hace la petición (sale del JWT)
exports.updateProject = async (data) => {
    try {
        const { id, nombre, descripcion, administrador_id, admin_from_token } = data;
 
        const project = await Project.findByPk(id);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
 
        // Solo el administrador responsable del proyecto puede modificarlo
        if (Number(project.administrador_id) !== Number(admin_from_token)) {
            throw new Error('No tienes permiso para modificar este proyecto');
        }
 
        // Si cambia de administrador, el nuevo debe existir y tener rol de Administrador
        if (administrador_id !== undefined) {
            const nuevoAdmin = await User.findByPk(administrador_id);
            if (!nuevoAdmin) {
                throw new Error('El nuevo administrador indicado no existe');
            }
            if (nuevoAdmin.rol_id !== ROLES.ADMIN) {
                throw new Error('El nuevo administrador debe tener el rol de Administrador');
            }
        }
 
        // Solo se actualizan los campos que llegaron (los undefined se ignoran)
        await project.update({ nombre, descripcion, administrador_id });
 
        return project;
    } catch (err) {
        throw new Error(`Error al actualizar el proyecto: ${err.message}`);
    }
};

exports.deleteProject = async (id) => {
    try {
        const project = await Project.findByPk(id);
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
 
        await project.destroy();
 
        return { message: 'Proyecto eliminado correctamente' };
    } catch (err) {
        throw new Error(`Error al eliminar el proyecto: ${err.message}`);
    }
};

// Solo el administrador del proyecto o un usuario asignado a él pueden consultarlo
exports.getProjectById = async (id, userId) => {
    try {
        const project = await Project.findByPk(id, {
            include: [
                { model: User, as: 'administrador', attributes: { exclude: ['password'] } },
                { model: User, as: 'usuarios', attributes: { exclude: ['password'] }, through: { attributes: [] } }
            ]
        });
 
        if (!project) {
            throw new Error('Proyecto no encontrado');
        }
 
        const esAdministrador = Number(project.administrador_id) === Number(userId);
        const esParticipante = project.usuarios.some((u) => Number(u.id) === Number(userId));
 
        if (!esAdministrador && !esParticipante) {
            throw new Error('No tienes acceso a este proyecto');
        }
 
        return project;
    } catch (err) {
        throw new Error(`Error al obtener el proyecto: ${err.message}`);
    }
};