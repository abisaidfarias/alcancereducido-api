import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      message: 'Debes proporcionar un token JWT en el header Authorization'
    });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token inválido o expirado',
        message: 'El token proporcionado no es válido'
      });
    }
    req.user = decoded; // decoded contiene { id, email, rol }
    next();
  });
};

