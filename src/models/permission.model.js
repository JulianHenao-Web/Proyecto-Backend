const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Permission = sequelize.define('permisos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true }
}, {
    timestamps: false,
    tableName: 'permisos'
});

module.exports = Permission;