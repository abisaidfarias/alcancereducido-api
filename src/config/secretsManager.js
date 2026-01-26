// Intentar importar AWS SDK dinámicamente
let SecretsManagerClient, GetSecretValueCommand;
let secretsClient = null;
let sdkAvailable = false;

// Función para inicializar el cliente de Secrets Manager
async function initSecretsClient() {
  if (sdkAvailable || secretsClient) {
    return secretsClient;
  }

  try {
    const awsSDK = await import("@aws-sdk/client-secrets-manager");
    SecretsManagerClient = awsSDK.SecretsManagerClient;
    GetSecretValueCommand = awsSDK.GetSecretValueCommand;
    
    secretsClient = new SecretsManagerClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    sdkAvailable = true;
    return secretsClient;
  } catch (error) {
    console.warn('⚠️  AWS SDK no disponible, usando variables de entorno:', error.message);
    sdkAvailable = false;
    return null;
  }
}

const SECRET_PREFIX = 'alcancereducido';
const secretsCache = {};

/**
 * Obtiene un secret de AWS Secrets Manager
 * @param {string} secretName - Nombre del secret (sin prefijo)
 * @param {boolean} useCache - Si usar caché (default: true)
 * @returns {Promise<string|null>} - Valor del secret o null si hay error
 */
export async function getSecret(secretName, useCache = true) {
  const fullSecretName = `${SECRET_PREFIX}/${secretName}`;
  
  // Verificar caché
  if (useCache && secretsCache[fullSecretName]) {
    return secretsCache[fullSecretName];
  }

  // Intentar inicializar el cliente si no está disponible
  const client = await initSecretsClient();
  
  // Si no hay cliente de Secrets Manager, retornar null para usar env vars
  if (!client || !GetSecretValueCommand) {
    return null;
  }

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: fullSecretName })
    );
    
    const secretValue = response.SecretString;
    
    // Guardar en caché
    if (useCache) {
      secretsCache[fullSecretName] = secretValue;
    }
    
    return secretValue;
  } catch (error) {
    console.error(`❌ Error obteniendo secret ${fullSecretName}:`, error.message);
    
    // Si estamos en desarrollo o el secret no existe, retornar null
    // para que use las variables de entorno como fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Usando variable de entorno como fallback para ${secretName}`);
    }
    
    return null;
  }
}

/**
 * Obtiene múltiples secrets a la vez
 * @param {string[]} secretNames - Array de nombres de secrets
 * @returns {Promise<Object>} - Objeto con los secrets
 */
export async function getSecrets(secretNames) {
  const secrets = {};
  
  await Promise.all(
    secretNames.map(async (name) => {
      secrets[name] = await getSecret(name);
    })
  );
  
  return secrets;
}

/**
 * Limpia la caché de secrets (útil para testing o cuando se actualizan secrets)
 */
export function clearSecretsCache() {
  Object.keys(secretsCache).forEach(key => delete secretsCache[key]);
}

