import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkAdmin, checkAdminOrDistribuidor } from '../middleware/permissions.js';
import {
  getAllDispositivos,
  getDispositivoById,
  createDispositivo,
  updateDispositivo,
  deleteDispositivo
} from '../controllers/dispositivoController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de lectura: Admin o Distribuidor
router.get('/', checkAdminOrDistribuidor, getAllDispositivos);
router.get('/:id', checkAdminOrDistribuidor, getDispositivoById);

// Rutas de escritura: Solo Admin
router.post('/', checkAdmin, createDispositivo);
router.put('/:id', checkAdmin, updateDispositivo);
router.delete('/:id', checkAdmin, deleteDispositivo);

export default router;

