# Proyecto Track - Alcance Reducido API

## Fecha de inicio: 22 de enero de 2025

---

## Descripción del Proyecto

API REST para gestión de usuarios y distribuidores con las siguientes características:
- Autenticación mediante tokens JWT (JSON Web Tokens)
- CRUD completo de usuarios
- CRUD completo de distribuidores
- Generación de códigos QR únicos para cada distribuidor
- Endpoint público para consultar información de distribuidores mediante QR
- Almacenamiento de imágenes en Amazon S3
- Despliegue en AWS Elastic Beanstalk con HTTPS

---

## Stack Tecnológico

**Lenguaje:** Node.js con Express
**Razón de elección:** 
- Popular y ampliamente usado para APIs REST
- Excelente soporte para JWT
- Fácil de entender y mantener
- Gran ecosistema de paquetes (QR generation, etc.)

**Dependencias principales:**
- `express`: Framework web
- `mongoose`: ODM para MongoDB
- `jsonwebtoken`: Autenticación JWT
- `bcryptjs`: Hash de contraseñas
- `qrcode`: Generación de códigos QR
- `dotenv`: Variables de entorno
- `cors`: Manejo de CORS
- `swagger-jsdoc`: Generación de documentación Swagger desde comentarios JSDoc
- `swagger-ui-express`: Interfaz UI para documentación Swagger
- `multer`: Middleware para manejo de archivos multipart/form-data
- `multer-s3`: Integración de Multer con Amazon S3
- `@aws-sdk/client-s3`: SDK oficial de AWS para S3
- `@aws-sdk/client-secrets-manager`: SDK oficial de AWS para Secrets Manager
- `uuid`: Generación de identificadores únicos para nombres de archivos

---

## Estructura del Proyecto

```
src/
├── config/
│   ├── config.js          # Configuración de la aplicación
│   ├── database.js        # Conexión a MongoDB
│   ├── initDefaultUser.js # Inicialización de usuario por defecto
│   ├── swagger.js         # Configuración de Swagger
│   ├── s3.js              # Configuración de Amazon S3
│   └── secretsManager.js  # Gestión de secrets de AWS
├── controllers/
│   ├── authController.js  # Controladores de autenticación
│   ├── userController.js  # Controladores de usuarios
│   ├── distribuidorController.js # Controladores de distribuidores
│   ├── dispositivoController.js  # Controladores de dispositivos móviles
│   ├── marcaController.js        # Controladores de marcas
│   └── uploadController.js      # Controladores para subir imágenes
├── middleware/
│   ├── auth.js            # Middleware de autenticación JWT
│   ├── permissions.js     # Middleware de permisos (admin, distribuidor)
│   └── upload.js          # Middleware para subir imágenes a S3
├── models/
│   ├── User.js            # Modelo de Usuario
│   ├── Distribuidor.js    # Modelo de Distribuidor
│   ├── Dispositivo.js     # Modelo de Dispositivo Móvil
│   └── Marca.js           # Modelo de Marca
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   ├── userRoutes.js      # Rutas de usuarios
│   ├── distribuidorRoutes.js # Rutas de distribuidores
│   ├── dispositivoRoutes.js  # Rutas de dispositivos móviles
│   ├── marcaRoutes.js        # Rutas de marcas
│   └── uploadRoutes.js       # Rutas para subir imágenes
├── services/
│   └── qrService.js       # Servicio de generación de QR
└── server.js              # Punto de entrada de la aplicación
```

---

## Historial de Cambios

### 2025-01-22 - Inicio del Proyecto
- ✅ Creación de estructura base del proyecto
- ✅ Configuración de Express y MongoDB
- ✅ Implementación de autenticación JWT
- ✅ CRUD de usuarios y distribuidores
- ✅ Generación de códigos QR

### 2025-01-23 - Sistema de Dispositivos y Marcas
- ✅ Implementación de CRUD de dispositivos móviles
- ✅ Implementación de CRUD de marcas
- ✅ Relación muchos a muchos entre Distribuidor y Dispositivo
- ✅ Sistema de permisos (admin, distribuidor)
- ✅ Endpoint público para obtener distribuidor por representante

