# Proyecto Backend: API de usuarios y proyectos

API REST hecha con **Node.js, Express, Sequelize y PostgreSQL**. Incluye autenticación con **JWT**, control de acceso por **roles**, gestión de **usuarios** y de **proyectos**, y la asociación entre ambos (qué usuarios participan en qué proyectos).

Proyecto de la asignatura Programación Web (TS5C4).

## Tabla de contenido

1. [Requisitos](#requisitos)
2. [Instalación y configuración](#instalación-y-configuración)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Endpoints](#endpoints)
5. [Reglas de negocio y seguridad](#reglas-de-negocio-y-seguridad)
6. [Códigos de respuesta](#códigos-de-respuesta)
7. [Cómo probar con Postman](#cómo-probar-con-postman)

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [PostgreSQL](https://www.postgresql.org/) 14 o superior
- [Postman](https://www.postman.com/) (para las pruebas)

## Instalación y configuración

**1. Clonar el repositorio e instalar las dependencias**

```bash
git clone https://github.com/JulianHenao-Web/Proyecto-Backend.git
cd Proyecto-Backend
npm install
```

**2. Crear la base de datos vacía en PostgreSQL**

```bash
psql -U postgres -c "CREATE DATABASE db_proyecto;"
```

También se puede crear desde DBeaver o pgAdmin. El nombre usa guion bajo (`db_proyecto`), no guion medio.

**3. Configurar las variables de entorno**

Copia el archivo de ejemplo y complétalo con tus datos:

```bash
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Servidor de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `db_proyecto` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu_contraseña` |
| `JWT_SECRET` | Clave secreta con la que se firman los tokens | un texto largo y aleatorio |

El archivo `.env` contiene secretos y no se sube al repositorio. Si falta alguna variable, el servidor no arranca y dice cuál falta.

**4. Iniciar el servidor**

```bash
npm run dev     # desarrollo, se reinicia solo al guardar cambios
npm start       # producción
```

Al arrancar, Sequelize crea las tablas que falten (`sequelize.sync`). Verás en consola:

```
Conectado a PostgreSQL con Sequelize
Base de datos sincronizada
Servidor corriendo en http://localhost:3000
```

**5. Cargar los datos iniciales (base de datos nueva)**

```bash
npm run seed
```

Crea los roles (`1 = Administrador`, `2 = Usuario`), los permisos y cuatro usuarios de prueba con la contraseña cifrada. Se puede ejecutar varias veces sin duplicar datos.

| Usuario | Email | Contraseña | Rol |
| --- | --- | --- | --- |
| Administrador Demo | `admin@demo.com` | `Admin1234` | Administrador |
| Administrador Dos | `admin2@demo.com` | `Admin1234` | Administrador |
| Juan Pérez | `juan@demo.com` | `Usuario1234` | Usuario (a cargo del admin 1) |
| María Gómez | `maria@demo.com` | `Usuario1234` | Usuario (a cargo del admin 1) |

> Estas credenciales son solo para pruebas locales.

## Arquitectura del proyecto

```
src/
├── server.js              Valida el .env, conecta la base de datos y levanta el servidor
├── app.js                 Configura Express, monta las rutas y los manejadores de errores
├── config/db.js           Conexión de Sequelize a PostgreSQL
├── routes/                Define cada URL y qué middlewares y controlador usa
├── middleware/
│   ├── auth.middleware.js     authenticateToken (valida el JWT) y checkRole (valida el rol)
│   └── error.middleware.js    Ruta no encontrada (404) y errores no controlados
├── controllers/           Leen la petición (req), llaman al servicio y responden (res)
├── services/              Lógica de negocio y reglas de permisos
├── models/                Tablas de Sequelize y sus relaciones (associations.js)
├── utils/                 Constantes de roles, errores HTTP y validaciones
└── scripts/seed.js        Datos iniciales
docs/postman/              Colección de Postman con pruebas automáticas
```

Una petición recorre siempre el mismo camino:

```
Postman → app.js → routes → middleware (token y rol) → controller → service → model → PostgreSQL
```

Cada capa tiene una sola responsabilidad: las rutas deciden *quién* puede entrar, el controlador traduce la petición HTTP, el servicio aplica las reglas del negocio y el modelo habla con la base de datos.

### Modelo de datos

| Tabla | Descripción |
| --- | --- |
| `roles` | Roles del sistema (Administrador, Usuario) |
| `permisos` | Permisos disponibles |
| `roles_permisos` | Qué permisos tiene cada rol (los permisos viajan dentro del token) |
| `usuarios` | Usuarios; `administrador_id` indica quién los tiene a cargo |
| `proyectos` | Proyectos; `administrador_id` es el responsable |
| `usuario_proyectos` | Qué usuarios participan en qué proyectos (único por pareja usuario-proyecto) |

## Endpoints

Todas las rutas empiezan con `/api/v1` (el prefijo que usa el frontend). También responden bajo `/api`, por compatibilidad. Excepto el login, todas requieren el header `Authorization: Bearer <token>`.

Las listas de usuarios responden `{ "users": [...] }`, y al crear o editar un usuario la respuesta trae `{ "message": "...", "user": {...} }`.

### Autenticación

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/login` | Público | Recibe `email` y `password`, devuelve un token que dura 1 hora |

### Usuarios (solo administradores)

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/users/create` | Crea un usuario. Body: `nombre`, `email`, `password` (mínimo 8 caracteres), `rol_id` y, opcional, `administrador_id` (administrador a cargo; si no se envía, el autenticado) |
| GET | `/users` | Lista los usuarios a cargo del administrador. Filtros opcionales: `?nombre=texto` y `?email=texto` (coincidencia parcial) |
| GET | `/users/rol/:id` | Rol `1`: todos los administradores (para elegir responsable). Rol `2`: los usuarios a cargo del administrador autenticado |
| PUT | `/users/update/:id` | Modifica un usuario a cargo del administrador. Body: `nombre`, `email`, `rol_id` o `administrador_id` |
| DELETE | `/users/delete/:id` | Elimina un usuario a cargo del administrador |

### Proyectos

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/projects/create` | Administrador | Crea un proyecto; el administrador autenticado queda como responsable. Body: `nombre`, `descripcion` |
| GET | `/projects` | Administrador | Lista los proyectos que administra |
| GET | `/projects/mine` | Autenticado | Lista los proyectos en los que participa el usuario |
| GET | `/projects/:id` | Administrador del proyecto o participante | Detalle con administrador y participantes |
| PUT | `/projects/update/:id` | Administrador del proyecto | Modifica `nombre`, `descripcion` o `administrador_id` |
| DELETE | `/projects/delete/:id` | Administrador del proyecto | Elimina el proyecto y sus asignaciones |
| POST | `/projects/:id/usuarios` | Administrador del proyecto | Asigna usuarios. Body: `{ "usuario_ids": [3, 4] }` |
| DELETE | `/projects/:id/usuarios/:usuarioId` | Administrador del proyecto | Quita a un usuario del proyecto |

## Reglas de negocio y seguridad

- **Autenticación:** las contraseñas se guardan cifradas con bcrypt y nunca se devuelven. El login responde `Credenciales inválidas` tanto si el correo no existe como si la contraseña es incorrecta, para no revelar qué correos están registrados.
- **Autorización por rol:** `checkRole` limita las rutas de administración al rol Administrador.
- **Autorización por propiedad:** además del rol, el servicio comprueba que el administrador sea el responsable del recurso. Un administrador no puede modificar ni eliminar un proyecto de otro, ni asignarle o quitarle usuarios, ni modificar o eliminar usuarios que no están a su cargo.
- **La identidad sale del token:** el administrador de un usuario o de un proyecto nuevo se toma de `req.user.id`, nunca del body de la petición.
- **Consulta de proyectos:** solo los ve su administrador o un usuario asignado.
- **Integridad:** el email es único; un usuario no puede repetirse dentro de un proyecto; no se puede eliminar el propio usuario ni un usuario que sea responsable de proyectos (borraría esos proyectos en cascada).
- **Asignación atómica:** si alguno de los ids enviados no existe, no se asigna ninguno.
- **Validaciones:** ids numéricos, nombre obligatorio, email con formato válido, contraseña de al menos 8 caracteres, rol existente.

## Códigos de respuesta

| Código | Cuándo ocurre |
| --- | --- |
| 200 / 201 | Operación exitosa / recurso creado |
| 400 | Datos faltantes o inválidos, o JSON mal formado |
| 401 | Falta el token o las credenciales de login son inválidas |
| 403 | Token no válido, o no tienes permiso para esa acción o ese recurso |
| 404 | El recurso o la ruta no existe |
| 409 | Conflicto: email repetido o usuario con proyectos a cargo |
| 500 | Error interno inesperado |

Todos los errores responden en JSON: `{ "message": "..." }`.

## Cómo probar con Postman

1. Abre Postman y usa **Import** con el archivo `docs/postman/Proyecto-Backend.postman_collection.json`.
2. En la colección, pestaña **Variables**, revisa `baseUrl` (por defecto `http://localhost:3000/api/v1`) y las credenciales. Si no usaste `npm run seed`, cámbialas por las de tus usuarios.
3. Ejecuta la carpeta **00 - Autenticación**: los logins guardan automáticamente los tokens y los ids en variables.
4. Ejecuta en orden **01 - CRUD de proyectos**, **02 - Casos de error** y **03 - CRUD de usuarios**, petición por petición o con **Run collection**.

Cada petición incluye pruebas automáticas (pestaña **Tests**) que verifican el código de estado y el contenido de la respuesta.

| Carpeta | Qué demuestra |
| --- | --- |
| 00 - Autenticación | Login correcto e incorrecto, token en variables |
| 01 - CRUD de proyectos | Crear, listar, ver, actualizar, asignar y quitar usuarios, eliminar y verificar |
| 02 - Casos de error | Sin token, sin permiso, proyectos de otro administrador, datos inválidos |
| 03 - CRUD de usuarios | Crear, listar, filtrar, actualizar, eliminar y sus errores |

## Autor

Julián Henao, Tecnología en Desarrollo de Software.
