const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');
const Project = require('./project.model');

const UserProject = sequelize.define('usuario_proyectos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id', onDelete: 'CASCADE' }
    },
    proyecto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Project, key: 'id', onDelete: 'CASCADE' }
    }
}, {
    timestamps: false,
    tableName: 'usuario_proyectos'
});

module.exports = UserProject;