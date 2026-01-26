# 🚀 Guía de Deployment AWS - API Alcance Reducido

## 📋 Resumen Ejecutivo

Esta guía te ayudará a desplegar la API en AWS usando **Elastic Beanstalk** con un pipeline CI/CD automático.

**Costo estimado: $10-30/mes** (con free tier: $0-15/mes el primer año)

> ⚠️ **IMPORTANTE**: Antes de empezar, lee `AWS-PREREQUISITOS.md` para verificar que tienes todo lo necesario.

---

## 🏗️ Arquitectura Recomendada

### Elastic Beanstalk + EC2 t3.micro

```
GitHub → CodePipeline → CodeBuild → Elastic Beanstalk → EC2 → MongoDB Atlas
```

**Componentes:**
- ✅ **Elastic Beanstalk**: Gestión automática
- ✅ **EC2 t3.micro**: Instancia de aplicación (free tier disponible)
- ✅ **CodePipeline**: CI/CD automático
- ✅ **MongoDB Atlas**: Base de datos (ya configurada)

---

## 📁 Archivos Creados para AWS

### Configuración de Elastic Beanstalk
- `.ebextensions/01-environment.config` - Variables de entorno
- `.ebextensions/02-nginx.config` - Configuración de Nginx
- `.ebignore` - Archivos a ignorar en el deploy

### Pipeline CI/CD
- `buildspec.yml` - Configuración de CodeBuild
- `appspec.yml` - Configuración de CodeDeploy
- `scripts/before_install.sh` - Script pre-instalación
- `scripts/after_install.sh` - Script post-instalación
- `scripts/application_start.sh` - Script de inicio

### Secrets Manager
- `scripts/aws-secrets-setup.sh` - Script para crear secrets
- `scripts/aws-secrets-read.sh` - Script para leer secrets
- `src/config/secretsManager.js` - Módulo para leer secrets
- `secrets-policy.json` - Política IAM para Secrets Manager
- `secrets-manager-setup.md` - Guía completa de configuración

### Documentación
- `aws-architecture.md` - Arquitectura detallada
- `pipeline-setup.md` - Guía paso a paso

---

## 🚀 Inicio Rápido

### 1. Instalar EB CLI

```bash
pip install awsebcli --upgrade --user
```

### 2. Inicializar Elastic Beanstalk

```bash
eb init -p "Node.js 18" alcancereducido-api --region us-east-1
```

### 3. Crear Entorno de Producción

```bash
eb create alcancereducido-prod \
  --instance-type t3.micro \
  --single
```

### 4. Configurar Variables de Entorno

En AWS Console → Elastic Beanstalk → Configuración → Software:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=tu_secret_key_super_segura
JWT_EXPIRES_IN=24h
BASE_URL=https://tu-app.elasticbeanstalk.com
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/alcancereducido
```

### 6. Configurar Permisos IAM

El rol de Elastic Beanstalk necesita permisos para leer secrets:

```bash
# Crear política desde el archivo
aws iam create-policy \
  --policy-name AlcanceReducidoSecretsManagerPolicy \
  --policy-document file://secrets-policy.json

# Adjuntar al rol de EB
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/AlcanceReducidoSecretsManagerPolicy
```

### 7. Hacer Deploy

```bash
eb deploy
```

---

## 🔄 Pipeline CI/CD

### Configurar CodePipeline

1. Ve a **CodePipeline** en AWS Console
2. Create pipeline → `alcancereducido-api-pipeline`
3. Source: GitHub (conecta tu repo)
4. Build: CodeBuild (usa `buildspec.yml`)
5. Deploy: Elastic Beanstalk

**El pipeline se ejecutará automáticamente en cada push a `main`**

---

## 💰 Costos

| Servicio | Costo Mensual |
|----------|---------------|
| EC2 t3.micro | $0 (free tier) o $7.50 |
| Application Load Balancer | $0 (free tier) o $16 |
| CodePipeline | $1 |
| CodeBuild | ~$0.01-0.05/build |
| Data Transfer | $1-5 |
| **TOTAL** | **$10-30/mes** |

---

## 📚 Documentación Completa

- **Arquitectura detallada**: Ver `aws-architecture.md`
- **Guía paso a paso**: Ver `pipeline-setup.md`
- **Configuración de Secrets**: Ver `secrets-manager-setup.md`

---

## ✅ Checklist de Deployment

- [ ] Cuenta AWS creada
- [ ] EB CLI instalado
- [ ] Aplicación creada en Elastic Beanstalk
- [ ] **Secrets creados en AWS Secrets Manager**
- [ ] **Permisos IAM configurados para Secrets Manager**
- [ ] Variables de entorno básicas configuradas en EB
- [ ] CodePipeline configurado
- [ ] Primer deploy exitoso
- [ ] Health checks pasando
- [ ] Logs funcionando
- [ ] Verificar que secrets se cargan correctamente
- [ ] Dominio configurado (opcional)
- [ ] SSL/TLS configurado (opcional)

---

## 🆘 Troubleshooting

### La aplicación no inicia
```bash
eb logs  # Ver logs
eb ssh   # Conectar por SSH
```

### Health check falla
- Verificar que la app responda en `/`
- Verificar que el puerto sea `8080`
- Revisar security groups

### Build falla
- Verificar `buildspec.yml`
- Revisar logs de CodeBuild
- Verificar que todas las dependencias estén en `package.json`

---

## 📞 Soporte

Para más detalles, consulta:
- `aws-architecture.md` - Arquitectura y opciones
- `pipeline-setup.md` - Guía completa de configuración

