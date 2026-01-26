# 📋 Prerrequisitos y Checklist para AWS Deployment

## ✅ Prerrequisitos Necesarios

### 1. Cuenta y Acceso AWS

- [ ] **Cuenta AWS activa**
  - Si no tienes: https://aws.amazon.com/
  - Necesitas tarjeta de crédito (aunque uses free tier)

- [ ] **Acceso a AWS Console**
  - URL: https://console.aws.amazon.com/
  - Usuario con permisos de administrador o permisos para:
    - Elastic Beanstalk
    - EC2
    - IAM
    - CodePipeline
    - CodeBuild
    - Secrets Manager
    - S3

- [ ] **AWS CLI instalado y configurado**
  ```bash
  # Instalar AWS CLI
  # Windows: https://aws.amazon.com/cli/
  # Mac: brew install awscli
  # Linux: sudo apt-get install awscli
  
  # Configurar credenciales
  aws configure
  # Necesitarás:
  # - AWS Access Key ID
  # - AWS Secret Access Key
  # - Default region (ej: us-east-1)
  # - Default output format (json)
  ```

### 2. Herramientas Locales

- [ ] **Node.js 18.x instalado**
  ```bash
  node --version  # Debe ser v18.x o superior
  ```

- [ ] **Git instalado y configurado**
  ```bash
  git --version
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu@email.com"
  ```

- [ ] **EB CLI instalado** (Elastic Beanstalk CLI)
  ```bash
  pip install awsebcli --upgrade --user
  # Verificar instalación
  eb --version
  ```

- [ ] **Repositorio Git configurado**
  - [ ] Código en GitHub, GitLab o Bitbucket
  - [ ] Repositorio accesible desde tu máquina

### 3. Información Requerida

#### Credenciales MongoDB Atlas
- [ ] **MongoDB URI completa**
  - Formato: `mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido`
  - Obtener de: MongoDB Atlas → Connect → Connect your application

#### Credenciales AWS
- [ ] **AWS Access Key ID**
  - Crear en: IAM → Users → Security credentials → Create access key
- [ ] **AWS Secret Access Key**
  - Se muestra solo una vez al crear el Access Key

#### Información de la Aplicación
- [ ] **JWT Secret** (o generar uno nuevo)
  - Puede ser cualquier string seguro (mínimo 32 caracteres)
  - O generar: `openssl rand -base64 32`
- [ ] **Base URL** (opcional, se puede actualizar después)
  - Ejemplo: `https://alcancereducido-prod.elasticbeanstalk.com`
  - O tu dominio personalizado si lo tienes

---

## 📝 Checklist de Configuración Paso a Paso

### Fase 1: Preparación Local

- [ ] **1.1** Clonar/verificar repositorio
  ```bash
  git clone tu-repositorio
  cd alcancereducido
  ```

- [ ] **1.2** Instalar dependencias
  ```bash
  npm install
  ```

- [ ] **1.3** Verificar que la aplicación funciona localmente
  ```bash
  npm start
  # Verificar en http://localhost:3000
  ```

- [ ] **1.4** Verificar archivos de configuración AWS
  - [ ] `.ebextensions/01-environment.config` existe
  - [ ] `.ebextensions/02-nginx.config` existe
  - [ ] `buildspec.yml` existe
  - [ ] `scripts/` con todos los scripts

### Fase 2: Configuración AWS - Secrets Manager

- [ ] **2.1** Crear secrets en AWS Secrets Manager
  ```bash
  chmod +x scripts/aws-secrets-setup.sh
  ./scripts/aws-secrets-setup.sh
  ```
  
  O manualmente:
  - [ ] `alcancereducido/jwt-secret`
  - [ ] `alcancereducido/mongodb-uri`
  - [ ] `alcancereducido/base-url`
  - [ ] `alcancereducido/jwt-expires-in` (opcional)

- [ ] **2.2** Verificar que los secrets se crearon
  ```bash
  aws secretsmanager list-secrets \
    --filters Key=name,Values=alcancereducido/ \
    --query 'SecretList[*].Name' \
    --output table
  ```

### Fase 3: Configuración AWS - IAM

- [ ] **3.1** Crear política IAM para Secrets Manager
  ```bash
  aws iam create-policy \
    --policy-name AlcanceReducidoSecretsManagerPolicy \
    --policy-document file://secrets-policy.json \
    --description "Permite leer secrets de alcancereducido"
  ```

- [ ] **3.2** Obtener ARN de la política creada
  ```bash
  aws iam list-policies \
    --query 'Policies[?PolicyName==`AlcanceReducidoSecretsManagerPolicy`].Arn' \
    --output text
  ```

- [ ] **3.3** Obtener nombre del rol de Elastic Beanstalk
  ```bash
  # Primero necesitas crear el entorno EB, luego:
  aws elasticbeanstalk describe-environment-resources \
    --environment-name alcancereducido-prod \
    --query 'EnvironmentResources.IamInstanceProfile' \
    --output text
  ```

- [ ] **3.4** Adjuntar política al rol de EB
  ```bash
  aws iam attach-role-policy \
    --role-name aws-elasticbeanstalk-ec2-role \
    --policy-arn arn:aws:iam::TU_ACCOUNT_ID:policy/AlcanceReducidoSecretsManagerPolicy
  ```

### Fase 4: Configuración AWS - Elastic Beanstalk

- [ ] **4.1** Inicializar Elastic Beanstalk
  ```bash
  eb init -p "Node.js 18" alcancereducido-api --region us-east-1
  ```
  - Seleccionar región (ej: us-east-1)
  - Crear nueva aplicación: `alcancereducido-api`

