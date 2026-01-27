#!/bin/bash
# Script para leer secrets de AWS Secrets Manager (útil para debugging)
# Uso: ./scripts/aws-secrets-read.sh [secret-name]

REGION=${AWS_REGION:-us-east-1}
SECRET_PREFIX="alcancereducido"

if [ -z "$1" ]; then
    echo "📋 Listando todos los secrets de ${SECRET_PREFIX}..."
    echo ""
    aws secretsmanager list-secrets \
        --region "${REGION}" \
        --filters Key=name,Values="${SECRET_PREFIX}/" \
        --query 'SecretList[*].[Name,Description]' \
        --output table
else
    SECRET_NAME=$1
    echo "🔍 Leyendo secret: ${SECRET_NAME}"
    echo ""
    
    # Obtener el valor del secret (sin mostrar el valor completo por seguridad)
    aws secretsmanager get-secret-value \
        --secret-id "${SECRET_NAME}" \
        --region "${REGION}" \
        --query 'SecretString' \
        --output text | head -c 50
    echo "..."
    echo ""
    echo "✅ Secret existe y es accesible"
fi








