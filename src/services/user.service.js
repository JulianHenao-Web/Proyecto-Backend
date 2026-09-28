const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

exports.createUser = async (nombre, email, password, rol_id, administrador_id) => {
};

exports.updateUser = async (id, nombre, email, rol_id, administrador_id, admin_from_token) => {
};

exports.getAllUsersByAdministradorId = async (administrador_id, email) => {
};

exports.deleteUser = async (id, admin_from_token) => {
};

exports.getAllUsersByRolId = async (rol_id) => {
};
