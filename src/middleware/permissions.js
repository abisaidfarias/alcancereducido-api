import { User } from '../models/User.js';

/**
 * Middleware para verificar que el usuario es administrador
 */
export const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    if (user.rol !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los administradores pueden realizar esta acción'
      });
    }

    req.userData = user; // Agregar datos completos del usuario
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Error al verificar permisos',
      message: error.message
    });
  }
};

/**
 * Middleware para verificar que el usuario es distribuidor
 */
export const checkDistribuidor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('distribuidorId');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    if (user.rol !== 'distribuidor') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los distribuidores pueden realizar esta acción'
      });
    }

    if (!user.distribuidorId) {
      return res.status(400).json({
        error: 'Distribuidor no asociado',
        message: 'El usuario distribuidor no tiene un distribuidor asociado'
      });
    }

    req.userData = user; // Agregar datos completos del usuario con distribuidor
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Error al verificar permisos',
      message: error.message
    });
  }
};

/**
 * Middleware para verificar que el usuario es admin o distribuidor
 */
export const checkAdminOrDistribuidor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('distribuidorId');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    if (user.rol !== 'admin' && user.rol !== 'distribuidor') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo administradores y distribuidores pueden acceder'
      });
    }

    req.userData = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Error al verificar permisos',
      message: error.message
    });
  }
};



