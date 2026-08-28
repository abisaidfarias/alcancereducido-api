import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rutas públicas (con límite de intentos para mitigar fuerza bruta)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Ruta protegida
router.get('/profile', authenticateToken, getProfile);

export default router;









