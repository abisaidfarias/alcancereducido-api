#!/bin/bash
# Script completo para desplegar la API en AWS
# Este script automatiza todo el proceso de configuración
# Uso: ./scripts/deploy-aws-complete.sh

set -e  # Salir si hay algún error

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Script de Deployment Completo para AWS${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Verificar prerrequisitos
echo -e "${YELLOW}📋 Verificando prerrequisitos...${NC}"

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "   Instala desde: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI instalado${NC}"

# Verificar EB CLI
if ! command -v eb &> /dev/null; then
    echo -e "${YELLOW}⚠️  EB CLI no está instalado. Instalando...${NC}"
    pip install awsebcli --upgrade --user
    export PATH=$PATH:~/.local/bin
fi
echo -e "${GREEN}✅ EB CLI instalado${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js versión 18+ requerida. Versión actual: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) instalado${NC}"

# Verificar autenticación AWS
echo ""
echo -e "${YELLOW}🔐 Verificando autenticación AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en AWS${NC}"
    echo "   Ejecuta: aws configure"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
echo -e "${GREEN}✅ Autenticado en AWS${NC}"
echo -e "   Account ID: ${AWS_ACCOUNT}"
echo -e "   Región: ${AWS_REGION}"
echo ""

# Obtener información del usuario
echo -e "${YELLOW}📝 Información necesaria:${NC}"
read -p "Nombre de la aplicación (default: alcancereducido-api): " APP_NAME
APP_NAME=${APP_NAME:-alcancereducido-api}

read -p "Nombre del entorno (default: alcancereducido-prod): " ENV_NAME
ENV_NAME=${ENV_NAME:-alcancereducido-prod}

read -p "Región AWS (default: ${AWS_REGION}): " REGION
REGION=${REGION:-${AWS_REGION}}

read -p "Tipo de instancia (default: t3.micro): " INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.micro}

echo ""
echo -e "${YELLOW}🔐 Configuración de Secrets:${NC}"
read -sp "MongoDB URI (mongodb+srv://...): " MONGO_URI
echo ""

read -sp "JWT Secret (o presiona Enter para generar uno): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "\n${GREEN}✅ JWT Secret generado automáticamente${NC}"
fi
echo ""

read -p "Base URL (default: se generará después): " BASE_URL
BASE_URL=${BASE_URL:-""}

read -p "JWT Expires In (default: 24h): " JWT_EXPIRES
JWT_EXPIRES=${JWT_EXPIRES:-24h}

SECRET_PREFIX="alcancereducido"

echo ""
echo -e "${BLUE}📦 Paso 1: Crear Secrets en AWS Secrets Manager${NC}"
echo ""

# Crear secrets
create_secret() {
    local name=$1
    local value=$2
    local description=$3
    
    if aws secretsmanager describe-secret --secret-id "${name}" --region "${REGION}" &> /dev/null; then
        echo -e "${YELLOW}⚠️  Secret ${name} ya existe. Actualizando...${NC}"
        aws secretsmanager update-secret \
            --secret-id "${name}" \
            --secret-string "${value}" \
            --region "${REGION}" \
            --description "${description}" \
            > /dev/null
        echo -e "${GREEN}✅ Secret actualizado: ${name}${NC}"
    else
        aws secretsmanager create-secret \
            --name "${name}" \
            --secret-string "${value}" \
            --region "${REGION}" \
            --description "${description}" \
            > /dev/null
        echo -e "${GREEN}✅ Secret creado: ${name}${NC}"
    fi
}

create_secret "${SECRET_PREFIX}/jwt-secret" "${JWT_SECRET}" "JWT Secret key para autenticación"
create_secret "${SECRET_PREFIX}/mongodb-uri" "${MONGO_URI}" "MongoDB Atlas connection string"
if [ -n "$BASE_URL" ]; then
    create_secret "${SECRET_PREFIX}/base-url" "${BASE_URL}" "Base URL de la API"
fi
create_secret "${SECRET_PREFIX}/jwt-expires-in" "${JWT_EXPIRES}" "Tiempo de expiración de JWT"

echo ""
echo -e "${BLUE}📦 Paso 2: Crear Política IAM para Secrets Manager${NC}"
echo ""

POLICY_NAME="AlcanceReducidoSecretsManagerPolicy"
POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT}:policy/${POLICY_NAME}"

# Verificar si la política existe
if aws iam get-policy --policy-arn "${POLICY_ARN}" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Política ${POLICY_NAME} ya existe${NC}"
else
    aws iam create-policy \
        --policy-name "${POLICY_NAME}" \
        --policy-document file://secrets-policy.json \
        --description "Permite leer secrets de alcancereducido" \
        > /dev/null
    echo -e "${GREEN}✅ Política IAM creada: ${POLICY_NAME}${NC}"
fi

echo ""
echo -e "${BLUE}📦 Paso 3: Inicializar Elastic Beanstalk${NC}"
echo ""

