import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config.js';
import { connectDB } from './config/database.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import distribuidorRoutes from './routes/distribuidorRoutes.js';
import dispositivoRoutes from './routes/dispositivoRoutes.js';
import marcaRoutes from './routes/marcaRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Alcance Reducido - Documentación'
}));

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'API Alcance Reducido',
    version: '1.0.0',
    documentation: '/api-docs',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        distribuidores: '/api/distribuidores',
        dispositivos: '/api/dispositivos',
        dispositivosPublic: '/api/dispositivos/public',
        marcas: '/api/marcas',
        upload: '/api/upload'
      }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/distribuidores', distribuidorRoutes);
app.use('/api/dispositivos', dispositivoRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/upload', uploadRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Conectar a MongoDB y luego iniciar servidor
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
      console.log(`📚 Documentación Swagger: http://localhost:${config.port}/api-docs`);
      console.log(`📝 Endpoints disponibles:`);
      console.log(`   - POST /api/auth/register`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - GET  /api/auth/profile (requiere token)`);
      console.log(`   - CRUD /api/users (requiere token)`);
      console.log(`   - CRUD /api/distribuidores (requiere token)`);
      console.log(`   - GET  /api/distribuidores/:slug/info (público)`);
      console.log(`   - GET  /api/dispositivos/public (público)`);
      console.log(`   - CRUD /api/dispositivos (requiere token)`);
      console.log(`   - CRUD /api/marcas (requiere token, solo admin para crear/editar/eliminar)`);
      console.log(`   - POST /api/upload (requiere token, solo admin)`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

