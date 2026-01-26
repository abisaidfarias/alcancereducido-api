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
│   └── distribuidorController.js # Controladores de distribuidores
├── middleware/
│   ├── auth.js            # Middleware de autenticación JWT
│   ├── permissions.js     # Middleware de permisos (admin, distribuidor)
│   └── upload.js          # Middleware para subir imágenes a S3
├── models/
│   ├── User.js            # Modelo de Usuario
│   ├── Distribuidor.js    # Modelo de Distribuidor
│   └── Dispositivo.js     # Modelo de Dispositivo Móvil
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   ├── userRoutes.js      # Rutas de usuarios
│   ├── distribuidorRoutes.js # Rutas de distribuidores
│   ├── dispositivoRoutes.js  # Rutas de dispositivos móviles
│   ├── marcaRoutes.js        # Rutas de marcas
│   └── uploadRoutes.js       # Rutas para subir imágenes
├── controllers/
│   ├── authController.js  # Controladores de autenticación
│   ├── userController.js  # Controladores de usuarios
│   ├── distribuidorController.js # Controladores de distribuidores
│   ├── dispositivoController.js  # Controladores de dispositivos móviles
│   ├── marcaController.js        # Controladores de marcas
│   └── uploadController.js      # Controladores para subir imágenes
├── services/
│   └── qrService.js       # Servicio de generación de QR
└── server.js              # Punto de entrada de la aplicación
```

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
- ✅ Crear distribuidor (`POST /api/distribuidores`) - Genera QR automáticamente
- ✅ Actualizar distribuidor (`PUT /api/distribuidores/:id`)
- ✅ Eliminar distribuidor (`DELETE /api/distribuidores/:id`)
- ✅ Generar/regenerar QR (`GET /api/distribuidores/:id/qr`)

### 4. Servicio de QR
- ✅ Generación de QR único para cada distribuidor
- ✅ URL construida con formato: `{BASE_URL}/api/distribuidores/{id_o_nombre}/info`
- ✅ Endpoint público para consultar información (`GET /api/distribuidores/:slug/info`)
- ✅ QR retornado en formato base64 (data URL)

### 5. Usuario por Defecto
- ✅ Usuario administrador creado automáticamente al inicializar la BD
- ✅ Email: `abisaidfarias@gmail.com`
- ✅ Contraseña: `@Abisaidvero1317`
- ✅ Rol: `admin`
- ✅ Solo se crea si no existe previamente

### 6. CRUD de Dispositivos Móviles
- ✅ Listar todos los dispositivos (`GET /api/dispositivos`) - Con filtros por marca y banda
- ✅ Obtener dispositivo por ID (`GET /api/dispositivos/:id`)
- ✅ Crear dispositivo (`POST /api/dispositivos`) - Solo admin
- ✅ Actualizar dispositivo (`PUT /api/dispositivos/:id`) - Solo admin
- ✅ Eliminar dispositivo (`DELETE /api/dispositivos/:id`) - Solo admin
- ✅ Campos: marca, modelo, imagen, banda (extensible para más campos)
- ✅ Relación muchos a muchos con Distribuidores
- ✅ Distribuidores solo pueden VER sus dispositivos asociados

### 7. Sistema de Permisos y Relaciones
- ✅ Usuarios con rol "distribuidor" deben tener un Distribuidor asociado
- ✅ Relación muchos a muchos entre Distribuidor y Dispositivo
- ✅ Middleware de permisos: checkAdmin, checkDistribuidor, checkAdminOrDistribuidor
- ✅ Administradores: CRUD completo de distribuidores y dispositivos
- ✅ Distribuidores: Solo lectura de su distribuidor y dispositivos asociados
- ✅ Validación automática de relaciones al crear/actualizar

### 8. Documentación Swagger
- ✅ Documentación completa de la API en `/api-docs`
- ✅ Interfaz interactiva para probar endpoints
- ✅ Autenticación JWT integrada en Swagger UI
- ✅ Todos los endpoints documentados con ejemplos
- ✅ Schema de Dispositivo agregado a Swagger

### 9. Almacenamiento de Imágenes en S3
- ✅ Configuración de Amazon S3 para almacenar imágenes
- ✅ Endpoint para subir imágenes (`POST /api/upload`) - Solo admin
- ✅ Endpoint para subir múltiples imágenes (`POST /api/upload/multiple`) - Solo admin
- ✅ Validación de tipos de archivo (JPEG, PNG, GIF, WEBP)
- ✅ Límite de tamaño: 5MB por archivo
- ✅ Generación automática de URLs públicas
- ✅ Organización automática en carpetas (logos/, fotos/, general/)
- ✅ Nombres únicos usando UUID para evitar colisiones
- ✅ Scripts automatizados para configurar S3 (Bash y PowerShell)
- ✅ Documentación completa en `S3-SETUP.md`
- ✅ Corrección de error ACLs: Removido `acl: 'public-read'` para compatibilidad con buckets que bloquean ACLs

### 10. Configuración HTTPS con Application Load Balancer
- ✅ Script automatizado para configurar HTTPS (`scripts/setup-https-alb.ps1`)
- ✅ Solicitud automática de certificado SSL en AWS Certificate Manager
- ✅ Creación de Application Load Balancer (ALB)
- ✅ Configuración de Target Group para instancias EC2
- ✅ Configuración de Listeners (HTTP → HTTPS redirect, HTTPS con certificado)
- ✅ Integración con Route 53 para DNS automático
- ✅ Script auxiliar para configurar listener después de validar certificado
- ✅ Documentación completa en `HTTPS-SETUP.md`
- ✅ Configuración para dominio `api.alcance-reducido.com`

---

## Estado Actual

**Base de datos:** MongoDB con Mongoose ODM
**Modelo de Distribuidor:** Estructura base creada con Mongoose Schema, pendiente agregar campos específicos cuando el usuario proporcione los datos

---

## Próximos Pasos

1. **Pendiente:** Recibir datos específicos de distribuidores para completar el modelo
2. **Futuro:** Agregar validaciones más robustas
3. **Futuro:** Implementar paginación
4. **Futuro:** Agregar tests unitarios e integración
5. **Futuro:** Agregar índices adicionales en MongoDB para optimizar búsquedas

---

## Notas Técnicas

- **Base de datos:** MongoDB con Mongoose ODM
- **Documentación:** Swagger UI disponible en `/api-docs`
- El QR contiene una URL única que apunta a la información del distribuidor
- Se puede acceder a la información del distribuidor mediante el ID (MongoDB ObjectId) o nombre (slug)
- Los IDs de MongoDB son ObjectIds de 24 caracteres hexadecimales
- Las contraseñas se almacenan con hash usando bcryptjs
- Los tokens JWT tienen expiración configurable (default: 24h)
- Todas las rutas de usuarios y distribuidores requieren autenticación, excepto el endpoint de información pública del distribuidor
- Los modelos usan Mongoose Schemas con validaciones integradas
- Timestamps automáticos (createdAt, updatedAt) gestionados por Mongoose
- Usuario por defecto se crea automáticamente en la primera conexión a la BD

---

## Variables de Entorno Requeridas

```env
PORT=3000
JWT_SECRET=tu_secret_key_super_segura_aqui
BASE_URL=http://localhost:3000
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb+srv://lbtechcloud_db_user:ibfUVFma1nstGPF4@prod.hvfzaqi.mongodb.net/alcancereducido

# Configuración de S3 (opcional, para almacenamiento de imágenes)
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=alcancereducido-images
```

**Nota:** La URL de MongoDB Atlas ya está configurada en el archivo `.env`. Asegúrate de que el archivo `.env` esté presente en el directorio raíz del proyecto.

---

## Comandos Disponibles

```bash
npm install          # Instalar dependencias
npm start           # Iniciar servidor en producción
npm run dev         # Iniciar servidor en desarrollo (con nodemon)
```

## Acceso a Documentación

Una vez iniciado el servidor, accede a:
- **Swagger UI:** http://localhost:3000/api-docs
- **API Root:** http://localhost:3000/

## Credenciales por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:
- **Email:** abisaidfarias@gmail.com
- **Contraseña:** @Abisaidvero1317
- **Rol:** admin

Este usuario se puede usar para hacer login y obtener un token JWT para probar los endpoints protegidos.

