import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client, s3Config as s3BucketConfig, getS3PublicUrl } from '../config/s3.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Validar tipos de archivo permitidos
const allowedMimeTypes = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/zip',
  'application/x-zip-compressed'
];

// Límites de tamaño según tipo de archivo
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB para imágenes
const MAX_COMPRESSED_SIZE = 30 * 1024 * 1024; // 30MB para archivos comprimidos
const MAX_FILE_SIZE = MAX_COMPRESSED_SIZE; // Límite máximo global para multer

// Función para determinar si un archivo es una imagen
const isImage = (mimetype, ext) => {
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageMimeTypes.includes(mimetype) || imageExtensions.includes(ext.toLowerCase());
};

// Función para determinar si un archivo es comprimido (RAR/ZIP)
const isCompressed = (mimetype, ext) => {
  const compressedMimeTypes = [
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/zip',
    'application/x-zip-compressed'
  ];
  const compressedExtensions = ['.rar', '.zip'];
  return compressedMimeTypes.includes(mimetype) || compressedExtensions.includes(ext.toLowerCase());
};

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
      
      // Organizar por tipo: logos, fotos, test-reports, etc.
      let folder = 'general';
      if (file.fieldname === 'logo') {
        folder = 'logos';
      } else if (file.fieldname === 'foto') {
        folder = 'fotos';
      } else if (file.fieldname === 'testReport' || file.fieldname === 'testReportFile') {
        folder = 'test-reports';
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
    fileSize: MAX_FILE_SIZE // Límite máximo global (30MB)
  },
  fileFilter: function (req, file, cb) {
    // Verificar por MIME type o extensión del archivo
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.rar', '.zip'].includes(ext);
    
    if (!isValidMimeType && !isValidExtension) {
      return cb(new Error(`Tipo de archivo no permitido. Solo se permiten: imágenes (JPEG, PNG, GIF, WEBP) y archivos comprimidos (RAR, ZIP)`), false);
    }
    
    // Validar tamaño según el tipo de archivo
    // Nota: En este punto no tenemos acceso directo al tamaño del archivo en el fileFilter
    // La validación de tamaño se hará en el middleware handleUploadError
    cb(null, true);
  }
});

// Middleware para validar tamaño de archivo según su tipo
export const validateFileSize = (req, res, next) => {
  const file = req.file || (req.files && req.files[0]);
  
  if (!file) {
    return next();
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isImageFile = isImage(file.mimetype, ext);
  const isCompressedFile = isCompressed(file.mimetype, ext);
  
  // Validar tamaño según el tipo
  if (isImageFile && file.size > MAX_IMAGE_SIZE) {
    return res.status(400).json({
      error: 'Archivo demasiado grande',
      message: `Las imágenes tienen un límite máximo de ${MAX_IMAGE_SIZE / 1024 / 1024}MB. El archivo subido es de ${(file.size / 1024 / 1024).toFixed(2)}MB`
    });
  }
  
  if (isCompressedFile && file.size > MAX_COMPRESSED_SIZE) {
    return res.status(400).json({
      error: 'Archivo demasiado grande',
      message: `Los archivos comprimidos (RAR/ZIP) tienen un límite máximo de ${MAX_COMPRESSED_SIZE / 1024 / 1024}MB. El archivo subido es de ${(file.size / 1024 / 1024).toFixed(2)}MB`
    });
  }
  
  next();
};

// Middleware para manejar errores de multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Obtener información del archivo si está disponible
      const file = req.file || (req.files && req.files[0]);
      let message = `El archivo excede el tamaño máximo permitido.`;
      
      if (file) {
        const ext = path.extname(file.originalname).toLowerCase();
        const isImageFile = isImage(file.mimetype, ext);
        const isCompressedFile = isCompressed(file.mimetype, ext);
        
        if (isImageFile) {
          message = `Las imágenes tienen un límite máximo de ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`;
        } else if (isCompressedFile) {
          message = `Los archivos comprimidos (RAR/ZIP) tienen un límite máximo de ${MAX_COMPRESSED_SIZE / 1024 / 1024}MB.`;
        }
      }
      
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: message
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
    validateFileSize,
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

// Middleware para validar tamaño de múltiples archivos
export const validateMultipleFilesSize = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }
  
  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageFile = isImage(file.mimetype, ext);
    const isCompressedFile = isCompressed(file.mimetype, ext);
    
    // Validar tamaño según el tipo
    if (isImageFile && file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: `El archivo "${file.originalname}" excede el límite de ${MAX_IMAGE_SIZE / 1024 / 1024}MB para imágenes. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }
    
    if (isCompressedFile && file.size > MAX_COMPRESSED_SIZE) {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        message: `El archivo "${file.originalname}" excede el límite de ${MAX_COMPRESSED_SIZE / 1024 / 1024}MB para archivos comprimidos. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
  
  next();
};

// Middleware para subir múltiples imágenes
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return [
    upload.array(fieldName, maxCount),
    handleUploadError,
    validateMultipleFilesSize,
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