# Inicializar EB si no está inicializado
if [ ! -f ".elasticbeanstalk/config.yml" ]; then
    echo -e "${YELLOW}Inicializando Elastic Beanstalk...${NC}"
    eb init "${APP_NAME}" \
        --platform "Node.js 18" \
        --region "${REGION}" \
        --tags "Environment=Production,Project=AlcanceReducido" \
        --non-interactive
    echo -e "${GREEN}✅ Elastic Beanstalk inicializado${NC}"
else
    echo -e "${GREEN}✅ Elastic Beanstalk ya está inicializado${NC}"
fi

echo ""
echo -e "${BLUE}📦 Paso 4: Crear Entorno de Producción${NC}"
echo ""

# Verificar si el entorno existe
if eb status "${ENV_NAME}" &> /dev/null; then
    echo -e "${YELLOW}⚠️  El entorno ${ENV_NAME} ya existe${NC}"
    read -p "¿Deseas actualizarlo? (s/n): " UPDATE_ENV
    if [[ "$UPDATE_ENV" =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}Actualizando entorno...${NC}"
        eb deploy "${ENV_NAME}"
    else
        echo -e "${YELLOW}Saltando creación de entorno${NC}"
    fi
else
    echo -e "${YELLOW}Creando entorno ${ENV_NAME}...${NC}"
    eb create "${ENV_NAME}" \
        --instance-type "${INSTANCE_TYPE}" \
        --single \
        --region "${REGION}" \
        --envvars "NODE_ENV=production,PORT=8080,AWS_REGION=${REGION},USE_AWS_SECRETS=true" \
        --tags "Environment=Production,Project=AlcanceReducido"
    
    echo -e "${GREEN}✅ Entorno creado${NC}"
    echo -e "${YELLOW}⏳ Esperando a que el entorno esté listo (esto puede tomar 5-10 minutos)...${NC}"
    eb wait
fi

echo ""
echo -e "${BLUE}📦 Paso 5: Configurar Permisos IAM${NC}"
echo ""

# Obtener el rol de EC2 de Elastic Beanstalk
EB_ROLE=$(aws elasticbeanstalk describe-environment-resources \
    --environment-name "${ENV_NAME}" \
    --region "${REGION}" \
    --query 'EnvironmentResources.IamInstanceProfile' \
    --output text 2>/dev/null || echo "")

if [ -n "$EB_ROLE" ]; then
    # Extraer el nombre del rol (el profile name sin el prefijo)
    ROLE_NAME=$(echo "$EB_ROLE" | sed 's/-.*$//')
    ROLE_NAME="aws-elasticbeanstalk-ec2-role"
    
    echo -e "${YELLOW}Adjuntando política al rol: ${ROLE_NAME}${NC}"
    
    # Intentar adjuntar la política
    if aws iam attach-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-arn "${POLICY_ARN}" \
        2>/dev/null; then
        echo -e "${GREEN}✅ Política adjuntada al rol${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo adjuntar automáticamente.${NC}"
        echo -e "${YELLOW}   Adjunta manualmente la política ${POLICY_ARN} al rol ${ROLE_NAME}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No se pudo obtener el rol automáticamente.${NC}"
    echo -e "${YELLOW}   Adjunta manualmente la política ${POLICY_ARN} al rol aws-elasticbeanstalk-ec2-role${NC}"
fi

echo ""
echo -e "${BLUE}📦 Paso 6: Verificar Deployment${NC}"
echo ""

# Obtener URL del entorno
ENV_URL=$(eb status "${ENV_NAME}" --region "${REGION}" | grep "CNAME" | awk '{print $2}' || echo "")

if [ -n "$ENV_URL" ]; then
    FULL_URL="http://${ENV_URL}"
    echo -e "${GREEN}✅ Entorno desplegado${NC}"
    echo -e "${GREEN}   URL: ${FULL_URL}${NC}"
    
    # Actualizar Base URL si no se proporcionó
    if [ -z "$BASE_URL" ]; then
        BASE_URL="https://${ENV_URL}"
        echo -e "${YELLOW}Actualizando Base URL en Secrets Manager...${NC}"
        create_secret "${SECRET_PREFIX}/base-url" "${BASE_URL}" "Base URL de la API"
    fi
    
    echo ""
    echo -e "${YELLOW}⏳ Esperando a que la aplicación esté lista...${NC}"
    sleep 30
    
    # Verificar health
    echo -e "${YELLOW}Verificando health check...${NC}"
    eb health "${ENV_NAME}" --refresh
    
    echo ""
    echo -e "${GREEN}✅ Deployment completado!${NC}"
    echo ""
    echo -e "${BLUE}📋 Resumen:${NC}"
    echo -e "   Aplicación: ${APP_NAME}"
    echo -e "   Entorno: ${ENV_NAME}"
    echo -e "   URL: ${FULL_URL}"
    echo -e "   Swagger: ${FULL_URL}/api-docs"
    echo ""
    echo -e "${YELLOW}📝 Próximos pasos:${NC}"
    echo -e "   1. Verificar logs: eb logs"
    echo -e "   2. Abrir aplicación: eb open"
    echo -e "   3. Verificar que los secrets se cargan correctamente en los logs"
    echo ""
else
    echo -e "${RED}❌ No se pudo obtener la URL del entorno${NC}"
    echo -e "${YELLOW}   Verifica el estado con: eb status${NC}"
fi








