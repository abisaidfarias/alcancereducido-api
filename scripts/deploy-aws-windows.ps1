# Script completo para desplegar la API en AWS (Windows PowerShell)
# Uso: .\scripts\deploy-aws-windows.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Script de Deployment Completo para AWS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar prerrequisitos
Write-Host "📋 Verificando prerrequisitos..." -ForegroundColor Yellow

# Verificar AWS CLI
try {
    $null = aws --version
    Write-Host "✅ AWS CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "   Instala desde: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar autenticación AWS
Write-Host ""
Write-Host "🔐 Verificando autenticación AWS..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity | ConvertFrom-Json
    $awsAccount = $awsIdentity.Account
    $awsRegion = $env:AWS_REGION
    if (-not $awsRegion) { $awsRegion = "us-east-1" }
    
    Write-Host "✅ Autenticado en AWS" -ForegroundColor Green
    Write-Host "   Account ID: $awsAccount" -ForegroundColor Green
    Write-Host "   Región: $awsRegion" -ForegroundColor Green
} catch {
    Write-Host "❌ No estás autenticado en AWS" -ForegroundColor Red
    Write-Host "   Ejecuta: aws configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Obtener información del usuario
Write-Host "📝 Información necesaria:" -ForegroundColor Yellow
$appName = Read-Host "Nombre de la aplicación (default: alcancereducido-api)"
if ([string]::IsNullOrWhiteSpace($appName)) { $appName = "alcancereducido-api" }

$envName = Read-Host "Nombre del entorno (default: alcancereducido-prod)"
if ([string]::IsNullOrWhiteSpace($envName)) { $envName = "alcancereducido-prod" }

$region = Read-Host "Región AWS (default: $awsRegion)"
if ([string]::IsNullOrWhiteSpace($region)) { $region = $awsRegion }

$instanceType = Read-Host "Tipo de instancia (default: t3.micro)"
if ([string]::IsNullOrWhiteSpace($instanceType)) { $instanceType = "t3.micro" }

Write-Host ""
Write-Host "🔐 Configuración de Secrets:" -ForegroundColor Yellow
$mongoUri = Read-Host "MongoDB URI (mongodb+srv://...)" -AsSecureString
$mongoUriPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mongoUri)
)

$jwtSecretInput = Read-Host "JWT Secret (o presiona Enter para generar uno)" -AsSecureString
$jwtSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($jwtSecretInput)
)

if ([string]::IsNullOrWhiteSpace($jwtSecretPlain)) {
    # Generar JWT secret (simplificado, en producción usar mejor método)
    $jwtSecretPlain = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "✅ JWT Secret generado automáticamente" -ForegroundColor Green
}

$baseUrl = Read-Host "Base URL (default: se generará después)"
$jwtExpires = Read-Host "JWT Expires In (default: 24h)"
if ([string]::IsNullOrWhiteSpace($jwtExpires)) { $jwtExpires = "24h" }

$secretPrefix = "alcancereducido"

Write-Host ""
Write-Host "📦 Paso 1: Crear Secrets en AWS Secrets Manager" -ForegroundColor Cyan
Write-Host ""

# Función para crear secret
function Create-Secret {
    param($name, $value, $description)
    
    try {
        $existing = aws secretsmanager describe-secret --secret-id $name --region $region 2>$null
        if ($existing) {
            Write-Host "⚠️  Secret $name ya existe. Actualizando..." -ForegroundColor Yellow
            aws secretsmanager update-secret `
                --secret-id $name `
                --secret-string $value `
                --region $region `
                --description $description | Out-Null
            Write-Host "✅ Secret actualizado: $name" -ForegroundColor Green
        }
    } catch {
        aws secretsmanager create-secret `
            --name $name `
            --secret-string $value `
            --region $region `
            --description $description | Out-Null
        Write-Host "✅ Secret creado: $name" -ForegroundColor Green
    }
}

Create-Secret "$secretPrefix/jwt-secret" $jwtSecretPlain "JWT Secret key para autenticación"
Create-Secret "$secretPrefix/mongodb-uri" $mongoUriPlain "MongoDB Atlas connection string"
if (-not [string]::IsNullOrWhiteSpace($baseUrl)) {
    Create-Secret "$secretPrefix/base-url" $baseUrl "Base URL de la API"
}
Create-Secret "$secretPrefix/jwt-expires-in" $jwtExpires "Tiempo de expiración de JWT"

Write-Host ""
Write-Host "📦 Paso 2: Crear Política IAM para Secrets Manager" -ForegroundColor Cyan
Write-Host ""

$policyName = "AlcanceReducidoSecretsManagerPolicy"
$policyArn = "arn:aws:iam::${awsAccount}:policy/${policyName}"

try {
    $null = aws iam get-policy --policy-arn $policyArn 2>$null
    Write-Host "⚠️  Política $policyName ya existe" -ForegroundColor Yellow
} catch {
    aws iam create-policy `
        --policy-name $policyName `
        --policy-document file://secrets-policy.json `
        --description "Permite leer secrets de alcancereducido" | Out-Null
    Write-Host "✅ Política IAM creada: $policyName" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Paso 3: Inicializar Elastic Beanstalk" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".elasticbeanstalk\config.yml")) {
    Write-Host "Inicializando Elastic Beanstalk..." -ForegroundColor Yellow
    eb init $appName --platform "Node.js 18" --region $region
    Write-Host "✅ Elastic Beanstalk inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Elastic Beanstalk ya está inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Paso 4: Crear Entorno de Producción" -ForegroundColor Cyan
Write-Host ""

try {
    $null = eb status $envName 2>$null
    Write-Host "⚠️  El entorno $envName ya existe" -ForegroundColor Yellow
    $update = Read-Host "¿Deseas actualizarlo? (s/n)"
    if ($update -eq "s" -or $update -eq "S") {
        Write-Host "Actualizando entorno..." -ForegroundColor Yellow
        eb deploy $envName
    }
} catch {
    Write-Host "Creando entorno $envName..." -ForegroundColor Yellow
    eb create $envName `
        --instance-type $instanceType `
        --single `
        --region $region `
        --envvars "NODE_ENV=production,PORT=8080,AWS_REGION=$region,USE_AWS_SECRETS=true"
    
    Write-Host "✅ Entorno creado" -ForegroundColor Green
    Write-Host "⏳ Esperando a que el entorno esté listo (esto puede tomar 5-10 minutos)..." -ForegroundColor Yellow
    eb wait
}

Write-Host ""
Write-Host "✅ Deployment completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   Aplicación: $appName"
Write-Host "   Entorno: $envName"
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Verificar logs: eb logs"
Write-Host "   2. Abrir aplicación: eb open"
Write-Host "   3. Verificar que los secrets se cargan correctamente en los logs"









