# Arquitectura AWS - API Alcance Reducido

## Recomendación de Arquitectura (Costo Optimizado)

### Opción 1: Elastic Beanstalk (RECOMENDADA - Más Económica)
**Costo estimado: $10-30/mes** (con free tier el primer año puede ser $0-15/mes)

#### Componentes:
- **AWS Elastic Beanstalk**: Gestión automática de infraestructura
- **EC2 t3.micro o t3.small**: Instancia de aplicación
  - t3.micro: Elegible para free tier (750 horas/mes gratis primer año)
  - t3.small: ~$15/mes si no hay free tier
- **Application Load Balancer**: Incluido en Elastic Beanstalk (gratis hasta cierto límite)
- **MongoDB Atlas**: Ya en uso (no incluir en costos AWS)
- **CodePipeline + CodeDeploy**: CI/CD automático
- **CloudWatch**: Logs y monitoreo básico (gratis hasta 5GB/mes)

#### Ventajas:
- ✅ Gestión automática de escalado
- ✅ Health checks automáticos
- ✅ Rollback automático en caso de error
- ✅ Muy fácil de configurar
- ✅ Soporte para múltiples entornos (dev, staging, prod)

---

### Opción 2: ECS Fargate (Serverless Containers)
**Costo estimado: $20-40/mes**

#### Componentes:
- **ECS Fargate**: Contenedores serverless
- **ECR**: Registro de imágenes Docker
- **Application Load Balancer**: Balanceador de carga
- **CodePipeline + CodeBuild**: CI/CD

#### Ventajas:
- ✅ Pago solo por uso
- ✅ Escalado automático
- ✅ No gestión de servidores

#### Desventajas:
- ❌ Más caro que EC2 para cargas constantes
- ❌ Requiere Dockerfile

---

### Opción 3: Lambda + API Gateway (Serverless)
**Costo estimado: $5-15/mes** (con poco tráfico)

#### Componentes:
- **AWS Lambda**: Funciones serverless
- **API Gateway**: Endpoint HTTP
- **CodePipeline**: CI/CD

#### Ventajas:
- ✅ Muy económico con poco tráfico
- ✅ Escalado automático infinito
- ✅ Pago solo por requests

#### Desventajas:
- ❌ Cold starts pueden afectar latencia
- ❌ Requiere refactorización del código
- ❌ Límites de tiempo de ejecución (15 min)

---

## Arquitectura Recomendada: Elastic Beanstalk

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Route 53 (DNS)        │  (Opcional)
         │  api.tudominio.com    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Application Load     │
         │  Balancer (ALB)       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Elastic Beanstalk    │
         │  Environment          │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
  ┌─────────────┐        ┌─────────────┐
  │  EC2 t3     │        │  EC2 t3     │
  │  Instance 1 │        │  Instance 2 │
  │  (Auto      │        │  (Auto      │
  │  Scaling)   │        │  Scaling)   │
  └──────┬──────┘        └──────┬──────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  MongoDB Atlas        │
         │  (Ya configurado)     │
         └───────────────────────┘
```

---

## Pipeline CI/CD Recomendado

```
GitHub/GitLab
    │
    ▼
CodePipeline (Trigger automático)
    │
    ├─► CodeBuild (Build & Test)
    │   │
    │   ├─► npm install
    │   ├─► npm test (si hay tests)
    │   └─► Crear artifact (ZIP)
    │
    └─► CodeDeploy
        │
        └─► Elastic Beanstalk
            │
            └─► Deploy a producción
```

---

## Costos Estimados Mensuales

### Opción 1: Elastic Beanstalk (Recomendada)
- **EC2 t3.micro**: $0 (free tier) o ~$7.50/mes
- **Application Load Balancer**: $0 (free tier) o ~$16/mes
- **Data Transfer**: ~$1-5/mes
- **CloudWatch**: $0 (primeros 5GB gratis)
- **CodePipeline**: $1/mes (primer pipeline activo)
- **CodeBuild**: ~$0.005/minuto (solo cuando build)
- **TOTAL**: **$10-30/mes** (con free tier: $0-15/mes)

### Opción 2: ECS Fargate
- **Fargate**: ~$0.04/vCPU-hora + $0.004/GB-hora
- **ALB**: ~$16/mes
- **TOTAL**: **$20-40/mes**

### Opción 3: Lambda + API Gateway
- **Lambda**: $0.20 por 1M requests
- **API Gateway**: $3.50 por 1M requests
- **TOTAL**: **$5-15/mes** (con poco tráfico)

---

## Recomendación Final

**Usar Elastic Beanstalk con EC2 t3.micro** porque:
1. ✅ Más económico para producción
2. ✅ Fácil de configurar y mantener
3. ✅ Escalado automático cuando sea necesario
4. ✅ Health checks y rollback automático
5. ✅ Compatible con tu código actual sin cambios
6. ✅ Free tier disponible el primer año

---

## Próximos Pasos

1. Crear cuenta AWS (si no tienes)
2. Configurar Elastic Beanstalk
3. Configurar CodePipeline
4. Configurar variables de entorno en AWS
5. Hacer primer deploy
6. Configurar dominio (opcional)



