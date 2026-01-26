import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config.js';

// Configuración de S3
// Si hay credenciales en variables de entorno, las usa
// Si no, usa el rol IAM de la instancia EC2 (mejor práctica)
const s3ClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};

// Solo agregar credenciales si están disponibles
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

export const s3Client = new S3Client(s3ClientConfig);

// Configuración del bucket S3
export const s3Config = {
  bucket: process.env.S3_BUCKET_NAME || 'alcancereducido-images',
  region: process.env.AWS_REGION || 'us-east-1'
};

// Función para generar la URL pública de un objeto S3
export function getS3PublicUrl(key) {
  const bucket = s3Config.bucket;
  const region = s3Config.region;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
