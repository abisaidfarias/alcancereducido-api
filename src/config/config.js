import dotenv from 'dotenv';
import { getSecret } from './secretsManager.js';

dotenv.config();

// Cache para secrets cargados
let secretsCache = {};
let secretsLoaded = false;

// Función para cargar secrets de AWS Secrets Manager
async function loadSecretsFromAWS() {
  if (secretsLoaded) {
    return secretsCache;
  }

  // Solo intentar cargar de AWS si se especifica explícitamente
  // Por defecto, usar variables de entorno (más simple y rápido)
  if (process.env.USE_AWS_SECRETS === 'true') {
    try {
      console.log('🔐 Intentando cargar secrets de AWS Secrets Manager...');
      
      const secrets = await Promise.all([
        getSecret('jwt-secret'),
        getSecret('mongodb-uri'),
        getSecret('base-url'),
        getSecret('jwt-expires-in')
      ]);

      // Guardar en cache solo si se obtuvieron valores
      if (secrets[0]) secretsCache.JWT_SECRET = secrets[0];
      if (secrets[1]) secretsCache.MONGODB_URI = secrets[1];
      if (secrets[2]) secretsCache.BASE_URL = secrets[2];
      if (secrets[3]) secretsCache.JWT_EXPIRES_IN = secrets[3];

      if (Object.keys(secretsCache).length > 0) {
        console.log('✅ Secrets cargados desde AWS Secrets Manager');
      } else {
        console.log('⚠️  No se encontraron secrets en AWS, usando variables de entorno');
      }
    } catch (error) {
      console.warn('⚠️  Error cargando secrets de AWS, usando variables de entorno:', error.message);
    }
  } else {
    console.log('📝 Usando variables de entorno (USE_AWS_SECRETS no está activado)');
  }

  secretsLoaded = true;
  return secretsCache;
}

// Función helper para obtener valor (secrets > env > default)
function getValue(key, defaultValue) {
  // Primero intentar desde secrets cache (si se cargaron de AWS)
  if (secretsCache[key]) {
    console.log(`📦 Usando ${key} desde Secrets Manager cache`);
    return secretsCache[key];
  }
  // Luego desde variables de entorno
  if (process.env[key]) {
    console.log(`📝 Usando ${key} desde variable de entorno`);
    return process.env[key];
  }
  // Finalmente valor por defecto
  console.warn(`⚠️  ${key} no encontrado, usando valor por defecto`);
  return defaultValue;
}

// Inicializar secrets al cargar el módulo (no bloqueante)
loadSecretsFromAWS().catch(err => {
  console.error('❌ Error inicializando secrets:', err);
});

// Exportar config con getters que usan secrets o env vars
export const config = {
  get port() {
    return parseInt(process.env.PORT || '3000', 10);
  },
  get jwtSecret() {
    const isProduction = process.env.NODE_ENV === 'production';
    const secret = getValue('JWT_SECRET', isProduction ? undefined : 'dev_only_secret_no_usar_en_produccion');

    if (!secret) {
      // En producción nunca debemos arrancar con un secreto adivinable:
      // cualquiera con acceso al código podría forjar tokens válidos.
      throw new Error(
        '❌ JWT_SECRET no está configurado. Defínelo como variable de entorno o en AWS Secrets Manager antes de iniciar en producción.'
      );
    }

    return secret;
  },
  get allowedOrigins() {
    const configured = getValue('ALLOWED_ORIGINS', '');
    if (configured) {
      return configured.split(',').map((origin) => origin.trim()).filter(Boolean);
    }
    // Valores por defecto: frontend de producción + entorno local de desarrollo.
    return ['https://alcance-reducido.com', 'http://localhost:4200'];
  },
  get jwtExpiresIn() {
    return getValue('JWT_EXPIRES_IN', '24h');
  },
  get baseUrl() {
    return getValue('BASE_URL', 'http://localhost:3000');
  },
  get mongoUri() {
    const uri = getValue('MONGODB_URI', 'mongodb://localhost:27017/alcancereducido');
    console.log('🔍 MongoDB URI leída:', uri.substring(0, 30) + '...');
    return uri;
  },
};

// Exportar función para recargar secrets (útil para testing o rotación)
export async function reloadSecrets() {
  secretsLoaded = false;
  secretsCache = {};
  await loadSecretsFromAWS();
}

