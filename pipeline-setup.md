# Guía de Configuración del Pipeline AWS

## Prerrequisitos

1. Cuenta AWS activa
2. AWS CLI instalado y configurado
3. Repositorio Git (GitHub, GitLab, Bitbucket, etc.)
4. Acceso a MongoDB Atlas (ya configurado)

---

## Paso 1: Configurar Elastic Beanstalk

### 1.1 Crear Aplicación en Elastic Beanstalk

```bash
# Instalar EB CLI
pip install awsebcli --upgrade --user

# Inicializar Elastic Beanstalk
eb init -p "Node.js 18" alcancereducido-api --region us-east-1

# Crear entorno de producción
eb create alcancereducido-prod \
  --instance-type t3.micro \
  --envvars NODE_ENV=production \
  --single
```

### 1.2 Configurar Variables de Entorno en AWS Console

1. Ve a **Elastic Beanstalk** → Tu aplicación → Configuración → Software
2. Agrega las siguientes variables de entorno:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=tu_secret_key_super_segura_aqui
JWT_EXPIRES_IN=24h
BASE_URL=https://tu-dominio.elasticbeanstalk.com
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido
```

**⚠️ IMPORTANTE:** Usa AWS Systems Manager Parameter Store o Secrets Manager para valores sensibles en producción.

---

## Paso 2: Configurar CodePipeline

### 2.1 Crear S3 Bucket para Artifacts

```bash
aws s3 mb s3://alcancereducido-artifacts --region us-east-1
```

### 2.2 Crear Pipeline desde AWS Console

1. Ve a **CodePipeline** → Create pipeline
2. Nombre: `alcancereducido-api-pipeline`
3. Source:
   - Provider: GitHub (o tu proveedor Git)
   - Repository: tu-repo
   - Branch: main (o master)
   - Output artifact format: CodePipeline default
4. Build:
   - Provider: AWS CodeBuild
   - Create project: `alcancereducido-build`
   - Environment: Ubuntu, Standard, Node.js 18
   - Buildspec: `buildspec.yml`
5. Deploy:
   - Provider: AWS Elastic Beanstalk
   - Application: `alcancereducido-api`
   - Environment: `alcancereducido-prod`

### 2.3 Crear CodeBuild Project (Alternativa manual)

```bash
aws codebuild create-project \
  --name alcancereducido-build \
  --source type=GITHUB,location=https://github.com/tu-usuario/tu-repo.git \
  --artifacts type=S3,location=alcancereducido-artifacts \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:5.0,computeType=BUILD_GENERAL1_SMALL \
  --service-role arn:aws:iam::ACCOUNT_ID:role/codebuild-service-role
```

---

## Paso 3: Configurar IAM Roles

### 3.1 Crear Rol para CodeBuild

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.2 Crear Rol para CodePipeline

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild",
        "elasticbeanstalk:*",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Paso 4: Configurar Secrets Manager (Recomendado)

### 4.1 Guardar Secrets

```bash
# Guardar JWT Secret
aws secretsmanager create-secret \
  --name alcancereducido/jwt-secret \
  --secret-string "tu_secret_key_super_segura"

# Guardar MongoDB URI
aws secretsmanager create-secret \
  --name alcancereducido/mongodb-uri \
  --secret-string "mongodb+srv://..."
```

### 4.2 Actualizar Código para Leer de Secrets Manager

Agregar en `src/config/config.js`:

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

async function getSecret(secretName) {
  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}
```

---

## Paso 5: Configurar Dominio (Opcional)

### 5.1 Usar Route 53

1. Crear hosted zone en Route 53
2. Configurar registro A que apunte al ALB de Elastic Beanstalk
3. Actualizar `BASE_URL` en variables de entorno

### 5.2 Usar CloudFront (Opcional, para mejor rendimiento)

1. Crear distribución CloudFront
2. Origin: ALB de Elastic Beanstalk
3. Configurar SSL/TLS

---

## Paso 6: Monitoreo y Logs

### 6.1 CloudWatch Logs

Los logs se configuran automáticamente en Elastic Beanstalk. Puedes verlos en:
- AWS Console → CloudWatch → Log groups → `/aws/elasticbeanstalk/alcancereducido-prod/var/log/eb-engine.log`

### 6.2 Health Checks

Elastic Beanstalk verifica automáticamente el endpoint `/` cada 30 segundos.

---

## Comandos Útiles

### Deploy Manual

```bash
# Desde tu máquina local
eb deploy alcancereducido-prod

# O usando ZIP
eb deploy --staged
```

### Ver Logs

```bash
eb logs
```

### SSH a la Instancia

```bash
eb ssh
```

### Ver Estado

```bash
eb status
```

---

## Troubleshooting

### Error: "Application failed to start"

1. Revisar logs: `eb logs`
2. Verificar variables de entorno
3. Verificar conexión a MongoDB
4. Verificar que el puerto sea 8080 (EB usa proxy en 8080)

### Error: "Build failed"

1. Revisar `buildspec.yml`
2. Verificar que todas las dependencias estén en `package.json`
3. Revisar logs de CodeBuild

### Error: "Health check failed"

1. Verificar que la aplicación responda en `/`
2. Verificar que el puerto sea correcto
3. Revisar security groups

---

## Costos Estimados

- **EC2 t3.micro**: $0 (free tier) o ~$7.50/mes
- **ALB**: $0 (free tier) o ~$16/mes
- **CodePipeline**: $1/mes
- **CodeBuild**: ~$0.01-0.05 por build
- **Data Transfer**: ~$1-5/mes
- **TOTAL**: **$10-30/mes** (con free tier: $0-15/mes)

---

## Próximos Pasos

1. ✅ Configurar Elastic Beanstalk
2. ✅ Configurar CodePipeline
3. ✅ Hacer primer deploy
4. ⬜ Configurar dominio personalizado
5. ⬜ Configurar SSL/TLS
6. ⬜ Configurar alertas en CloudWatch
7. ⬜ Configurar backup automático