### 2025-01-24 - Integración con AWS S3
- ✅ Configuración de Amazon S3 para almacenamiento de imágenes
- ✅ Endpoints para subir imágenes (`POST /api/upload` y `/api/upload/multiple`)
- ✅ Validación de tipos de archivo (JPEG, PNG, GIF, WEBP)
- ✅ Límite de tamaño: 5MB por archivo
- ✅ Organización automática en carpetas (logos/, fotos/, general/)
- ✅ Nombres únicos usando UUID
- ✅ Scripts automatizados para configurar S3 (Bash y PowerShell)
- ✅ Corrección de error ACLs: Removido `acl: 'public-read'` para compatibilidad con buckets que bloquean ACLs

### 2025-01-25 - Despliegue en AWS
- ✅ Configuración de AWS Secrets Manager para variables sensibles
- ✅ Despliegue en AWS Elastic Beanstalk
- ✅ Configuración de HTTPS con Application Load Balancer
- ✅ Solicitud de certificado SSL en AWS Certificate Manager
- ✅ Configuración de dominio `api.alcance-reducido.com`
- ✅ Integración con Route 53 para DNS
- ✅ Configuración de Security Groups para ALB
- ✅ Scripts automatizados para configuración de HTTPS

### 2025-01-26 - Mejoras y Ajustes
- ✅ Agregado campo `fechaPublicacion` al modelo `Dispositivo`
- ✅ Agregado campo `nombreRepresentante` al modelo `Distribuidor`
- ✅ Actualización de documentación Swagger
- ✅ Configuración de Git y GitHub
- ✅ Limpieza de archivos innecesarios (MD y ZIP)

---

## Funcionalidades Implementadas

### 1. Autenticación JWT
- ✅ Registro de usuarios (`POST /api/auth/register`)
- ✅ Login de usuarios (`POST /api/auth/login`)
- ✅ Obtener perfil (`GET /api/auth/profile`)
- ✅ Middleware de autenticación para proteger rutas

### 2. CRUD de Usuarios
- ✅ Listar todos los usuarios (`GET /api/users`)
- ✅ Obtener usuario por ID (`GET /api/users/:id`)
- ✅ Crear usuario (`POST /api/users`)
- ✅ Actualizar usuario (`PUT /api/users/:id`)
- ✅ Eliminar usuario (`DELETE /api/users/:id`)

### 3. CRUD de Distribuidores
- ✅ Listar todos los distribuidores (`GET /api/distribuidores`)
- ✅ Obtener distribuidor por ID (`GET /api/distribuidores/:id`)
- ✅ Obtener distribuidor por representante (`GET /api/distribuidores/representante/:representante`)
- ✅ Crear distribuidor (`POST /api/distribuidores`) - Genera QR automáticamente
- ✅ Actualizar distribuidor (`PUT /api/distribuidores/:id`)
- ✅ Eliminar distribuidor (`DELETE /api/distribuidores/:id`)
- ✅ Generar/regenerar QR (`GET /api/distribuidores/:id/qr`)
- ✅ Endpoint público (`GET /api/distribuidores/:slug/info`)
- ✅ Campo `nombreRepresentante` agregado

### 4. CRUD de Dispositivos Móviles
- ✅ Listar todos los dispositivos (`GET /api/dispositivos`) - Con filtros por marca y banda
- ✅ Obtener dispositivo por ID (`GET /api/dispositivos/:id`)
- ✅ Crear dispositivo (`POST /api/dispositivos`) - Solo admin
- ✅ Actualizar dispositivo (`PUT /api/dispositivos/:id`) - Solo admin
- ✅ Eliminar dispositivo (`DELETE /api/dispositivos/:id`) - Solo admin
- ✅ Campos: marca, modelo, imagen, banda, fechaPublicacion
- ✅ Relación muchos a muchos con Distribuidores
- ✅ Distribuidores solo pueden VER sus dispositivos asociados

### 5. CRUD de Marcas
- ✅ Listar todas las marcas (`GET /api/marcas`)
- ✅ Obtener marca por ID (`GET /api/marcas/:id`)
- ✅ Crear marca (`POST /api/marcas`) - Solo admin
- ✅ Actualizar marca (`PUT /api/marcas/:id`) - Solo admin
- ✅ Eliminar marca (`DELETE /api/marcas/:id`) - Solo admin

