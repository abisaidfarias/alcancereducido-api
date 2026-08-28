import rateLimit from 'express-rate-limit';

/**
 * Límite de intentos para endpoints de autenticación (login/registro).
 * Mitiga ataques de fuerza bruta / credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos',
    message: 'Has excedido el número de intentos permitidos. Intenta nuevamente en unos minutos.',
  },
});
