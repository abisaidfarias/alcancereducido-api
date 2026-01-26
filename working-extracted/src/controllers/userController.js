import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Distribuidor } from '../models/Distribuidor.js';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('distribuidorId');
    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').populate('distribuidorId');

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user: user
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al obtener usuario',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación
 */
export const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol, distribuidorId } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren nombre, email y password'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Usuario ya existe',
        message: 'El email ya está registrado'
      });
    }

    // Validar distribuidorId si el rol es distribuidor
    let distId = null;
    if (rol === 'distribuidor') {
      if (!distribuidorId) {
        return res.status(400).json({
          error: 'Distribuidor requerido',
          message: 'Los usuarios tipo distribuidor deben tener un distribuidor asociado'
        });
      }
      
      const distribuidor = await Distribuidor.findById(distribuidorId);
      if (!distribuidor) {
        return res.status(400).json({
          error: 'Distribuidor no encontrado',
          message: 'El distribuidor especificado no existe'
        });
      }
      
      distId = distribuidorId;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'usuario',
      distribuidorId: distId
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser.toJSON()
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
      error: 'Error al crear usuario',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [usuario, admin]
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, distribuidorId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'Email ya en uso',
          message: 'El email ya está registrado por otro usuario'
        });
      }
      user.email = email;
    }

    // Validar distribuidorId si el rol cambia a distribuidor
    if (rol === 'distribuidor') {
      if (!distribuidorId) {
        return res.status(400).json({
          error: 'Distribuidor requerido',
          message: 'Los usuarios tipo distribuidor deben tener un distribuidor asociado'
        });
      }
      
      const distribuidor = await Distribuidor.findById(distribuidorId);
      if (!distribuidor) {
        return res.status(400).json({
          error: 'Distribuidor no encontrado',
          message: 'El distribuidor especificado no existe'
        });
      }
      
      user.distribuidorId = distribuidorId;
    } else if (rol && rol !== 'distribuidor') {
      // Si cambia a otro rol, limpiar distribuidorId
      user.distribuidorId = null;
    }

    // Actualizar campos
    if (nombre) user.nombre = nombre;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (rol) user.rol = rol;

    await user.save();

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: user.toJSON()
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      error: 'Error al actualizar usuario',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar el propio usuario
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propia cuenta',
        message: 'Contacta a otro administrador para eliminar tu cuenta'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al eliminar usuario',
      message: error.message
    });
  }
};
