import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/permissions.js';
import {
  getAllMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca
} from '../controllers/marcaController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de lectura: Cualquier usuario autenticado puede ver
router.get('/', getAllMarcas);
router.get('/:id', getMarcaById);

// Rutas de escritura: Solo Admin
router.post('/', checkAdmin, createMarca);
router.put('/:id', checkAdmin, updateMarca);
router.delete('/:id', checkAdmin, deleteMarca);

export default router;