### 6. Servicio de QR
- ✅ Generación de QR único para cada distribuidor
- ✅ URL construida con formato: `{BASE_URL}/api/distribuidores/{id_o_nombre}/info`
- ✅ Endpoint público para consultar información (`GET /api/distribuidores/:slug/info`)
- ✅ QR retornado en formato base64 (data URL)

### 7. Sistema de Permisos y Relaciones
- ✅ Usuarios con rol "distribuidor" deben tener un Distribuidor asociado
- ✅ Relación muchos a muchos entre Distribuidor y Dispositivo
- ✅ Middleware de permisos: checkAdmin, checkDistribuidor, checkAdminOrDistribuidor
- ✅ Administradores: CRUD completo de distribuidores y dispositivos
- ✅ Distribuidores: Solo lectura de su distribuidor y dispositivos asociados
- ✅ Validación automática de relaciones al crear/actualizar

### 8. Almacenamiento de Imágenes en S3
- ✅ Configuración de Amazon S3 para almacenar imágenes
- ✅ Endpoint para subir imágenes (`POST /api/upload`) - Solo admin
- ✅ Endpoint para subir múltiples imágenes (`POST /api/upload/multiple`) - Solo admin
- ✅ Validación de tipos de archivo (JPEG, PNG, GIF, WEBP)
- ✅ Límite de tamaño: 5MB por archivo
- ✅ Generación automática de URLs públicas
- ✅ Organización automática en carpetas (logos/, fotos/, general/)
- ✅ Nombres únicos usando UUID para evitar colisiones
- ✅ Scripts automatizados para configurar S3 (Bash y PowerShell)

### 9. Documentación Swagger
- ✅ Documentación completa de la API en `/api-docs`
- ✅ Interfaz interactiva para probar endpoints
- ✅ Autenticación JWT integrada en Swagger UI
- ✅ Todos los endpoints documentados con ejemplos
- ✅ Schemas actualizados (Dispositivo, Distribuidor, Marca)

### 10. Despliegue en AWS
- ✅ Configuración de AWS Secrets Manager
- ✅ Despliegue en AWS Elastic Beanstalk
- ✅ Configuración de HTTPS con Application Load Balancer
- ✅ Certificado SSL en AWS Certificate Manager
- ✅ Dominio configurado: `api.alcance-reducido.com`
- ✅ Integración con Route 53 para DNS
- ✅ Configuración de Security Groups
- ✅ Scripts automatizados para configuración

### 11. Usuario por Defecto
- ✅ Usuario administrador creado automáticamente al inicializar la BD
- ✅ Email: `abisaidfarias@gmail.com`
- ✅ Contraseña: `@Abisaidvero1317`
- ✅ Rol: `admin`
- ✅ Solo se crea si no existe previamente

---

## Modelos de Datos

### Distribuidor
```javascript
{
  representante: String (required, unique),
  nombreRepresentante: String (optional),
  domicilio: String,
  email: String (validated),
  sitioWeb: String (validated),
  logo: String,
  dispositivos: [ObjectId] (ref: Dispositivo),
  createdAt: Date,
  updatedAt: Date
}
```

### Dispositivo
```javascript
{
  marca: ObjectId (ref: Marca, required),
  modelo: String (required),
  tipo: String,
  foto: String,
  fechaPublicacion: Date,
  distribuidores: [ObjectId] (ref: Distribuidor),
  createdAt: Date,
  updatedAt: Date
}
```

### Marca
```javascript
{
  nombre: String (required, unique),
  createdAt: Date,
  updatedAt: Date
}
```

### User
```javascript
{
  nombre: String (required),
  email: String (required, unique, validated),
  password: String (required, hashed),
  rol: String (enum: ['admin', 'distribuidor', 'usuario']),
  distribuidorAsociado: ObjectId (ref: Distribuidor, optional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Variables de Entorno

### Local (.env)
```env
PORT=3000
JWT_SECRET=tu_secret_key_super_segura_aqui
BASE_URL=http://localhost:3000
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido

