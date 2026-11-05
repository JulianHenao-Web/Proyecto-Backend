const projectService = require('../services/project.service');
 
// Quien crea el proyecto queda como su administrador responsable
exports.createProject = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const administrador_id = req.user.id;
 
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre del proyecto es obligatorio' });
        }
 
        const newProject = await projectService.createProject({ nombre, descripcion, administrador_id });
 
        return res.status(201).json(newProject);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await projectService.getAllProjects();
        return res.status(200).json(projects);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
// Proyectos en los que participa el usuario autenticado
exports.getMyProjects = async (req, res) => {
    try {
        const projects = await projectService.getProjectsByUserId(req.user.id);
        return res.status(200).json(projects);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
// Solo el administrador del proyecto o un usuario asignado a él pueden verlo (lo valida el service)
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectService.getProjectById(id, req.user.id);
        return res.status(200).json(project);
    } catch (err) {
        return res.status(403).json({ message: err.message });
    }
};
 
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, administrador_id } = req.body;
        const admin_from_token = req.user.id;
 
        const updatedProject = await projectService.updateProject({
            id,
            nombre,
            descripcion,
            administrador_id,
            admin_from_token
        });
 
        return res.status(200).json(updatedProject);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await projectService.deleteProject(id);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
// Agrega uno o varios usuarios a un proyecto. body: { usuario_ids: [1,2,3] } o { usuario_ids: 1 }
exports.assignUsersToProject = async (req, res) => {
    try {
        const { id } = req.params; // proyecto_id
        const { usuario_ids } = req.body;
 
        if (!usuario_ids) {
            return res.status(400).json({ message: 'usuario_ids es obligatorio' });
        }
 
        const asignados = await projectService.assignUsersToProject({ proyecto_id: id, usuario_ids });
 
        return res.status(200).json(asignados);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
 
exports.removeUserFromProject = async (req, res) => {
    try {
        const { id, usuarioId } = req.params; // proyecto_id, usuario_id
 
        const result = await projectService.removeUserFromProject({ proyecto_id: id, usuario_id: usuarioId });
 
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};