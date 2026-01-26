import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';
import { User } from '../models/User.js';
import { Distribuidor } from '../models/Distribuidor.js';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Error de validación o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren nombre, email y password'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validar distribuidorId si el rol es distribuidor
    let distribuidorId = null;
    if (rol === 'distribuidor') {
      const { distribuidorId: distId } = req.body;
      if (!distId) {
        return res.status(400).json({
          error: 'Distribuidor requerido',
          message: 'Los usuarios tipo distribuidor deben tener un distribuidor asociado'
        });
      }
      
      // Verificar que el distribuidor existe
      const distribuidor = await Distribuidor.findById(distId);
      if (!distribuidor) {
        return res.status(400).json({
          error: 'Distribuidor no encontrado',
          message: 'El distribuidor especificado no existe'
        });
      }
      
      distribuidorId = distId;
    }

    // Crear nuevo usuario
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'usuario',
      distribuidorId: distribuidorId
    });

    // Generar token
    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email, rol: newUser.rol },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.toJSON(),
      token
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      error: 'Error al registrar usuario',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren email y password'
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o password incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o password incorrectos'
      });
    }

    // Generar token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, rol: user.rol },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      message: 'Login exitoso',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: error.message
    });
  }
};
