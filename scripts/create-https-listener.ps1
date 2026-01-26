# Script para crear el listener HTTPS una vez que el certificado esté validado
# Uso: .\scripts\create-https-listener.ps1

$ErrorActionPreference = "Continue"

# Certificado completo que incluye: alcance-reducido.com, www.alcance-reducido.com, api.alcance-reducido.com, *.alcance-reducido.com
# Obtener el certificado más reciente para alcance-reducido.com
$certArn = (aws acm list-certificates --region us-east-1 --output json | ConvertFrom-Json).CertificateSummaryList | Where-Object { $_.DomainName -eq "alcance-reducido.com" } | Sort-Object CreatedAt -Descending | Select-Object -First 1 -ExpandProperty CertificateArn
$albArn = "arn:aws:elasticloadbalancing:us-east-1:438758934896:loadbalancer/app/alb-alcancereducido-prod/c08fe9c162aa5c61"
$tgArn = "arn:aws:elasticloadbalancing:us-east-1:438758934896:targetgroup/tg-alcancereducido-prod/8e01276cb50bca66"
$region = "us-east-1"

Write-Host "Verificando estado del certificado..." -ForegroundColor Cyan

$certDetail = aws acm describe-certificate --certificate-arn $certArn --region $region --output json | ConvertFrom-Json
$status = $certDetail.Certificate.Status

Write-Host "Estado: $status" -ForegroundColor $(if ($status -eq "ISSUED") { "Green" } else { "Yellow" })

if ($status -ne "ISSUED") {
    Write-Host "El certificado aun no esta validado. Estado: $status" -ForegroundColor Red
    Write-Host "Espera unos minutos y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nVerificando si el listener HTTPS ya existe..." -ForegroundColor Cyan

$existingListeners = aws elbv2 describe-listeners --load-balancer-arn $albArn --region $region --output json | ConvertFrom-Json
$httpsListener = $existingListeners.Listeners | Where-Object { $_.Port -eq 443 } | Select-Object -First 1

if ($httpsListener) {
    Write-Host "Listener HTTPS ya existe: $($httpsListener.ListenerArn)" -ForegroundColor Green
    Write-Host "Actualizando certificado..." -ForegroundColor Cyan
    
    aws elbv2 modify-listener `
        --listener-arn $httpsListener.ListenerArn `
        --certificates "CertificateArn=$certArn" `
        --region $region | Out-Null
    
    Write-Host "Certificado actualizado en listener existente" -ForegroundColor Green
} else {
    Write-Host "Creando listener HTTPS..." -ForegroundColor Cyan
    
    $listenerResponse = aws elbv2 create-listener `
        --load-balancer-arn $albArn `
        --protocol HTTPS `
        --port 443 `
        --certificates "CertificateArn=$certArn" `
        --default-actions "Type=forward,TargetGroupArn=$tgArn" `
        --region $region `
        --output json | ConvertFrom-Json
    
    Write-Host "Listener HTTPS creado exitosamente!" -ForegroundColor Green
    Write-Host "ARN: $($listenerResponse.Listeners[0].ListenerArn)" -ForegroundColor Cyan
}

Write-Host "`n=== CONFIGURACION COMPLETA ===" -ForegroundColor Green
Write-Host "Tu API ahora esta disponible en:" -ForegroundColor Cyan
Write-Host "  https://api.alcance-reducido.com" -ForegroundColor Yellow
Write-Host "`nPuede tomar unos minutos para que el DNS se propague completamente." -ForegroundColor Yellow

