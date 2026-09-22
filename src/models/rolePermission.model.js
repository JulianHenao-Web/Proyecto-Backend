const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./role.model');
const Permission = require('./permission.model');

const RolePermission = sequelize.define('roles_permisos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Role, key: 'id' }
    },
    permiso_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Permission, key: 'id' }
    }
}, {
    timestamps: false,
    tableName: 'roles_permisos',
    indexes: [
        {
            unique: true,
            fields: ['rol_id', 'permiso_id']
        }
    ]
});

module.exports = RolePermission;