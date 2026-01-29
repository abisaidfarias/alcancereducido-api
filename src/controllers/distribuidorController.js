import { Distribuidor } from '../models/Distribuidor.js';
import { Dispositivo } from '../models/Dispositivo.js';
import { generateQRForDistribuidor } from '../services/qrService.js';

/**
 * @swagger
 * /api/distribuidores:
 *   get:
 *     summary: Listar todos los distribuidores
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de distribuidores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 distribuidores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Distribuidor'
 */
/**
 * @swagger
 * /api/distribuidores/nombres:
 *   get:
 *     summary: Obtener lista pública de nombres de distribuidores
 *     tags: [Distribuidores]
 *     description: Endpoint público que retorna los nombres (representantes) y nombreRepresentante de todos los distribuidores
 *     responses:
 *       200:
 *         description: Lista de nombres de distribuidores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 distribuidores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       representante:
 *                         type: string
 *                       nombreRepresentante:
 *                         type: string
 */
export const getNombresDistribuidores = async (req, res) => {
  try {
    // Obtener representante y nombreRepresentante de todos los distribuidores
    const distribuidores = await Distribuidor.find({}, 'representante nombreRepresentante').sort({ representante: 1 });
    
    res.json({
      count: distribuidores.length,
      distribuidores: distribuidores
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener nombres de distribuidores',
      message: error.message
    });
  }
};

