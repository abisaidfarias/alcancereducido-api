import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client, s3Config as s3BucketConfig, getS3PublicUrl } from '../config/s3.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Validar tipos de archivo permitidos
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const maxFileSize = 5 * 1024 * 1024; // 5MB

// Configurar multer para S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: s3BucketConfig.bucket,
    // No usar ACL porque el bucket tiene bloqueo de ACLs
    // Los archivos son públicos por la política de bucket
    key: function (req, file, cb) {
      // Generar nombre único para el archivo
      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      
      // Organizar por tipo: logos, fotos, etc.
      let folder = 'general';
      if (file.fieldname === 'logo') {
        folder = 'logos';
      } else if (file.fieldname === 'foto') {
        folder = 'fotos';
      }
      
      const key = `${folder}/${filename}`;
      cb(null, key);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname
      });
    }
  }),
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: function (req, file, cb) {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedMimeTypes.join(', ')}`), false);
    }
  }
});

// Middleware para manejar errores de multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: `El tamaño máximo permitido es ${maxFileSize / 1024 / 1024}MB`
      });
    }
    return res.status(400).json({
      error: 'Error al subir archivo',
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      error: 'Error al procesar archivo',
      message: err.message
    });
  }
  next();
};

// Middleware para subir una sola imagen (campo 'image')
export const uploadSingle = (fieldName = 'image') => {
  return [
    upload.single(fieldName),
    handleUploadError,
    (req, res, next) => {
      if (req.file) {
        // Agregar la URL pública al objeto file
        req.file.url = getS3PublicUrl(req.file.key);
        req.file.location = req.file.url; // Compatibilidad con multer-s3
      }
      next();
    }
  ];
};

// Middleware para subir múltiples imágenes
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return [
    upload.array(fieldName, maxCount),
    handleUploadError,
    (req, res, next) => {
      if (req.files && req.files.length > 0) {
        // Agregar URLs públicas a cada archivo
        req.files = req.files.map(file => ({
          ...file,
          url: getS3PublicUrl(file.key),
          location: getS3PublicUrl(file.key)
        }));
      }
      next();
    }
  ];
};

export default upload;