# Configuración de S3 (opcional)
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=alcancereducido-images
```

### Producción (AWS Secrets Manager)
- `alcancereducido/jwt-secret`
- `alcancereducido/mongodb-uri`
- `alcancereducido/base-url`
- `alcancereducido/jwt-expires-in`

---

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere token)

### Usuarios (requieren autenticación)
- `GET /api/users` - Listar todos
- `GET /api/users/:id` - Obtener por ID
- `POST /api/users` - Crear
- `PUT /api/users/:id` - Actualizar
- `DELETE /api/users/:id` - Eliminar

### Distribuidores
- `GET /api/distribuidores` - Listar todos (requiere autenticación)
- `GET /api/distribuidores/:id` - Obtener por ID (requiere autenticación)
- `GET /api/distribuidores/representante/:representante` - Obtener por representante (requiere autenticación)
- `GET /api/distribuidores/:slug/info` - Obtener información pública (sin autenticación)
- `POST /api/distribuidores` - Crear (requiere admin)
- `PUT /api/distribuidores/:id` - Actualizar (requiere admin)
- `DELETE /api/distribuidores/:id` - Eliminar (requiere admin)
- `GET /api/distribuidores/:id/qr` - Generar/regenerar QR (requiere autenticación)

### Dispositivos (requieren autenticación)
- `GET /api/dispositivos` - Listar todos (con filtros)
- `GET /api/dispositivos/:id` - Obtener por ID
- `POST /api/dispositivos` - Crear (solo admin)
- `PUT /api/dispositivos/:id` - Actualizar (solo admin)
- `DELETE /api/dispositivos/:id` - Eliminar (solo admin)

### Marcas (requieren autenticación)
- `GET /api/marcas` - Listar todas
- `GET /api/marcas/:id` - Obtener por ID
- `POST /api/marcas` - Crear (solo admin)
- `PUT /api/marcas/:id` - Actualizar (solo admin)
- `DELETE /api/marcas/:id` - Eliminar (solo admin)

### Upload (requieren admin)
- `POST /api/upload` - Subir imagen única
- `POST /api/upload/multiple` - Subir múltiples imágenes

---

## Comandos Disponibles

```bash
npm install          # Instalar dependencias
npm start           # Iniciar servidor en producción
npm run dev         # Iniciar servidor en desarrollo (con nodemon)
```

---

## URLs de Producción

- **API Base:** `https://api.alcance-reducido.com`
- **Swagger UI:** `https://api.alcance-reducido.com/api-docs`
- **Health Check:** `https://api.alcance-reducido.com/`

---

## Credenciales por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:
- **Email:** `abisaidfarias@gmail.com`
- **Contraseña:** `@Abisaidvero1317`
- **Rol:** `admin`

---

## Notas Técnicas

- **Base de datos:** MongoDB con Mongoose ODM
- **Documentación:** Swagger UI disponible en `/api-docs`
- El QR contiene una URL única que apunta a la información del distribuidor
- Se puede acceder a la información del distribuidor mediante el ID (MongoDB ObjectId) o nombre (slug)
- Los IDs de MongoDB son ObjectIds de 24 caracteres hexadecimales
- Las contraseñas se almacenan con hash usando bcryptjs
- Los tokens JWT tienen expiración configurable (default: 24h)
- Todas las rutas requieren autenticación, excepto el endpoint de información pública del distribuidor
- Los modelos usan Mongoose Schemas con validaciones integradas
- Timestamps automáticos (createdAt, updatedAt) gestionados por Mongoose
- Usuario por defecto se crea automáticamente en la primera conexión a la BD
- La aplicación puede usar AWS Secrets Manager o variables de entorno (configurable con `USE_AWS_SECRETS`)

---

## Próximos Pasos

1. **Futuro:** Agregar validaciones más robustas
2. **Futuro:** Implementar paginación
3. **Futuro:** Agregar tests unitarios e integración
4. **Futuro:** Agregar índices adicionales en MongoDB para optimizar búsquedas
5. **Futuro:** Implementar rate limiting
6. **Futuro:** Agregar logging estructurado
7. **Futuro:** Implementar CI/CD con GitHub Actions

