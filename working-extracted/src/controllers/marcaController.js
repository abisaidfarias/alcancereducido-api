import { Marca } from '../models/Marca.js';

/**
 * @swagger
 * /api/marcas:
 *   get:
 *     summary: Listar todas las marcas
 *     tags: [Marcas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fabricante
 *         schema:
 *           type: string
 *         description: Filtrar por fabricante
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *     responses:
 *       200:
 *         description: Lista de marcas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 marcas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Marca'
 */
export const getAllMarcas = async (req, res) => {
  try {
    const { fabricante, marca } = req.query;
    const filter = {};
    
    if (fabricante) {
      filter.fabricante = { $regex: new RegExp(fabricante, 'i') };
    }
    
    if (marca) {
      filter.marca = { $regex: new RegExp(marca, 'i') };
    }

    const marcas = await Marca.find(filter).sort({ createdAt: -1 });
    
    res.json({
      count: marcas.length,
      marcas: marcas
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener marcas',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/marcas/{id}:
 *   get:
 *     summary: Obtener marca por ID
 *     tags: [Marcas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la marca (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Marca encontrada
 *       404:
 *         description: Marca no encontrada
 */
export const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    const marca = await Marca.findById(id);

    if (!marca) {
      return res.status(404).json({
        error: 'Marca no encontrada'
      });
    }

    res.json({
      marca: marca
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al obtener marca',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/marcas:
 *   post:
 *     summary: Crear una nueva marca
 *     tags: [Marcas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fabricante
 *               - marca
 *             properties:
 *               fabricante:
 *                 type: string
 *                 example: "Samsung Electronics"
 *               marca:
 *                 type: string
 *                 example: "Samsung"
 *               logo:
 *                 type: string
 *                 example: "https://example.com/logo-samsung.png"
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *       400:
 *         description: Error de validación
 */
export const createMarca = async (req, res) => {
  try {
    const { fabricante, marca, logo } = req.body;

    if (!fabricante || !marca) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren fabricante y marca'
      });
    }

    const newMarca = await Marca.create({
      fabricante,
      marca,
      logo: logo || ''
    });

    res.status(201).json({
      message: 'Marca creada exitosamente',
      marca: newMarca
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
      error: 'Error al crear marca',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/marcas/{id}:
 *   put:
 *     summary: Actualizar marca
 *     tags: [Marcas]
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
 *               fabricante:
 *                 type: string
 *               marca:
 *                 type: string
 *               logo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Marca actualizada
 *       404:
 *         description: Marca no encontrada
 */
export const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const marca = await Marca.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!marca) {
      return res.status(404).json({
        error: 'Marca no encontrada'
      });
    }

    res.json({
      message: 'Marca actualizada exitosamente',
      marca: marca
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
      error: 'Error al actualizar marca',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/marcas/{id}:
 *   delete:
 *     summary: Eliminar marca
 *     tags: [Marcas]
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
 *         description: Marca eliminada
 *       404:
 *         description: Marca no encontrada
 */
export const deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;

    const marca = await Marca.findByIdAndDelete(id);
    if (!marca) {
      return res.status(404).json({
        error: 'Marca no encontrada'
      });
    }

    res.json({
      message: 'Marca eliminada exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al eliminar marca',
      message: error.message
    });
  }
};