- [ ] **4.2** Crear entorno de producción
  ```bash
  eb create alcancereducido-prod \
    --instance-type t3.micro \
    --single \
    --region us-east-1
  ```
  - Esto puede tomar 5-10 minutos

- [ ] **4.3** Configurar variables de entorno en EB
  - Ve a: AWS Console → Elastic Beanstalk → alcancereducido-prod → Configuration → Software
  - Agregar:
    ```
    NODE_ENV=production
    PORT=8080
    AWS_REGION=us-east-1
    USE_AWS_SECRETS=true
    ```

- [ ] **4.4** Verificar health del entorno
  ```bash
  eb status
  eb health
  ```

### Fase 5: Configuración AWS - CodePipeline (Opcional pero Recomendado)

- [ ] **5.1** Crear S3 bucket para artifacts
  ```bash
  aws s3 mb s3://alcancereducido-artifacts-$(date +%s) --region us-east-1
  ```

- [ ] **5.2** Crear pipeline desde AWS Console
  - Ve a: CodePipeline → Create pipeline
  - Nombre: `alcancereducido-api-pipeline`
  - Source: Conectar tu repositorio Git
  - Build: CodeBuild (crear proyecto nuevo)
  - Deploy: Elastic Beanstalk → `alcancereducido-prod`

- [ ] **5.3** Verificar que el pipeline funciona
  - Hacer un commit y push
  - Verificar que el pipeline se ejecuta automáticamente

### Fase 6: Primer Deploy

- [ ] **6.1** Hacer deploy manual (primer vez)
  ```bash
  eb deploy alcancereducido-prod
  ```

- [ ] **6.2** Verificar logs
  ```bash
  eb logs
  ```

- [ ] **6.3** Verificar que la aplicación responde
  ```bash
  eb open  # Abre la URL en el navegador
  ```

- [ ] **6.4** Verificar que los secrets se cargan
  - Revisar logs para mensaje: "✅ Secrets cargados desde AWS Secrets Manager"

### Fase 7: Verificación Final

- [ ] **7.1** Health check pasando
  ```bash
  eb health
  # Debe mostrar "Ok" en verde
  ```

- [ ] **7.2** Endpoints funcionando
  - [ ] `GET /` - Debe responder
  - [ ] `GET /api-docs` - Swagger debe cargar
  - [ ] `POST /api/auth/login` - Login funciona

- [ ] **7.3** Verificar conexión a MongoDB
  - Revisar logs para: "✅ MongoDB conectado exitosamente"

- [ ] **7.4** Verificar que secrets se usan
  - Los logs deben mostrar que se cargaron desde Secrets Manager
  - No deben aparecer valores por defecto

---

## 🔑 Información que Necesitas Tener Lista

### Antes de Empezar, Ten Preparado:

1. **MongoDB Atlas URI**
   ```
   mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido
   ```

2. **JWT Secret** (o generar uno)
   ```bash
   openssl rand -base64 32
   ```

3. **AWS Credentials**
   - Access Key ID
   - Secret Access Key
   - Account ID (opcional, se puede obtener después)

4. **Base URL** (puede ser temporal)
   ```
   https://alcancereducido-prod.elasticbeanstalk.com
   ```

5. **Repositorio Git**
   - URL del repositorio
   - Branch principal (main/master)

---

## 📊 Resumen de Costos Esperados

| Servicio | Costo Mensual | Notas |
|----------|---------------|-------|
| EC2 t3.micro | $0-7.50 | Free tier: 750 horas/mes primer año |
| Application Load Balancer | $0-16 | Free tier: 750 horas/mes primer año |
| Secrets Manager | $0.40/secret/mes | Primeros 10,000 requests gratis |
| CodePipeline | $1 | Primer pipeline activo |
| CodeBuild | ~$0.01-0.05/build | Solo cuando se ejecuta |
| Data Transfer | $1-5 | Depende del tráfico |
| **TOTAL** | **$2-30/mes** | Con free tier: $0-15/mes |

---

## 🚨 Errores Comunes y Soluciones

### Error: "Access Denied"
- **Causa**: Permisos IAM insuficientes
- **Solución**: Verificar que el rol de EB tenga la política de Secrets Manager

### Error: "Secret not found"
- **Causa**: El secret no existe o el nombre es incorrecto
- **Solución**: Verificar nombres con `aws secretsmanager list-secrets`

### Error: "Health check failed"
- **Causa**: La aplicación no responde en el puerto 8080
- **Solución**: Verificar logs con `eb logs` y que la app esté corriendo

### Error: "MongoDB connection failed"
- **Causa**: URI incorrecta o IP no whitelisted en MongoDB Atlas
- **Solución**: 
  - Verificar URI en Secrets Manager
  - Agregar IP de EC2 a whitelist en MongoDB Atlas (o usar 0.0.0.0/0 temporalmente)

---

## 📞 Siguiente Paso

Una vez tengas todos los prerrequisitos listos:

1. **Lee**: `README-AWS.md` para inicio rápido
2. **Sigue**: `pipeline-setup.md` para configuración detallada
3. **Consulta**: `secrets-manager-setup.md` para configuración de secrets

---

## ✅ Checklist Rápido

Antes de empezar, verifica que tienes:

- [ ] Cuenta AWS activa
- [ ] AWS CLI instalado y configurado (`aws configure`)
- [ ] EB CLI instalado (`eb --version`)
- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] MongoDB URI lista
- [ ] JWT Secret generado
- [ ] Repositorio Git con el código
- [ ] Acceso a AWS Console

**Si tienes todo esto, estás listo para empezar! 🚀**



