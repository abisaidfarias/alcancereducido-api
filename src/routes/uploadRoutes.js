import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/permissions.js';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// Todas las rutas de upload requieren autenticación
router.use(authenticateToken);

// Subir una sola imagen
// POST /api/upload
router.post('/', checkAdmin, uploadSingle('image'), uploadImage);

// Subir múltiples imágenes
// POST /api/upload/multiple
router.post('/multiple', checkAdmin, uploadMultiple('images', 10), uploadMultipleImages);

export default router;








