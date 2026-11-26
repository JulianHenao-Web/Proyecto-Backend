// Datos iniciales para una base de datos nueva: roles, permisos y usuarios de demostración.
// Uso: npm run seed
// Es seguro ejecutarlo varias veces: no duplica lo que ya existe.
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = require('../config/db');
const { User } = require('../models/associations');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');
const RolePermission = require('../models/rolePermission.model');
const ROLES = require('../utils/constants');

const PASSWORD_ADMIN = 'Admin1234';
const PASSWORD_USUARIO = 'Usuario1234';

const crearUsuario = async (nombre, email, password, rol_id, administrador_id = null) => {
    const [user, creado] = await User.findOrCreate({
        where: { email },
        defaults: { nombre, password: await bcrypt.hash(password, 10), rol_id, administrador_id }
    });
    console.log(`${creado ? 'Creado ' : 'Ya existe'}: ${email} (id ${user.id})`);
    return user;
};

const seed = async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    // Roles con los ids que usa el código (utils/constants.js)
    await Role.findOrCreate({ where: { id: ROLES.ADMIN }, defaults: { nombre: 'Administrador' } });
    await Role.findOrCreate({ where: { id: ROLES.USER }, defaults: { nombre: 'Usuario' } });
    await sequelize.query(
        "SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT MAX(id) FROM roles))"
    );

    // Permisos y su relación con los roles
    const nombresPermisos = ['gestionar_usuarios', 'gestionar_proyectos', 'ver_proyectos'];
    const permisos = {};
    for (const nombre of nombresPermisos) {
        const [permiso] = await Permission.findOrCreate({ where: { nombre } });
        permisos[nombre] = permiso;
    }

    const asignaciones = [
        [ROLES.ADMIN, 'gestionar_usuarios'],
        [ROLES.ADMIN, 'gestionar_proyectos'],
        [ROLES.ADMIN, 'ver_proyectos'],
        [ROLES.USER, 'ver_proyectos']
    ];
    for (const [rol_id, nombre] of asignaciones) {
        await RolePermission.findOrCreate({ where: { rol_id, permiso_id: permisos[nombre].id } });
    }

    // Usuarios de demostración
    const admin = await crearUsuario('Administrador Demo', 'admin@demo.com', PASSWORD_ADMIN, ROLES.ADMIN);
    await crearUsuario('Administrador Dos', 'admin2@demo.com', PASSWORD_ADMIN, ROLES.ADMIN);
    await crearUsuario('Juan Pérez', 'juan@demo.com', PASSWORD_USUARIO, ROLES.USER, admin.id);
    await crearUsuario('María Gómez', 'maria@demo.com', PASSWORD_USUARIO, ROLES.USER, admin.id);

    console.log('\nListo. Credenciales de prueba:');
    console.log(`  Administrador: admin@demo.com / ${PASSWORD_ADMIN}`);
    console.log(`  Segundo administrador: admin2@demo.com / ${PASSWORD_ADMIN}`);
    console.log(`  Usuario regular: juan@demo.com / ${PASSWORD_USUARIO}`);
};

seed()
    .then(() => sequelize.close())
    .catch(async (err) => {
        console.error('Error al ejecutar el seed:', err.message);
        await sequelize.close();
        process.exit(1);
    });
