import { Dispositivo } from '../models/Dispositivo.js';
import { Distribuidor } from '../models/Distribuidor.js';
import { Marca } from '../models/Marca.js';

/**
 * @swagger
 * /api/dispositivos/public:
 *   get:
 *     summary: Listar todos los dispositivos (público)
 *     description: Endpoint público que lista todos los dispositivos disponibles sin requerir autenticación. Ordenados por marca (A-Z).
 *     tags: [Dispositivos]
 *     parameters:
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por ID o nombre de marca
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de dispositivo
 *     responses:
 *       200:
 *         description: Lista de dispositivos ordenados por marca (A-Z)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   example: 10
 *                 dispositivos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dispositivo'
 *       500:
 *         description: Error del servidor
 */
export const getAllDispositivosPublic = async (req, res) => {
  try {
    const { marca, tipo } = req.query;
    const filter = {};
    
    // Filtrar por marca si se proporciona
    if (marca) {
      const marcas = await Marca.find({
        $or: [
          { _id: marca },
          { marca: { $regex: new RegExp(marca, 'i') } }
        ]
      });
      if (marcas.length > 0) {
        filter.marca = { $in: marcas.map(m => m._id) };
      } else {
        return res.json({
          count: 0,
          dispositivos: []
        });
      }
    }
    
    // Filtrar por tipo si se proporciona
    if (tipo) {
      filter.tipo = tipo;
    }

    const dispositivos = await Dispositivo.find(filter)
      .populate('marca', 'marca fabricante logo')
      .populate('distribuidor', 'representante nombreRepresentante logo domicilio email sitioWeb');
    
    // Ordenar por nombre de marca (A-Z) por defecto
    dispositivos.sort((a, b) => {
      const marcaA = a.marca?.marca || '';
      const marcaB = b.marca?.marca || '';
      return marcaA.localeCompare(marcaB, 'es', { sensitivity: 'base' });
    });
    
    res.json({
      count: dispositivos.length,
      dispositivos: dispositivos
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener dispositivos',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/public/{id}:
 *   get:
 *     summary: Obtener dispositivo por ID (público)
 *     description: Endpoint público que retorna un dispositivo por su ID sin requerir autenticación.
 *     tags: [Dispositivos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dispositivo (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Dispositivo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dispositivo:
 *                   $ref: '#/components/schemas/Dispositivo'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Dispositivo no encontrado
 *       500:
 *         description: Error del servidor
 */
export const getDispositivoByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const dispositivo = await Dispositivo.findById(id)
      .populate('marca', 'marca fabricante logo')
      .populate('distribuidor', 'representante nombreRepresentante logo domicilio email sitioWeb');

    if (!dispositivo) {
      return res.status(404).json({
        error: 'Dispositivo no encontrado'
      });
    }

    res.json({
      dispositivo: dispositivo
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al obtener dispositivo',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos:
 *   get:
 *     summary: Listar todos los dispositivos móviles
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por ID o nombre de marca
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [telefono]
 *         description: Filtrar por tipo de dispositivo
 *       - in: query
 *         name: distribuidor
 *         schema:
 *           type: string
 *         description: Filtrar por distribuidor (solo admin)
 *     responses:
 *       200:
 *         description: Lista de dispositivos ordenados por marca (A-Z)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                 dispositivos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dispositivo'
 */
export const getAllDispositivos = async (req, res) => {
  try {
    const { marca, tipo, distribuidor } = req.query;
    const filter = {};
    
    // Si es distribuidor, solo puede ver dispositivos asociados a su distribuidor
    if (req.userData.rol === 'distribuidor') {
      filter.distribuidor = req.userData.distribuidorId;
    }
    
    // Filtrar por distribuidor (solo admin puede usar este filtro)
    if (distribuidor && req.userData.rol === 'admin') {
      filter.distribuidor = distribuidor;
    }
    
    if (marca) {
      // Buscar por ID de marca o nombre de marca
      const marcas = await Marca.find({
        $or: [
          { _id: marca },
          { marca: { $regex: new RegExp(marca, 'i') } }
        ]
      });
      if (marcas.length > 0) {
        filter.marca = { $in: marcas.map(m => m._id) };
      } else {
        // Si no encuentra marca, retornar vacío
        return res.json({
          count: 0,
          dispositivos: []
        });
      }
    }
    
    if (tipo) {
      filter.tipo = tipo;
    }

    const dispositivos = await Dispositivo.find(filter)
      .populate('marca')
      .populate('distribuidor');
    
    // Ordenar por nombre de marca (A-Z) por defecto
    dispositivos.sort((a, b) => {
      const marcaA = a.marca?.marca || '';
      const marcaB = b.marca?.marca || '';
      return marcaA.localeCompare(marcaB, 'es', { sensitivity: 'base' });
    });
    
    res.json({
      count: dispositivos.length,
      dispositivos: dispositivos
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener dispositivos',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   get:
 *     summary: Obtener dispositivo por ID
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dispositivo (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Dispositivo encontrado
 *       404:
 *         description: Dispositivo no encontrado
 */
export const getDispositivoById = async (req, res) => {
  try {
    const { id } = req.params;
    const dispositivo = await Dispositivo.findById(id)
      .populate('marca')
      .populate('distribuidor');

    if (!dispositivo) {
      return res.status(404).json({
        error: 'Dispositivo no encontrado'
      });
    }

    // Si es distribuidor, verificar que el dispositivo esté asociado a su distribuidor
    if (req.userData.rol === 'distribuidor') {
      const distribuidorId = dispositivo.distribuidor?._id || dispositivo.distribuidor;
      const tieneAcceso = distribuidorId && distribuidorId.toString() === req.userData.distribuidorId.toString();
      
      if (!tieneAcceso) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tienes acceso a este dispositivo'
        });
      }
    }

    res.json({
      dispositivo: dispositivo
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al obtener dispositivo',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos:
 *   post:
 *     summary: Crear un nuevo dispositivo móvil
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelo
 *               - marca
 *             properties:
 *               modelo:
 *                 type: string
 *                 example: "Galaxy S23"
 *               tipo:
 *                 type: string
 *                 description: Tipo de dispositivo (campo abierto)
 *                 example: "telefono"
 *               foto:
 *                 type: string
 *                 example: "https://example.com/foto.jpg"
 *               fechaPublicacion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de publicación del dispositivo
 *                 example: "2025-01-22T10:00:00.000Z"
 *               tecnologia:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de tecnologías del dispositivo
 *                 example: ["4G", "5G", "WiFi"]
 *               frecuencias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de frecuencias del dispositivo
 *                 example: ["850 MHz", "1900 MHz", "2.4 GHz"]
 *               gananciaAntena:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de ganancia de antena del dispositivo
 *                 example: ["3 dBi", "5 dBi"]
 *               EIRP:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de EIRP (Effective Isotropic Radiated Power) del dispositivo
 *                 example: ["20 dBm", "23 dBm"]
 *               modulo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de módulos del dispositivo
 *                 example: ["Módulo A", "Módulo B"]
 *               nombreTestReport:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de nombres de Test Report del dispositivo
 *                 example: ["Test Report Galaxy S23", "Test Report WiFi"]
 *               testReportFiles:
 *                 type: string
 *                 description: URL del archivo de Test Report (RAR/ZIP) subido al servidor
 *                 example: "https://alcancereducido-images.s3.us-east-1.amazonaws.com/test-reports/123e4567-e89b-12d3-a456-426614174000.zip"
 *               fechaCertificacionSubtel:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de Certificación SUBTEL
 *                 example: "2025-01-15T10:00:00.000Z"
 *               oficioCertificacionSubtel:
 *                 type: string
 *                 description: Oficio de Certificación SUBTEL
 *                 example: "Oficio-12345-2025"
 *               resolutionVersion:
 *                 type: string
 *                 enum: ["2017", "2025"]
 *                 description: Versión de resolución SUBTEL
 *                 example: "2025"
 *               marca:
 *                 type: string
 *                 description: ID de la marca (debe existir)
 *                 example: "507f1f77bcf86cd799439011"
 *               distribuidor:
 *                 type: string
 *                 nullable: true
 *                 description: ID del distribuidor (o null si no tiene)
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Dispositivo creado exitosamente
 *       400:
 *         description: Error de validación
 */
// Solo admin puede crear dispositivos
export const createDispositivo = async (req, res) => {
  try {
    const { 
      modelo, 
      tipo, 
      foto, 
      fechaPublicacion, 
      tecnologia, 
      frecuencias, 
      gananciaAntena, 
      EIRP, 
      modulo, 
      nombreTestReport,
      testReportFiles,
      fechaCertificacionSubtel,
      oficioCertificacionSubtel,
      resolutionVersion,
      marca, 
      distribuidor 
    } = req.body;

    if (!modelo || !marca) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requieren modelo y marca del dispositivo'
      });
    }

    // Validar que el modelo no existe
    const modeloExiste = await Dispositivo.findOne({ modelo: modelo.trim() });
    if (modeloExiste) {
      return res.status(400).json({
        error: 'Modelo duplicado',
        message: 'Ya existe un dispositivo con este modelo'
      });
    }

    // Validar que la marca existe
    const marcaExiste = await Marca.findById(marca);
    if (!marcaExiste) {
      return res.status(400).json({
        error: 'Marca no encontrada',
        message: 'La marca especificada no existe'
      });
    }

    // Validar que el distribuidor existe (si se proporciona)
    if (distribuidor) {
      const distribuidorExiste = await Distribuidor.findById(distribuidor);
      if (!distribuidorExiste) {
        return res.status(400).json({
          error: 'Distribuidor inválido',
          message: 'El distribuidor especificado no existe'
        });
      }
    }

    const newDispositivo = await Dispositivo.create({
      modelo: modelo.trim(),
      tipo: tipo || '',
      foto: foto || '',
      fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : new Date(),
      tecnologia: Array.isArray(tecnologia) ? tecnologia : [],
      frecuencias: Array.isArray(frecuencias) ? frecuencias : [],
      gananciaAntena: Array.isArray(gananciaAntena) ? gananciaAntena : [],
      EIRP: Array.isArray(EIRP) ? EIRP : [],
      modulo: Array.isArray(modulo) ? modulo : [],
      nombreTestReport: Array.isArray(nombreTestReport) ? nombreTestReport : [],
      testReportFiles: typeof testReportFiles === 'string' ? testReportFiles.trim() : '',
      fechaCertificacionSubtel: fechaCertificacionSubtel ? new Date(fechaCertificacionSubtel) : null,
      oficioCertificacionSubtel: typeof oficioCertificacionSubtel === 'string' ? oficioCertificacionSubtel.trim() : '',
      resolutionVersion: resolutionVersion && ['2017', '2025'].includes(String(resolutionVersion)) ? String(resolutionVersion) : '2017',
      marca,
      distribuidor: distribuidor || null
    });

    // Actualizar el distribuidor para agregar el dispositivo
    if (distribuidor) {
      await Distribuidor.findByIdAndUpdate(
        distribuidor,
        { $addToSet: { dispositivos: newDispositivo._id } }
      );
    }

    const dispositivoPopulado = await Dispositivo.findById(newDispositivo._id)
      .populate('marca')
      .populate('distribuidor');

    res.status(201).json({
      message: 'Dispositivo creado exitosamente',
      dispositivo: dispositivoPopulado
    });
  } catch (error) {
    // Manejar error de duplicado de MongoDB
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        error: 'Modelo duplicado',
        message: 'Ya existe un dispositivo con este modelo'
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
      error: 'Error al crear dispositivo',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   put:
 *     summary: Actualizar dispositivo
 *     tags: [Dispositivos]
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
 *               modelo:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 description: Tipo de dispositivo (campo abierto)
 *                 example: "telefono"
 *               foto:
 *                 type: string
 *                 example: "https://example.com/foto.jpg"
 *               fechaPublicacion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de publicación del dispositivo
 *                 example: "2025-01-22T10:00:00.000Z"
 *               tecnologia:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de tecnologías del dispositivo
 *                 example: ["4G", "5G", "WiFi"]
 *               frecuencias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de frecuencias del dispositivo
 *                 example: ["850 MHz", "1900 MHz", "2.4 GHz"]
 *               gananciaAntena:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de ganancia de antena del dispositivo
 *                 example: ["3 dBi", "5 dBi"]
 *               EIRP:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de EIRP (Effective Isotropic Radiated Power) del dispositivo
 *                 example: ["20 dBm", "23 dBm"]
 *               modulo:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de módulos del dispositivo
 *                 example: ["Módulo A", "Módulo B"]
 *               nombreTestReport:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de nombres de Test Report del dispositivo
 *                 example: ["Test Report Galaxy S23", "Test Report WiFi"]
 *               testReportFiles:
 *                 type: string
 *                 description: URL del archivo de Test Report (RAR/ZIP) subido al servidor
 *                 example: "https://alcancereducido-images.s3.us-east-1.amazonaws.com/test-reports/123e4567-e89b-12d3-a456-426614174000.zip"
 *               fechaCertificacionSubtel:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de Certificación SUBTEL
 *                 example: "2025-01-15T10:00:00.000Z"
 *               oficioCertificacionSubtel:
 *                 type: string
 *                 description: Oficio de Certificación SUBTEL
 *                 example: "Oficio-12345-2025"
 *               resolutionVersion:
 *                 type: string
 *                 enum: ["2017", "2025"]
 *                 description: Versión de resolución SUBTEL
 *                 example: "2025"
 *               marca:
 *                 type: string
 *                 description: ID de la marca (debe existir)
 *               distribuidor:
 *                 type: string
 *                 nullable: true
 *                 description: ID del distribuidor (o null si no tiene)
 *     responses:
 *       200:
 *         description: Dispositivo actualizado
 *       404:
 *         description: Dispositivo no encontrado
 */
// Solo admin puede actualizar dispositivos
export const updateDispositivo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Debug: Ver qué llega en el body
    console.log('\n=== UPDATE DISPOSITIVO ===');
    console.log('ID:', id);
    console.log('Body recibido - Campos nuevos:');
    console.log('  fechaCertificacionSubtel:', req.body.fechaCertificacionSubtel, '(tipo:', typeof req.body.fechaCertificacionSubtel, ')');
    console.log('  oficioCertificacionSubtel:', req.body.oficioCertificacionSubtel, '(tipo:', typeof req.body.oficioCertificacionSubtel, ')');
    console.log('  resolutionVersion:', req.body.resolutionVersion, '(tipo:', typeof req.body.resolutionVersion, ')');
    
    const { 
      modelo, 
      tipo, 
      marca, 
      distribuidor, 
      fechaPublicacion, 
      tecnologia, 
      frecuencias, 
      gananciaAntena, 
      EIRP, 
      modulo, 
      nombreTestReport,
      testReportFiles,
      fechaCertificacionSubtel,
      oficioCertificacionSubtel,
      resolutionVersion,
      ...updateData 
    } = req.body;

    // Validar que el modelo no existe si se actualiza
    if (modelo) {
      const modeloExiste = await Dispositivo.findOne({ 
        modelo: modelo.trim(),
        _id: { $ne: id } // Excluir el dispositivo actual
      });
      if (modeloExiste) {
        return res.status(400).json({
          error: 'Modelo duplicado',
          message: 'Ya existe otro dispositivo con este modelo'
        });
      }
      updateData.modelo = modelo.trim();
    }

    // Validar marca si se actualiza
    if (marca) {
      const marcaExiste = await Marca.findById(marca);
      if (!marcaExiste) {
        return res.status(400).json({
          error: 'Marca no encontrada',
          message: 'La marca especificada no existe'
        });
      }
      updateData.marca = marca;
    }

    // Actualizar tipo si se proporciona
    if (tipo !== undefined) {
      updateData.tipo = tipo || '';
    }

    // Actualizar arrays si se proporcionan
    if (tecnologia !== undefined) {
      updateData.tecnologia = Array.isArray(tecnologia) ? tecnologia : [];
    }
    if (frecuencias !== undefined) {
      updateData.frecuencias = Array.isArray(frecuencias) ? frecuencias : [];
    }
    if (gananciaAntena !== undefined) {
      updateData.gananciaAntena = Array.isArray(gananciaAntena) ? gananciaAntena : [];
    }
    if (EIRP !== undefined) {
      updateData.EIRP = Array.isArray(EIRP) ? EIRP : [];
    }
    if (modulo !== undefined) {
      updateData.modulo = Array.isArray(modulo) ? modulo : [];
    }
    if (nombreTestReport !== undefined) {
      updateData.nombreTestReport = Array.isArray(nombreTestReport) ? nombreTestReport : [];
    }
    if (testReportFiles !== undefined) {
      updateData.testReportFiles = typeof testReportFiles === 'string' ? testReportFiles.trim() : '';
    }
    // Procesar fechaCertificacionSubtel
    if (fechaCertificacionSubtel !== undefined) {
      if (fechaCertificacionSubtel === null || fechaCertificacionSubtel === '') {
        updateData.fechaCertificacionSubtel = null;
      } else {
        const fecha = new Date(fechaCertificacionSubtel);
        if (isNaN(fecha.getTime())) {
          return res.status(400).json({
            error: 'Fecha inválida',
            message: 'La fecha de certificación SUBTEL debe ser una fecha válida'
          });
        }
        updateData.fechaCertificacionSubtel = fecha;
      }
    }
    
    // Procesar oficioCertificacionSubtel (permite string vacío)
    if (oficioCertificacionSubtel !== undefined) {
      updateData.oficioCertificacionSubtel = String(oficioCertificacionSubtel || '').trim();
    }
    
    // Procesar resolutionVersion (acepta número o string)
    if (resolutionVersion !== undefined && resolutionVersion !== null) {
      const resolutionVersionStr = String(resolutionVersion);
      if (['2017', '2025'].includes(resolutionVersionStr)) {
        updateData.resolutionVersion = resolutionVersionStr;
      } else {
        return res.status(400).json({
          error: 'Valor inválido',
          message: 'resolutionVersion debe ser "2017" o "2025"'
        });
      }
    }

    // Validar y procesar fechaPublicacion si se actualiza
    if (fechaPublicacion !== undefined) {
      const fecha = new Date(fechaPublicacion);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({
          error: 'Fecha inválida',
          message: 'La fecha de publicación debe ser una fecha válida'
        });
      }
      updateData.fechaPublicacion = fecha;
    }

    // Si se actualiza el distribuidor
    if (distribuidor !== undefined) {
      if (distribuidor !== null) {
        // Validar que el distribuidor existe
        const distribuidorExiste = await Distribuidor.findById(distribuidor);
        if (!distribuidorExiste) {
          return res.status(400).json({
            error: 'Distribuidor inválido',
            message: 'El distribuidor especificado no existe'
          });
        }
      }

      // Obtener distribuidor anterior
      const dispositivoAnterior = await Dispositivo.findById(id);
      if (dispositivoAnterior) {
        const distribuidorAnterior = dispositivoAnterior.distribuidor;
        
        // Si cambió el distribuidor, actualizar las referencias
        if (distribuidorAnterior && distribuidorAnterior.toString() !== (distribuidor || '').toString()) {
          // Remover dispositivo del distribuidor anterior
          await Distribuidor.findByIdAndUpdate(
            distribuidorAnterior,
            { $pull: { dispositivos: id } }
          );
        }

        if (distribuidor && (!distribuidorAnterior || distribuidorAnterior.toString() !== distribuidor.toString())) {
          // Agregar dispositivo al nuevo distribuidor
          await Distribuidor.findByIdAndUpdate(
            distribuidor,
            { $addToSet: { dispositivos: id } }
          );
        }
      }

      updateData.distribuidor = distribuidor;
    }

    // Debug: Verificar que los campos nuevos estén en updateData
    console.log('\nUpdateData antes de guardar:');
    console.log('  fechaCertificacionSubtel:', updateData.fechaCertificacionSubtel);
    console.log('  oficioCertificacionSubtel:', updateData.oficioCertificacionSubtel);
    console.log('  resolutionVersion:', updateData.resolutionVersion);
    console.log('  Total campos en updateData:', Object.keys(updateData).length);
    console.log('  Campos:', Object.keys(updateData).join(', '));
    console.log('=== FIN UPDATE ===\n');

    const dispositivo = await Dispositivo.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('marca')
      .populate('distribuidor');

    if (!dispositivo) {
      return res.status(404).json({
        error: 'Dispositivo no encontrado'
      });
    }

    res.json({
      message: 'Dispositivo actualizado exitosamente',
      dispositivo: dispositivo
    });
  } catch (error) {
    // Manejar error de duplicado de MongoDB
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        error: 'Modelo duplicado',
        message: 'Ya existe otro dispositivo con este modelo'
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
      error: 'Error al actualizar dispositivo',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/dispositivos/{id}:
 *   delete:
 *     summary: Eliminar dispositivo
 *     tags: [Dispositivos]
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
 *         description: Dispositivo eliminado
 *       404:
 *         description: Dispositivo no encontrado
 */
// Solo admin puede eliminar dispositivos
export const deleteDispositivo = async (req, res) => {
  try {
    const { id } = req.params;

    const dispositivo = await Dispositivo.findById(id);
    if (!dispositivo) {
      return res.status(404).json({
        error: 'Dispositivo no encontrado'
      });
    }

    // Remover dispositivo del distribuidor asociado
    if (dispositivo.distribuidor) {
      await Distribuidor.findByIdAndUpdate(
        dispositivo.distribuidor,
        { $pull: { dispositivos: id } }
      );
    }

    await Dispositivo.findByIdAndDelete(id);

    res.json({
      message: 'Dispositivo eliminado exitosamente'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        message: 'El ID proporcionado no es válido'
      });
    }
    res.status(500).json({
      error: 'Error al eliminar dispositivo',
      message: error.message
    });
  }
};