export const getAllDistribuidores = async (req, res) => {
  try {
    // Si es distribuidor, solo puede ver su propio distribuidor
    if (req.userData.rol === 'distribuidor') {
      const distribuidor = await Distribuidor.findById(req.userData.distribuidorId)
        .populate('dispositivos');
      
      if (!distribuidor) {
        return res.status(404).json({
          error: 'Distribuidor no encontrado'
        });
      }

      return res.json({
        count: 1,
        distribuidores: [distribuidor]
      });
    }

    // Si es admin, puede ver todos
    const distribuidores = await Distribuidor.find().populate('dispositivos');
    res.json({
      count: distribuidores.length,
      distribuidores: distribuidores
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener distribuidores',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/{id}:
 *   get:
 *     summary: Obtener distribuidor por ID
 *     tags: [Distribuidores]
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
 *         description: Distribuidor encontrado
 *       404:
 *         description: Distribuidor no encontrado
 */
export const getDistribuidorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Si es distribuidor, solo puede ver su propio distribuidor
    if (req.userData.rol === 'distribuidor') {
      if (id !== req.userData.distribuidorId.toString()) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puedes ver tu propio distribuidor'
        });
      }
    }

    const distribuidor = await Distribuidor.findById(id).populate('dispositivos');

    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado'
      });
    }

    res.json({
      distribuidor: distribuidor
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al obtener distribuidor',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores:
 *   post:
 *     summary: Crear un nuevo distribuidor (genera QR automáticamente)
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - representante
 *             properties:
 *               representante:
 *                 type: string
 *                 example: "Juan Pérez"
 *               nombreRepresentante:
 *                 type: string
 *                 description: Nombre completo del representante (opcional)
 *                 example: "Juan Pérez García"
 *               domicilio:
 *                 type: string
 *                 example: "Calle Principal 123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contacto@distribuidor.com"
 *               sitioWeb:
 *                 type: string
 *                 example: "https://www.distribuidor.com"
 *               logo:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *           examples:
 *             ejemploCompleto:
 *               summary: Ejemplo con todos los campos
 *               value:
 *                 representante: "Juan Pérez"
 *                 nombreRepresentante: "Juan Pérez García"
 *                 domicilio: "Calle Principal 123"
 *                 email: "contacto@distribuidor.com"
 *                 sitioWeb: "https://www.distribuidor.com"
 *                 logo: "https://example.com/logo.png"
 *     responses:
 *       201:
 *         description: Distribuidor creado exitosamente con QR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 distribuidor:
 *                   $ref: '#/components/schemas/Distribuidor'
 *                 qr:
 *                   $ref: '#/components/schemas/QRResponse'
 */
// Solo admin puede crear distribuidores
export const createDistribuidor = async (req, res) => {
  try {
    const { representante, nombreRepresentante, domicilio, email, sitioWeb, logo, ...otrosDatos } = req.body;

    if (!representante) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere al menos el representante del distribuidor'
      });
    }

    // Validar que el representante no existe
    const representanteExiste = await Distribuidor.findOne({ 
      representante: representante.trim() 
    });
    if (representanteExiste) {
      return res.status(400).json({
        error: 'Representante duplicado',
        message: 'Ya existe un distribuidor con este representante'
      });
    }

    const newDistribuidor = await Distribuidor.create({
      representante: representante.trim(),
      nombreRepresentante: nombreRepresentante ? nombreRepresentante.trim() : '',
      domicilio: domicilio || '',
      email: email ? email.trim().toLowerCase() : '',
      sitioWeb: sitioWeb || '',
      logo: logo || '',
      ...otrosDatos
    });

    // Generar QR para el nuevo distribuidor
    const qrData = await generateQRForDistribuidor(newDistribuidor);

    res.status(201).json({
      message: 'Distribuidor creado exitosamente',
      distribuidor: newDistribuidor,
      qr: qrData
    });
  } catch (error) {
    // Manejar error de duplicado de MongoDB
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        error: 'Representante duplicado',
        message: 'Ya existe un distribuidor con este representante'
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
      error: 'Error al crear distribuidor',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/{id}:
 *   put:
 *     summary: Actualizar distribuidor
 *     tags: [Distribuidores]
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
 *               representante:
 *                 type: string
 *                 example: "Juan Pérez"
 *               nombreRepresentante:
 *                 type: string
 *                 description: Nombre completo del representante
 *                 example: "Juan Pérez García"
 *               domicilio:
 *                 type: string
 *                 example: "Calle Principal 123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contacto@distribuidor.com"
 *               sitioWeb:
 *                 type: string
 *                 example: "https://www.distribuidor.com"
 *               logo:
 *                 type: string
 *                 example: "https://example.com/logo.png"
 *           examples:
 *             ejemploCompleto:
 *               summary: Ejemplo con todos los campos
 *               value:
 *                 representante: "Juan Pérez"
 *                 nombreRepresentante: "Juan Pérez García"
 *                 domicilio: "Calle Principal 123"
 *                 email: "contacto@distribuidor.com"
 *                 sitioWeb: "https://www.distribuidor.com"
 *                 logo: "https://example.com/logo.png"
 *     responses:
 *       200:
 *         description: Distribuidor actualizado
 *       404:
 *         description: Distribuidor no encontrado
 */
// Solo admin puede actualizar distribuidores
export const updateDistribuidor = async (req, res) => {
  try {
    const { id } = req.params;
    const { representante, nombreRepresentante, email, ...updateData } = req.body;

    // Validar que el representante no existe si se actualiza
    if (representante) {
      const representanteExiste = await Distribuidor.findOne({ 
        representante: representante.trim(),
        _id: { $ne: id } // Excluir el distribuidor actual
      });
      if (representanteExiste) {
        return res.status(400).json({
          error: 'Representante duplicado',
          message: 'Ya existe otro distribuidor con este representante'
        });
      }
      updateData.representante = representante.trim();
    }

    // Actualizar nombreRepresentante si se proporciona
    if (nombreRepresentante !== undefined) {
      updateData.nombreRepresentante = nombreRepresentante ? nombreRepresentante.trim() : '';
    }

    // Normalizar email si se actualiza
    if (email !== undefined) {
      updateData.email = email ? email.trim().toLowerCase() : '';
    }

    const distribuidor = await Distribuidor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado'
      });
    }

    res.json({
      message: 'Distribuidor actualizado exitosamente',
      distribuidor: distribuidor
    });
  } catch (error) {
    // Manejar error de duplicado de MongoDB
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        error: 'Representante duplicado',
        message: 'Ya existe otro distribuidor con este representante'
      });
    }
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
      error: 'Error al actualizar distribuidor',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/{id}:
 *   delete:
 *     summary: Eliminar distribuidor
 *     tags: [Distribuidores]
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
 *         description: Distribuidor eliminado
 *       404:
 *         description: Distribuidor no encontrado
 */
