const User = require('./user.model');
const Project = require('./project.model');
const UserProject = require('./userProject.model');
const Role = require('./role.model');
const Permission = require('./permission.model');
const RolePermission = require('./rolePermission.model');

// Relaciones muchos a muchos
User.belongsToMany(Project, { through: UserProject, foreignKey: 'usuario_id', as: 'proyectos' });
Project.belongsToMany(User, { through: UserProject, foreignKey: 'proyecto_id', as: 'usuarios' });

// Relación de administrador
Project.belongsTo(User, { foreignKey: 'administrador_id', as: 'administrador' });

User.belongsTo(Role, { foreignKey: 'rol_id', as: 'rol' });
Role.hasMany(User, { foreignKey: 'rol_id', as: 'usuarios' });

User.belongsTo(User, { foreignKey: 'administrador_id', as: 'administrador' });
User.hasMany(User, { foreignKey: 'administrador_id', as: 'usuariosAdministrados' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'rol_id', otherKey: 'permiso_id', as: 'permisos' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permiso_id', otherKey: 'rol_id', as: 'roles' });

module.exports = { User, Project, UserProject };