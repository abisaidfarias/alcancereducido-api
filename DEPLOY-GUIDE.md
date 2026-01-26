# 🚀 Guía de Deployment Automatizado

Esta guía te ayudará a desplegar la API en AWS usando scripts automatizados.

## ⚡ Inicio Rápido

### Opción 1: Script Automatizado (Linux/Mac)

```bash
# Dar permisos de ejecución
chmod +x scripts/deploy-aws-complete.sh

# Ejecutar script
./scripts/deploy-aws-complete.sh
```

El script te pedirá:
- MongoDB URI
- JWT Secret (o lo genera automáticamente)
- Base URL (opcional)
- Configuración del entorno

### Opción 2: Script Automatizado (Windows)

```powershell
# Ejecutar script PowerShell
.\scripts\deploy-aws-windows.ps1
```

### Opción 3: Manual (Paso a Paso)

Si prefieres hacerlo manualmente, sigue estos pasos:

#### 1. Configurar Secrets

```bash
chmod +x scripts/aws-secrets-setup.sh
./scripts/aws-secrets-setup.sh
```

#### 2. Crear Política IAM

```bash
aws iam create-policy \
  --policy-name AlcanceReducidoSecretsManagerPolicy \
  --policy-document file://secrets-policy.json
```

#### 3. Inicializar Elastic Beanstalk

```bash
eb init -p "Node.js 18" alcancereducido-api --region us-east-1
```

#### 4. Crear Entorno

```bash
eb create alcancereducido-prod \
  --instance-type t3.micro \
  --single \
  --envvars "NODE_ENV=production,PORT=8080,AWS_REGION=us-east-1,USE_AWS_SECRETS=true"
```

#### 5. Configurar Permisos IAM

```bash
# Obtener Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Adjuntar política al rol
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/AlcanceReducidoSecretsManagerPolicy
```

#### 6. Deploy

```bash
eb deploy alcancereducido-prod
```

## 📋 Lo que el Script Hace Automáticamente

1. ✅ Verifica prerrequisitos (AWS CLI, Node.js, etc.)
2. ✅ Verifica autenticación AWS
3. ✅ Crea todos los secrets en Secrets Manager
4. ✅ Crea política IAM para Secrets Manager
5. ✅ Inicializa Elastic Beanstalk
6. ✅ Crea entorno de producción
7. ✅ Configura variables de entorno
8. ✅ Adjunta política IAM al rol de EB
9. ✅ Verifica deployment y health checks

## 🔍 Verificación Post-Deployment

### 1. Verificar Logs

```bash
eb logs
```

Busca estos mensajes:
- ✅ `Secrets cargados desde AWS Secrets Manager`
- ✅ `MongoDB conectado exitosamente`
- ✅ `Servidor corriendo en http://localhost:8080`

### 2. Verificar Health

```bash
eb health --refresh
```

Debe mostrar estado "Ok" en verde.

### 3. Probar Endpoints

```bash
# Obtener URL
eb open

# Probar endpoint raíz
curl http://tu-url.elasticbeanstalk.com/

# Probar Swagger
curl http://tu-url.elasticbeanstalk.com/api-docs
```

## 🆘 Troubleshooting

### Error: "Access Denied" al leer secrets

**Solución:**
```bash
# Verificar que la política esté adjuntada
aws iam list-attached-role-policies --role-name aws-elasticbeanstalk-ec2-role

# Si no está, adjuntarla manualmente
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/AlcanceReducidoSecretsManagerPolicy
```

### Error: "Secret not found"

**Solución:**
```bash
# Listar secrets
aws secretsmanager list-secrets \
  --filters Key=name,Values=alcancereducido/

# Verificar nombres exactos
```

### Error: "Health check failed"

**Solución:**
```bash
# Ver logs detallados
eb logs --all

# Verificar que la app esté corriendo
eb ssh
# Dentro de la instancia:
ps aux | grep node
```

## 📚 Documentación Adicional

- **Prerrequisitos**: `AWS-PREREQUISITOS.md`
- **Configuración de Secrets**: `secrets-manager-setup.md`
- **Guía completa**: `pipeline-setup.md`
- **Arquitectura**: `aws-architecture.md`

## ✅ Checklist Post-Deployment

- [ ] Secrets creados en Secrets Manager
- [ ] Política IAM adjuntada al rol de EB
- [ ] Entorno EB creado y saludable
- [ ] Logs muestran que secrets se cargan correctamente
- [ ] MongoDB conectado exitosamente
- [ ] Endpoints responden correctamente
- [ ] Swagger accesible en `/api-docs`
- [ ] Health checks pasando



