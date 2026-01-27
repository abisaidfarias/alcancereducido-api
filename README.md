# API Alcance Reducido

API REST con autenticación JWT para gestión de usuarios, distribuidores, dispositivos móviles y marcas, incluyendo generación de códigos QR únicos y almacenamiento de imágenes en Amazon S3.

## 🚀 Características

- ✅ Autenticación JWT (JSON Web Tokens)
- ✅ CRUD completo de usuarios, distribuidores, dispositivos y marcas
- ✅ Generación de códigos QR únicos para cada distribuidor
- ✅ Endpoint público para consultar información de distribuidores mediante QR
- ✅ Almacenamiento de imágenes en Amazon S3
- ✅ Documentación interactiva con Swagger
- ✅ Despliegue en AWS Elastic Beanstalk con HTTPS

## 🛠️ Tecnologías

- **Node.js** con **Express**
- **MongoDB** con **Mongoose** (ODM)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **qrcode** para generación de códigos QR
- **Swagger** para documentación interactiva de la API
- **Multer** y **Multer-S3** para subida de imágenes
- **AWS SDK** para integración con S3 y Secrets Manager
- **dotenv** para variables de entorno

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crear archivo `.env` en la raíz del proyecto:
```env
PORT=3000
JWT_SECRET=tu_secret_key_super_segura_aqui
BASE_URL=http://localhost:3000
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/alcancereducido
```

Para MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido
```

Para usar S3 (opcional):
```env
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=alcancereducido-images
```

3. **Iniciar el servidor:**
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## 📚 Documentación

### Swagger UI

Una vez iniciado el servidor, accede a la documentación interactiva:

**Local:** http://localhost:3000/api-docs  
**Producción:** https://api.alcance-reducido.com/api-docs

Desde Swagger UI puedes:
- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde el navegador
- Ver ejemplos de requests y responses
- Autenticarte con JWT usando el botón "Authorize"

## 🔐 Autenticación

### Registrar usuario
```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "usuario"  // opcional: "admin", "distribuidor", "usuario"
}
```

### Iniciar sesión
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

### Usar token
```bash
GET /api/users
Authorization: Bearer <tu_token>
```

## 📡 Endpoints Principales

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
- `GET /api/distribuidores/representante/:representante` - Obtener por representante
- `GET /api/distribuidores/:slug/info` - **Público** - Obtener información del distribuidor
- `POST /api/distribuidores` - Crear (requiere admin)
- `PUT /api/distribuidores/:id` - Actualizar (requiere admin)
- `DELETE /api/distribuidores/:id` - Eliminar (requiere admin)
- `GET /api/distribuidores/:id/qr` - Generar/regenerar QR

### Dispositivos (requieren autenticación)
- `GET /api/dispositivos` - Listar todos (con filtros por marca y banda)
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

### Upload de Imágenes (requiere admin)
- `POST /api/upload` - Subir imagen única
  - Campo: `image` (multipart/form-data)
  - Tipos permitidos: JPEG, PNG, GIF, WEBP
  - Tamaño máximo: 5MB
  - Retorna: URL pública de S3

- `POST /api/upload/multiple` - Subir múltiples imágenes
  - Campo: `images` (array de archivos)
  - Mismas validaciones que upload único
  - Retorna: Array de URLs públicas

## 🔑 Usuario por Defecto

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:

- **Email:** `abisaidfarias@gmail.com`
- **Contraseña:** `@Abisaidvero1317`
- **Rol:** `admin`

Este usuario se puede usar para hacer login y obtener un token JWT.

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración (DB, S3, Swagger, Secrets)
├── controllers/     # Lógica de negocio
├── middleware/      # Autenticación, permisos, upload
├── models/          # Modelos de Mongoose
├── routes/          # Definición de rutas
├── services/        # Servicios (QR, etc.)
└── server.js        # Punto de entrada
```

## 🌐 URLs de Producción

- **API Base:** https://api.alcance-reducido.com
- **Swagger UI:** https://api.alcance-reducido.com/api-docs
- **Health Check:** https://api.alcance-reducido.com/

## 🔒 Permisos

- **Admin:** Acceso completo a todos los recursos
- **Distribuidor:** Solo lectura de su distribuidor y dispositivos asociados
- **Usuario:** Acceso básico según configuración

## 📝 Notas

- La base de datos es **MongoDB** con Mongoose ODM
- El QR contiene una URL única que apunta a la información del distribuidor
- Se puede acceder a la información del distribuidor mediante el ID (MongoDB ObjectId) o nombre (slug)
- Los IDs de MongoDB son ObjectIds de 24 caracteres hexadecimales
- Las contraseñas se almacenan con hash usando bcryptjs
- Los tokens JWT tienen expiración configurable (default: 24h)
- El usuario por defecto solo se crea si no existe previamente

## 📖 Historial de Cambios

Ver `PROJECT-TRACK.md` para el historial completo de cambios y funcionalidades implementadas.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado.
