const projectService = require('../services/project.service');
const handleError = require('../utils/handleError');

// El controlador lee la petición (req), llama al servicio y arma la respuesta (res).
// La identidad de quien hace la petición siempre sale del token (req.user), nunca del body.

// Quien crea el proyecto queda como su administrador responsable
exports.createProject = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const newProject = await projectService.createProject({
            nombre,
            descripcion,
            administrador_id: req.user.id
        });

        return res.status(201).json(newProject);
    } catch (err) {
        return handleError(res, err);
    }
};

// Proyectos que administra el usuario autenticado
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await projectService.getAllProjects(req.user.id);
        return res.status(200).json(projects);
    } catch (err) {
        return handleError(res, err);
    }
};

// Proyectos en los que participa el usuario autenticado
exports.getMyProjects = async (req, res) => {
    try {
        const projects = await projectService.getProjectsByUserId(req.user.id);
        return res.status(200).json(projects);
    } catch (err) {
        return handleError(res, err);
    }
};

// Solo el administrador del proyecto o un usuario asignado a él pueden verlo (lo valida el service)
exports.getProjectById = async (req, res) => {
    try {
        const project = await projectService.getProjectById(req.params.id, req.user.id);
        return res.status(200).json(project);
    } catch (err) {
        return handleError(res, err);
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { nombre, descripcion, administrador_id } = req.body;

        const updatedProject = await projectService.updateProject({
            id: req.params.id,
            nombre,
            descripcion,
            administrador_id,
            admin_from_token: req.user.id
        });

        return res.status(200).json(updatedProject);
    } catch (err) {
        return handleError(res, err);
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const result = await projectService.deleteProject(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return handleError(res, err);
    }
};

// Agrega uno o varios usuarios a un proyecto. body: { usuario_ids: [1,2,3] } o { usuario_ids: 1 }
exports.assignUsersToProject = async (req, res) => {
    try {
        const { usuario_ids } = req.body;

        if (usuario_ids === undefined || usuario_ids === null) {
            return res.status(400).json({ message: 'usuario_ids es obligatorio' });
        }

        const result = await projectService.assignUsersToProject({
            proyecto_id: req.params.id,
            usuario_ids,
            admin_from_token: req.user.id
        });

        return res.status(200).json(result);
    } catch (err) {
        return handleError(res, err);
    }
};

exports.removeUserFromProject = async (req, res) => {
    try {
        const result = await projectService.removeUserFromProject({
            proyecto_id: req.params.id,
            usuario_id: req.params.usuarioId,
            admin_from_token: req.user.id
        });

        return res.status(200).json(result);
    } catch (err) {
        return handleError(res, err);
    }
};
