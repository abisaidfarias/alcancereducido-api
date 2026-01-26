#!/bin/bash
# Script para crear secrets en AWS Secrets Manager
# Uso: ./scripts/aws-secrets-setup.sh

echo "🔐 Configurando Secrets en AWS Secrets Manager..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado. Por favor instálalo primero.${NC}"
    exit 1
fi

# Verificar que está autenticado
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en AWS. Ejecuta 'aws configure' primero.${NC}"
    exit 1
fi

# Obtener región (por defecto us-east-1)
REGION=${AWS_REGION:-us-east-1}
SECRET_PREFIX="alcancereducido"

echo -e "${YELLOW}Región: ${REGION}${NC}"
echo -e "${YELLOW}Prefijo de secrets: ${SECRET_PREFIX}${NC}"
echo ""

# Función para crear o actualizar secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${YELLOW}📝 Procesando: ${secret_name}${NC}"
    
    # Verificar si el secret ya existe
    if aws secretsmanager describe-secret --secret-id "${secret_name}" --region "${REGION}" &> /dev/null; then
        echo -e "  ⚠️  Secret ya existe. ¿Actualizar? (s/n)"
        read -r response
        if [[ "$response" =~ ^[Ss]$ ]]; then
            aws secretsmanager update-secret \
                --secret-id "${secret_name}" \
                --secret-string "${secret_value}" \
                --region "${REGION}" \
                --description "${description}" \
                > /dev/null
            echo -e "  ${GREEN}✅ Secret actualizado${NC}"
        else
            echo -e "  ${YELLOW}⏭️  Saltado${NC}"
        fi
    else
        aws secretsmanager create-secret \
            --name "${secret_name}" \
            --secret-string "${secret_value}" \
            --region "${REGION}" \
            --description "${description}" \
            > /dev/null
        echo -e "  ${GREEN}✅ Secret creado${NC}"
    fi
}

# 1. JWT Secret
echo ""
echo -e "${YELLOW}1. JWT Secret${NC}"
read -sp "Ingresa el JWT_SECRET (o presiona Enter para generar uno aleatorio): " jwt_secret
echo ""

if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -base64 32)
    echo -e "${GREEN}✅ JWT Secret generado automáticamente${NC}"
fi

create_or_update_secret \
    "${SECRET_PREFIX}/jwt-secret" \
    "${jwt_secret}" \
    "JWT Secret key para autenticación de la API"

# 2. MongoDB URI
echo ""
echo -e "${YELLOW}2. MongoDB URI${NC}"
read -sp "Ingresa la MongoDB URI (mongodb+srv://...): " mongo_uri
echo ""

if [ -z "$mongo_uri" ]; then
    echo -e "${RED}❌ MongoDB URI es requerida${NC}"
    exit 1
fi

create_or_update_secret \
    "${SECRET_PREFIX}/mongodb-uri" \
    "${mongo_uri}" \
    "MongoDB Atlas connection string"

# 3. Base URL (opcional)
echo ""
echo -e "${YELLOW}3. Base URL${NC}"
read -p "Ingresa la BASE_URL (o presiona Enter para usar la de Elastic Beanstalk): " base_url
echo ""

if [ -z "$base_url" ]; then
    base_url="https://alcancereducido-prod.elasticbeanstalk.com"
    echo -e "${YELLOW}⚠️  Usando URL por defecto. Actualízala después en AWS Console.${NC}"
fi

create_or_update_secret \
    "${SECRET_PREFIX}/base-url" \
    "${base_url}" \
    "Base URL de la API para generación de QR codes"

# 4. JWT Expires In (opcional)
echo ""
echo -e "${YELLOW}4. JWT Expires In${NC}"
read -p "Ingresa el tiempo de expiración del JWT (default: 24h): " jwt_expires
jwt_expires=${jwt_expires:-24h}

create_or_update_secret \
    "${SECRET_PREFIX}/jwt-expires-in" \
    "${jwt_expires}" \
    "Tiempo de expiración de los tokens JWT"

echo ""
echo -e "${GREEN}✅ Todos los secrets han sido configurados${NC}"
echo ""
echo -e "${YELLOW}📋 Resumen de secrets creados:${NC}"
echo "  - ${SECRET_PREFIX}/jwt-secret"
echo "  - ${SECRET_PREFIX}/mongodb-uri"
echo "  - ${SECRET_PREFIX}/base-url"
echo "  - ${SECRET_PREFIX}/jwt-expires-in"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "  1. Asegúrate de que el rol de IAM de Elastic Beanstalk tenga permisos para leer estos secrets"
echo "  2. Actualiza las variables de entorno en Elastic Beanstalk para usar estos secrets"
echo "  3. Revisa el archivo 'secrets-manager-setup.md' para más detalles"
echo ""

