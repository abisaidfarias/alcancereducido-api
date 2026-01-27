#!/bin/bash

# Script para configurar S3 bucket para almacenar imágenes
# Requiere AWS CLI configurado con credenciales

set -e

BUCKET_NAME="${S3_BUCKET_NAME:-alcancereducido-images}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Configurando S3 bucket para almacenar imágenes..."
echo "Bucket: $BUCKET_NAME"
echo "Región: $AWS_REGION"
echo ""

# Verificar que AWS CLI esté instalado
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI no está instalado"
    echo "Instala AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Crear bucket
echo "📦 Creando bucket S3..."
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    if [ "$AWS_REGION" == "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION" --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    echo "✅ Bucket creado: $BUCKET_NAME"
else
    echo "ℹ️  El bucket ya existe: $BUCKET_NAME"
fi

# Configurar CORS para permitir acceso desde cualquier origen
echo "🌐 Configurando CORS..."
cat > /tmp/cors-config.json <<EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/cors-config.json
rm /tmp/cors-config.json
echo "✅ CORS configurado"

# Configurar política de bucket para acceso público de lectura
echo "🔓 Configurando política de bucket (lectura pública)..."
cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json
echo "✅ Política de bucket configurada"

# Deshabilitar bloqueo de acceso público (solo bloqueo de escritura)
echo "🔧 Configurando bloqueo de acceso público..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>/dev/null || echo "⚠️  No se pudo configurar (puede que ya esté configurado)"

echo ""
echo "✅✅✅ Configuración de S3 completada ✅✅✅"
echo ""
echo "📝 Variables de entorno necesarias:"
echo "   AWS_ACCESS_KEY_ID=tu_access_key"
echo "   AWS_SECRET_ACCESS_KEY=tu_secret_key"
echo "   AWS_REGION=$AWS_REGION"
echo "   S3_BUCKET_NAME=$BUCKET_NAME"
echo ""
echo "🔗 URL base de las imágenes:"
echo "   https://$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com/"