// Solo admin puede eliminar distribuidores
export const deleteDistribuidor = async (req, res) => {
  try {
    const { id } = req.params;

    const distribuidor = await Distribuidor.findByIdAndDelete(id);
    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado'
      });
    }

    res.json({
      message: 'Distribuidor eliminado exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al eliminar distribuidor',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/{slug}/info:
 *   get:
 *     summary: Obtener información del distribuidor (endpoint público para QR)
 *     tags: [Distribuidores]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o representante del distribuidor
 *     responses:
 *       200:
 *         description: Información del distribuidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribuidor:
 *                   $ref: '#/components/schemas/Distribuidor'
 *       404:
 *         description: Distribuidor no encontrado
 */
export const getDistribuidorInfo = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Intentar buscar por ID primero
    let distribuidor = null;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      distribuidor = await Distribuidor.findById(slug);
    }
    
    // Si no se encuentra por ID, buscar por nombre (slug)
    if (!distribuidor) {
      const nombreSlug = slug.toLowerCase().replace(/-/g, ' ');
      distribuidor = await Distribuidor.findOne({
        nombre: { $regex: new RegExp(nombreSlug, 'i') }
      });
    }

    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado'
      });
    }

    res.json({
      distribuidor: distribuidor
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener información del distribuidor',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/{id}/qr:
 *   get:
 *     summary: Generar o regenerar QR para un distribuidor
 *     tags: [Distribuidores]
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
 *         description: QR generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qr:
 *                   $ref: '#/components/schemas/QRResponse'
 *       404:
 *         description: Distribuidor no encontrado
 */
export const generateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const distribuidor = await Distribuidor.findById(id);

    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado'
      });
    }

    const qrData = await generateQRForDistribuidor(distribuidor);

    res.json({
      message: 'QR generado exitosamente',
      qr: qrData
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al generar QR',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/distribuidores/representante/{representante}:
 *   get:
 *     summary: Obtener distribuidor por representante con marcas y dispositivos agrupados (público)
 *     tags: [Distribuidores]
 *     parameters:
 *       - in: path
 *         name: representante
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del representante (único)
 *     responses:
 *       200:
 *         description: Distribuidor encontrado con marcas y dispositivos agrupados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribuidor:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Distribuidor'
 *                     - type: object
 *                       properties:
 *                         marcas:
 *                           type: array
 *                           description: Array de marcas con sus dispositivos agrupados
 *                           items:
 *                             type: object
 *                             allOf:
 *                               - $ref: '#/components/schemas/Marca'
 *                               - type: object
 *                                 properties:
 *                                   dispositivos:
 *                                     type: array
 *                                     description: Dispositivos de esta marca
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         _id:
 *                                           type: string
 *                                         modelo:
 *                                           type: string
 *                                         tipo:
 *                                           type: string
 *                                         foto:
 *                                           type: string
 *                                         fechaPublicacion:
 *                                           type: string
 *                                           format: date-time
 *                                           description: Fecha de publicación del dispositivo
 *                                         nombreTestReport:
 *                                           type: array
 *                                           items:
 *                                             type: string
 *                                           description: Array de nombres de Test Report del dispositivo
 *                                         testReportFiles:
 *                                           type: array
 *                                           items:
 *                                             type: string
 *                                           description: Array de archivos de Test Report del dispositivo
 *                                         createdAt:
 *                                           type: string
 *                                           format: date-time
 *                                         updatedAt:
 *                                           type: string
 *                                           format: date-time
 *                         totalMarcas:
 *                           type: number
 *                           description: Total de marcas asociadas
 *                         totalDispositivos:
 *                           type: number
 *                           description: Total de dispositivos asociados
 *       404:
 *         description: Distribuidor no encontrado
 */
export const getDistribuidorByRepresentante = async (req, res) => {
  try {
    const { representante } = req.params;

    // Buscar distribuidor por representante (búsqueda exacta, case-insensitive)
    const distribuidor = await Distribuidor.findOne({ 
      representante: { $regex: new RegExp(`^${representante.trim()}$`, 'i') }
    });

    if (!distribuidor) {
      return res.status(404).json({
        error: 'Distribuidor no encontrado',
        message: `No se encontró un distribuidor con el representante: ${representante}`
      });
    }

    // Endpoint público - no requiere autenticación
    // Cualquier usuario puede acceder a la información del distribuidor por representante

    // Buscar todos los dispositivos asociados a este distribuidor desde la tabla Dispositivo
    const dispositivos = await Dispositivo.find({
      distribuidores: distribuidor._id
    })
      .populate('marca')
      .sort({ 'marca.marca': 1, modelo: 1 });

    // Agrupar dispositivos por marca
    const marcasMap = new Map();

    dispositivos.forEach(dispositivo => {
      const marcaId = dispositivo.marca._id.toString();
      
      if (!marcasMap.has(marcaId)) {
        // Crear objeto marca completo con campo dispositivos vacío
        const marcaObj = dispositivo.marca.toObject();
        marcaObj.dispositivos = [];
        marcasMap.set(marcaId, marcaObj);
      }
      
      // Agregar dispositivo limpio (sin marca ni distribuidores)
      const dispositivoLimpio = {
        _id: dispositivo._id,
        modelo: dispositivo.modelo,
        tipo: dispositivo.tipo,
        foto: dispositivo.foto,
        fechaPublicacion: dispositivo.fechaPublicacion,
        tecnologia: dispositivo.tecnologia || [],
        frecuencias: dispositivo.frecuencias || [],
        gananciaAntena: dispositivo.gananciaAntena || [],
        EIRP: dispositivo.EIRP || [],
        modulo: dispositivo.modulo || [],
        nombreTestReport: dispositivo.nombreTestReport || [],
        testReportFiles: dispositivo.testReportFiles || '',
        fechaCertificacionSubtel: dispositivo.fechaCertificacionSubtel || null,
        oficioCertificacionSubtel: dispositivo.oficioCertificacionSubtel || '',
        resolutionVersion: dispositivo.resolutionVersion || '2017',
        createdAt: dispositivo.createdAt,
        updatedAt: dispositivo.updatedAt
      };
      marcasMap.get(marcaId).dispositivos.push(dispositivoLimpio);
    });

    // Convertir Map a Array y ordenar por nombre de marca
    const marcas = Array.from(marcasMap.values()).sort((a, b) => 
      a.marca.localeCompare(b.marca)
    );

    // Construir el objeto distribuidor con marcas anidadas
    // Asegurar que nombreRepresentante esté incluido explícitamente
    const distribuidorObj = distribuidor.toObject();
    const distribuidorConMarcas = {
      _id: distribuidorObj._id,
      representante: distribuidorObj.representante,
      nombreRepresentante: distribuidorObj.nombreRepresentante || '',
      domicilio: distribuidorObj.domicilio || '',
      email: distribuidorObj.email || '',
      sitioWeb: distribuidorObj.sitioWeb || '',
      logo: distribuidorObj.logo || '',
      dispositivos: distribuidorObj.dispositivos || [],
      createdAt: distribuidorObj.createdAt,
      updatedAt: distribuidorObj.updatedAt,
      marcas: marcas,
      totalMarcas: marcas.length,
      totalDispositivos: dispositivos.length
    };

    res.json({
      distribuidor: distribuidorConMarcas
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener distribuidor por representante',
      message: error.message
    });
  }
};
