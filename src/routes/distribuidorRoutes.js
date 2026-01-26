import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkAdmin, checkAdminOrDistribuidor } from '../middleware/permissions.js';
import {
  getAllDistribuidores,
  getNombresDistribuidores,
  getDistribuidorById,
  createDistribuidor,
  updateDistribuidor,
  deleteDistribuidor,
  getDistribuidorInfo,
  generateQR,
  getDistribuidorByRepresentante
} from '../controllers/distribuidorController.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/nombres', getNombresDistribuidores);
router.get('/:slug/info', getDistribuidorInfo);
router.get('/representante/:representante', getDistribuidorByRepresentante);

// Todas las demás rutas requieren autenticación
router.use(authenticateToken);

// Rutas de lectura: Admin o Distribuidor
router.get('/', checkAdminOrDistribuidor, getAllDistribuidores);
router.get('/:id', checkAdminOrDistribuidor, getDistribuidorById);
router.get('/:id/qr', checkAdminOrDistribuidor, generateQR);

// Rutas de escritura: Solo Admin
router.post('/', checkAdmin, createDistribuidor);
router.put('/:id', checkAdmin, updateDistribuidor);
router.delete('/:id', checkAdmin, deleteDistribuidor);

export default router;

