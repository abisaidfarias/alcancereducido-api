# API Alcance Reducido

API REST con autenticación JWT para gestión de usuarios y distribuidores, incluyendo generación de códigos QR únicos.

## Características

- ✅ Autenticación JWT (JSON Web Tokens)
- ✅ CRUD completo de usuarios
- ✅ CRUD completo de distribuidores
- ✅ Generación de códigos QR únicos para cada distribuidor
- ✅ Endpoint público para consultar información de distribuidores mediante QR

## Tecnologías

- **Node.js** con **Express**
- **MongoDB** con **Mongoose** (ODM)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **qrcode** para generación de códigos QR
- **Swagger** para documentación interactiva de la API
- **dotenv** para variables de entorno

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Asegúrate de tener MongoDB instalado y corriendo, o usa MongoDB Atlas (cloud).

3. Crear archivo `.env`:
```env
PORT=3000
JWT_SECRET=tu_secret_key_super_segura_aqui
BASE_URL=http://localhost:3000
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/alcancereducido
```

   Para MongoDB Atlas, usa:
   ```env
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido
   ```

4. Iniciar el servidor:
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## Endpoints

### Autenticación

#### Registrar usuario
```
POST /api/auth/register
Body: {
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "usuario" // opcional, default: "usuario"
}
```

#### Iniciar sesión
```
POST /api/auth/login
Body: {
  "email": "juan@example.com",
  "password": "password123"
}
```

#### Obtener perfil (requiere token)
```
GET /api/auth/profile
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Usuarios (requieren autenticación)

- `GET /api/users` - Listar todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Distribuidores

#### CRUD (requieren autenticación)

- `GET /api/distribuidores` - Listar todos los distribuidores
- `GET /api/distribuidores/:id` - Obtener distribuidor por ID
- `POST /api/distribuidores` - Crear nuevo distribuidor (genera QR automáticamente)
- `PUT /api/distribuidores/:id` - Actualizar distribuidor
- `DELETE /api/distribuidores/:id` - Eliminar distribuidor
- `GET /api/distribuidores/:id/qr` - Generar/regenerar QR para un distribuidor

#### Endpoint público (sin autenticación)

- `GET /api/distribuidores/:slug/info` - Obtener información del distribuidor (usado por el QR)

## Ejemplo de uso

### 1. Registrar un usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "email": "admin@example.com",
    "password": "admin123",
    "rol": "admin"
  }'
```

### 2. Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. Crear un distribuidor
```bash
curl -X POST http://localhost:3000/api/distribuidores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "nombre": "Distribuidor ABC"
  }'
```

La respuesta incluirá el QR code en formato base64 y la URL asociada.

### 4. Obtener información del distribuidor (público)
```bash
curl http://localhost:3000/api/distribuidores/<id_o_nombre>/info
```

## Estructura del proyecto

```
src/
├── config/
│   ├── config.js          # Configuración de la aplicación
│   └── database.js        # Base de datos en memoria (temporal)
├── controllers/
│   ├── authController.js  # Controladores de autenticación
│   ├── userController.js  # Controladores de usuarios
│   └── distribuidorController.js # Controladores de distribuidores
├── middleware/
│   └── auth.js            # Middleware de autenticación JWT
├── models/
│   ├── User.js            # Modelo de Usuario
│   └── Distribuidor.js    # Modelo de Distribuidor
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   ├── userRoutes.js      # Rutas de usuarios
│   └── distribuidorRoutes.js # Rutas de distribuidores
├── services/
│   └── qrService.js       # Servicio de generación de QR
└── server.js              # Punto de entrada de la aplicación
```

## Documentación Swagger

La API incluye documentación interactiva con Swagger. Una vez iniciado el servidor, accede a:

**http://localhost:3000/api-docs**

Desde Swagger UI puedes:
- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde el navegador
- Ver ejemplos de requests y responses
- Autenticarte con JWT usando el botón "Authorize"

## Usuario por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:

- **Email:** `abisaidfarias@gmail.com`
- **Contraseña:** `@Abisaidvero1317`
- **Rol:** `admin`

Este usuario se puede usar para hacer login y obtener un token JWT.

## Notas

- La base de datos es **MongoDB** con Mongoose ODM
- Los campos específicos de distribuidores se agregarán cuando se proporcionen los datos
- El QR contiene una URL única que apunta a la información del distribuidor
- Se puede acceder a la información del distribuidor mediante el ID (MongoDB ObjectId) o nombre (slug)
- Los IDs de MongoDB son ObjectIds de 24 caracteres hexadecimales
- El usuario por defecto solo se crea si no existe previamente

## Próximos pasos

- [ ] Agregar campos específicos de distribuidores
- [ ] Integrar base de datos real (MongoDB, PostgreSQL, etc.)
- [ ] Agregar validaciones más robustas
- [ ] Implementar paginación
- [ ] Agregar tests

