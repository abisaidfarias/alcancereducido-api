# 🔐 Configuración de AWS Secrets Manager

Esta guía explica cómo configurar y usar AWS Secrets Manager para gestionar las credenciales sensibles de la aplicación.

---

## 📋 Secrets a Configurar

Los siguientes secrets deben crearse en AWS Secrets Manager:

1. **`alcancereducido/jwt-secret`** - Clave secreta para JWT
2. **`alcancereducido/mongodb-uri`** - URI de conexión a MongoDB Atlas
3. **`alcancereducido/base-url`** - URL base de la API
4. **`alcancereducido/jwt-expires-in`** - Tiempo de expiración de JWT (opcional)

---

## 🚀 Método 1: Script Automático (Recomendado)

### Paso 1: Dar permisos de ejecución

```bash
chmod +x scripts/aws-secrets-setup.sh
```

### Paso 2: Ejecutar el script

```bash
./scripts/aws-secrets-setup.sh
```

El script te guiará paso a paso para crear todos los secrets.

---

## 🚀 Método 2: AWS CLI Manual

### 1. Crear JWT Secret

```bash
# Generar un secret aleatorio
JWT_SECRET=$(openssl rand -base64 32)

# Crear el secret en AWS
aws secretsmanager create-secret \
  --name alcancereducido/jwt-secret \
  --secret-string "$JWT_SECRET" \
  --description "JWT Secret key para autenticación de la API" \
  --region us-east-1
```

### 2. Crear MongoDB URI

```bash
aws secretsmanager create-secret \
  --name alcancereducido/mongodb-uri \
  --secret-string "mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido" \
  --description "MongoDB Atlas connection string" \
  --region us-east-1
```

### 3. Crear Base URL

```bash
aws secretsmanager create-secret \
  --name alcancereducido/base-url \
  --secret-string "https://tu-app.elasticbeanstalk.com" \
  --description "Base URL de la API para generación de QR codes" \
  --region us-east-1
```

### 4. Crear JWT Expires In (Opcional)

```bash
aws secretsmanager create-secret \
  --name alcancereducido/jwt-expires-in \
  --secret-string "24h" \
  --description "Tiempo de expiración de los tokens JWT" \
  --region us-east-1
```

---

## 🔍 Verificar Secrets

### Listar todos los secrets

```bash
aws secretsmanager list-secrets \
  --filters Key=name,Values=alcancereducido/ \
  --query 'SecretList[*].[Name,Description]' \
  --output table
```

### Leer un secret específico

```bash
# Usar el script helper
./scripts/aws-secrets-read.sh alcancereducido/jwt-secret

# O manualmente
aws secretsmanager get-secret-value \
  --secret-id alcancereducido/jwt-secret \
  --query 'SecretString' \
  --output text
```

---

## 🔑 Configurar Permisos IAM

### 1. Crear Política IAM para Secrets Manager

Crea una política con el siguiente JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:alcancereducido/*"
    }
  ]
}
```

### 2. Asignar Política al Rol de Elastic Beanstalk

1. Ve a **IAM** → **Roles**
2. Busca el rol de Elastic Beanstalk (ej: `aws-elasticbeanstalk-ec2-role`)
3. Agrega la política creada arriba

**O usando AWS CLI:**

```bash
# Obtener el nombre del rol de EB
EB_ROLE=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name alcancereducido-prod \
  --query 'EnvironmentResources.IamInstanceProfile' \
  --output text)

# Crear política
aws iam create-policy \
  --policy-name AlcanceReducidoSecretsManagerPolicy \
  --policy-document file://secrets-policy.json

# Adjuntar política al rol
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/AlcanceReducidoSecretsManagerPolicy
```

---

## 🔄 Actualizar Variables de Entorno en Elastic Beanstalk

Aunque los secrets se leen automáticamente desde Secrets Manager, puedes configurar variables de entorno adicionales:

1. Ve a **Elastic Beanstalk** → Tu aplicación → Configuración → Software
2. Agrega:

```
NODE_ENV=production
PORT=8080
AWS_REGION=us-east-1
USE_AWS_SECRETS=true
```

**Nota:** La aplicación intentará leer de Secrets Manager automáticamente en producción.

---

## 📝 Cómo Funciona en el Código

### Configuración Automática

El archivo `src/config/config.js` está configurado para:

1. **En desarrollo**: Usar variables de entorno del archivo `.env`
2. **En producción**: Intentar leer de AWS Secrets Manager primero, luego usar variables de entorno como fallback

### Flujo de Lectura

```
1. ¿Estamos en producción o USE_AWS_SECRETS=true?
   ├─ SÍ → Intentar leer de AWS Secrets Manager
   │        ├─ ¿Éxito? → Usar secrets de AWS
   │        └─ ¿Error? → Usar variables de entorno (fallback)
   └─ NO → Usar variables de entorno directamente
```

---

## 🔒 Seguridad

### Mejores Prácticas

1. ✅ **Nunca commits secrets en Git**
   - El archivo `.env` está en `.gitignore`
   - Los secrets solo existen en AWS Secrets Manager

2. ✅ **Rotación de Secrets**
   - Configura rotación automática para JWT secret cada 90 días
   - Actualiza MongoDB URI si cambias credenciales

3. ✅ **Principio de Menor Privilegio**
   - Solo da permisos de lectura a la aplicación
   - No permitas escritura desde la aplicación

4. ✅ **Auditoría**
   - Habilita CloudTrail para rastrear acceso a secrets
   - Revisa logs regularmente

### Rotar un Secret

```bash
# Actualizar JWT secret
aws secretsmanager update-secret \
  --secret-id alcancereducido/jwt-secret \
  --secret-string "nuevo_secret_aqui" \
  --region us-east-1

# La aplicación recargará automáticamente en el próximo request
# (o reinicia la aplicación en EB)
```

---

## 🧪 Testing Local

Para probar localmente con Secrets Manager:

```bash
# Configurar AWS credentials
aws configure

# Establecer variable de entorno
export USE_AWS_SECRETS=true
export AWS_REGION=us-east-1

# Ejecutar aplicación
npm start
```

---

## 🆘 Troubleshooting

### Error: "AccessDeniedException"

**Problema:** El rol de EC2 no tiene permisos para leer secrets.

**Solución:**
1. Verifica que la política IAM esté adjuntada al rol
2. Verifica que el ARN del secret sea correcto
3. Verifica que el rol tenga permisos en la región correcta

### Error: "ResourceNotFoundException"

**Problema:** El secret no existe o el nombre es incorrecto.

**Solución:**
1. Lista todos los secrets: `aws secretsmanager list-secrets`
2. Verifica el nombre exacto del secret
3. Asegúrate de usar el prefijo `alcancereducido/`

### La aplicación no lee los secrets

**Problema:** La aplicación está usando variables de entorno en lugar de secrets.

**Solución:**
1. Verifica que `NODE_ENV=production` o `USE_AWS_SECRETS=true`
2. Verifica que `AWS_REGION` esté configurado
3. Revisa los logs de la aplicación para ver mensajes de error

---

## 📚 Referencias

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [IAM Policies for Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_iam-permissions.html)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/)



