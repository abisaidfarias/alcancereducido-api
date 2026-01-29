/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Imagen subida exitosamente
 *         url:
 *           type: string
 *           description: URL pública de la imagen en S3
 *           example: https://alcancereducido-images.s3.us-east-1.amazonaws.com/logos/123e4567-e89b-12d3-a456-426614174000.jpg
 *         key:
 *           type: string
 *           description: Clave del objeto en S3
 *           example: logos/123e4567-e89b-12d3-a456-426614174000.jpg
 *         size:
 *           type: number
 *           description: Tamaño del archivo en bytes
 *           example: 123456
 *         mimetype:
 *           type: string
 *           example: image/jpeg
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Subir una imagen a S3
 *     description: Endpoint para subir imágenes (logos, fotos de dispositivos, etc.) a Amazon S3. Retorna la URL pública de la imagen.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (JPEG, PNG, GIF, WEBP) o archivo comprimido (RAR, ZIP) - máximo 10MB
 *               type:
 *                 type: string
 *                 enum: [logo, foto, general]
 *                 description: Tipo de imagen (opcional, por defecto 'general')
 *                 example: logo
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Error en la solicitud (archivo inválido, muy grande, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Archivo demasiado grande
 *                 message:
 *                   type: string
 *                   example: El tamaño máximo permitido es 10MB
 *       401:
 *         description: No autorizado (token inválido o faltante)
 *       500:
 *         description: Error del servidor
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo',
        message: 'Debes enviar un archivo de imagen en el campo "image"'
      });
    }

    // Retornar información de la imagen subida
    res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      url: req.file.url || req.file.location,
      key: req.file.key,
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imagen',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Subir múltiples imágenes a S3
 *     description: Endpoint para subir varias imágenes a la vez a Amazon S3. Retorna las URLs públicas de todas las imágenes.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos de imagen (JPEG, PNG, GIF, WEBP) o archivos comprimidos (RAR, ZIP) - máximo 10, cada uno máximo 10MB
 *     responses:
 *       200:
 *         description: Imágenes subidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 3 imágenes subidas exitosamente
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron archivos',
        message: 'Debes enviar al menos un archivo de imagen en el campo "images"'
      });
    }

    // Mapear archivos a formato de respuesta
    const uploadedImages = req.files.map(file => ({
      url: file.url || file.location,
      key: file.key,
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imágenes',
      message: error.message
    });
  }
};









