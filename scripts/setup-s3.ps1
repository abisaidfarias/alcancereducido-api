# Script para configurar S3 bucket para almacenar imágenes (PowerShell)
# Requiere AWS CLI configurado con credenciales

$ErrorActionPreference = "Continue"

$BUCKET_NAME = if ($env:S3_BUCKET_NAME) { $env:S3_BUCKET_NAME } else { "alcancereducido-images" }
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }

Write-Host "🚀 Configurando S3 bucket para almacenar imágenes..." -ForegroundColor Cyan
Write-Host "Bucket: $BUCKET_NAME"
Write-Host "Región: $AWS_REGION"
Write-Host ""

# Verificar que AWS CLI esté instalado
Write-Host "🔍 Verificando AWS CLI..." -ForegroundColor Cyan
$awsVersion = aws --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala AWS CLI: https://aws.amazon.com/cli/"
    exit 1
}
Write-Host "✅ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
Write-Host ""

# Verificar si el bucket existe
Write-Host "📦 Verificando bucket S3..." -ForegroundColor Cyan
$bucketCheck = aws s3 ls "s3://$BUCKET_NAME" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "ℹ️  El bucket ya existe: $BUCKET_NAME" -ForegroundColor Yellow
    $bucketExists = $true
} else {
    Write-Host "📦 El bucket no existe, creándolo..." -ForegroundColor Cyan
    $bucketExists = $false
}

# Crear bucket si no existe
if (-not $bucketExists) {
    if ($AWS_REGION -eq "us-east-1") {
        aws s3api create-bucket --bucket $BUCKET_NAME --region $AWS_REGION
    } else {
        $locationConstraint = @{LocationConstraint=$AWS_REGION} | ConvertTo-Json -Compress
        aws s3api create-bucket --bucket $BUCKET_NAME --region $AWS_REGION --create-bucket-configuration $locationConstraint
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Bucket creado: $BUCKET_NAME" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al crear el bucket" -ForegroundColor Red
        exit 1
    }
}

# Configurar CORS
Write-Host "🌐 Configurando CORS..." -ForegroundColor Cyan
$corsConfig = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "PUT", "POST", "DELETE", "HEAD")
            AllowedOrigins = @("*")
            ExposeHeaders = @("ETag")
            MaxAgeSeconds = 3000
        }
    )
} | ConvertTo-Json -Depth 10

$corsConfig | Out-File -FilePath "$env:TEMP\cors-config.json" -Encoding utf8
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration "file://$env:TEMP\cors-config.json"
Remove-Item "$env:TEMP\cors-config.json" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error al configurar CORS" -ForegroundColor Yellow
}

# Configurar política de bucket
Write-Host "🔓 Configurando política de bucket (lectura pública)..." -ForegroundColor Cyan
$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$BUCKET_NAME/*"
        }
    )
} | ConvertTo-Json -Depth 10

$bucketPolicy | Out-File -FilePath "$env:TEMP\bucket-policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "file://$env:TEMP\bucket-policy.json"
Remove-Item "$env:TEMP\bucket-policy.json" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Política de bucket configurada" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error al configurar política de bucket" -ForegroundColor Yellow
}

# Configurar bloqueo de acceso público
Write-Host "🔧 Configurando bloqueo de acceso público..." -ForegroundColor Cyan
aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration `
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bloqueo de acceso público configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se pudo configurar (puede que ya esté configurado)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅✅✅ Configuración de S3 completada ✅✅✅" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Variables de entorno necesarias:" -ForegroundColor Cyan
Write-Host "   AWS_ACCESS_KEY_ID=tu_access_key"
Write-Host "   AWS_SECRET_ACCESS_KEY=tu_secret_key"
Write-Host "   AWS_REGION=$AWS_REGION"
Write-Host "   S3_BUCKET_NAME=$BUCKET_NAME"
Write-Host ""
Write-Host "🔗 URL base de las imágenes:" -ForegroundColor Cyan
$imageUrl = 'https://' + $BUCKET_NAME + '.s3.' + $AWS_REGION + '.amazonaws.com/'
Write-Host "   $imageUrl"
