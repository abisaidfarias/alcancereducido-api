# Script para configurar el Listener HTTPS después de validar el certificado
# Uso: .\scripts\setup-https-listener.ps1 -CertArn <ARN> -ALBArn <ARN> -TGArn <ARN>

param(
    [Parameter(Mandatory=$true)]
    [string]$CertArn,
    
    [Parameter(Mandatory=$true)]
    [string]$ALBArn,
    
    [Parameter(Mandatory=$true)]
    [string]$TGArn,
    
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"

Write-Host "`n🔒 Configurando Listener HTTPS`n" -ForegroundColor Cyan

# Verificar estado del certificado
Write-Host "🔍 Verificando certificado..." -ForegroundColor Cyan
try {
    $certDetail = aws acm describe-certificate --certificate-arn $CertArn --region $Region --output json | ConvertFrom-Json
    
    if ($certDetail.Certificate.Status -ne "ISSUED") {
        Write-Host "❌ El certificado aún no está validado. Estado: $($certDetail.Certificate.Status)" -ForegroundColor Red
        Write-Host "   Por favor valida el certificado en AWS Certificate Manager primero." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Certificado validado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al verificar certificado: $_" -ForegroundColor Red
    exit 1
}

# Verificar si el listener HTTPS ya existe
Write-Host "`n🔍 Verificando listeners existentes..." -ForegroundColor Cyan
try {
    $existingListeners = aws elbv2 describe-listeners --load-balancer-arn $ALBArn --region $Region --output json | ConvertFrom-Json
    $httpsListener = $existingListeners.Listeners | Where-Object { $_.Port -eq 443 } | Select-Object -First 1
    
    if ($httpsListener) {
        Write-Host "⚠️  Listener HTTPS ya existe. Actualizando certificado..." -ForegroundColor Yellow
        
        # Actualizar certificado del listener existente
        aws elbv2 modify-listener `
            --listener-arn $httpsListener.ListenerArn `
            --certificates "CertificateArn=$CertArn" `
            --region $Region | Out-Null
        
        Write-Host "✅ Certificado actualizado en listener existente" -ForegroundColor Green
    } else {
        Write-Host "📝 Creando nuevo listener HTTPS..." -ForegroundColor Cyan
        
        $listenerResponse = aws elbv2 create-listener `
            --load-balancer-arn $ALBArn `
            --protocol HTTPS `
            --port 443 `
            --certificates "CertificateArn=$CertArn" `
            --default-actions "Type=forward,TargetGroupArn=$TGArn" `
            --region $Region `
            --output json | ConvertFrom-Json
        
        Write-Host "✅ Listener HTTPS creado: $($listenerResponse.Listeners[0].ListenerArn)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error al crear/actualizar listener: $_" -ForegroundColor Red
    exit 1
}

# Verificar listener HTTP para redirección
Write-Host "`n🔍 Verificando redirección HTTP -> HTTPS..." -ForegroundColor Cyan
try {
    $httpListener = $existingListeners.Listeners | Where-Object { $_.Port -eq 80 } | Select-Object -First 1
    
    if (-not $httpListener) {
        Write-Host "📝 Creando listener HTTP con redirección..." -ForegroundColor Cyan
        
        aws elbv2 create-listener `
            --load-balancer-arn $ALBArn `
            --protocol HTTP `
            --port 80 `
            --default-actions "Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" `
            --region $Region | Out-Null
        
        Write-Host "✅ Redirección HTTP -> HTTPS configurada" -ForegroundColor Green
    } else {
        Write-Host "✅ Listener HTTP ya existe" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error al configurar redirección: $_" -ForegroundColor Yellow
}

Write-Host "`n✅✅✅ Configuración completada ✅✅✅`n" -ForegroundColor Green







