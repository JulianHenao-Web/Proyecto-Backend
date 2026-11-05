const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticateToken, checkRole } = require('../middleware/auth.middleware');
const ROLES = require('../utils/constants');
const errorHandler = require('../middleware/error.middleware');
 
// Rutas de proyectos
// El orden importa: '/projects/mine' debe ir antes de '/projects/:id'
router.post('/projects/create', authenticateToken, checkRole([ROLES.ADMIN]), projectController.createProject);
router.get('/projects', authenticateToken, checkRole([ROLES.ADMIN]), projectController.getAllProjects);
router.get('/projects/mine', authenticateToken, projectController.getMyProjects);
router.get('/projects/:id', authenticateToken, projectController.getProjectById);
router.put('/projects/update/:id', authenticateToken, checkRole([ROLES.ADMIN]), projectController.updateProject);
router.delete('/projects/delete/:id', authenticateToken, checkRole([ROLES.ADMIN]), projectController.deleteProject);
router.post('/projects/:id/usuarios', authenticateToken, checkRole([ROLES.ADMIN]), projectController.assignUsersToProject);
router.delete('/projects/:id/usuarios/:usuarioId', authenticateToken, checkRole([ROLES.ADMIN]), projectController.removeUserFromProject);
 
// Middleware para manejar errores
router.use(errorHandler);
 
module.exports = router;