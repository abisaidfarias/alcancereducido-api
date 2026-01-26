# Script para configurar HTTPS con Application Load Balancer (PowerShell)
# Requiere AWS CLI configurado con credenciales

$ErrorActionPreference = "Continue"

# Configuración
$DOMAIN = "alcance-reducido.com"
$SUBDOMAIN = "api.alcance-reducido.com"
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$EB_ENV_NAME = if ($env:EB_ENV_NAME) { $env:EB_ENV_NAME } else { "alcancereducido-prod" }

Write-Host "`n🔒 Configuración de HTTPS con Application Load Balancer`n" -ForegroundColor Cyan
Write-Host "Dominio: $DOMAIN" -ForegroundColor Yellow
Write-Host "Subdominio: $SUBDOMAIN" -ForegroundColor Yellow
Write-Host "Región: $AWS_REGION" -ForegroundColor Yellow
Write-Host "Entorno EB: $EB_ENV_NAME`n" -ForegroundColor Yellow

# Verificar AWS CLI
Write-Host "🔍 Verificando AWS CLI..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI no encontrado. Por favor instálalo primero." -ForegroundColor Red
    exit 1
}

# Verificar autenticación
Write-Host "`n🔍 Verificando autenticación AWS..." -ForegroundColor Cyan
try {
    $callerIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ Autenticado como: $($callerIdentity.Arn)" -ForegroundColor Green
    $ACCOUNT_ID = $callerIdentity.Account
} catch {
    Write-Host "❌ Error de autenticación. Configura tus credenciales con aws configure" -ForegroundColor Red
    exit 1
}

# Paso 1: Solicitar certificado SSL en ACM
Write-Host "`n📜 Paso 1: Solicitar certificado SSL en ACM..." -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANTE: Necesitas validar el certificado verificando el dominio en ACM." -ForegroundColor Yellow
Write-Host "   Esto puede tomar unos minutos después de crear el certificado.`n" -ForegroundColor Yellow

$certArn = $null
try {
    # Verificar si ya existe un certificado para el dominio
    $existingCerts = aws acm list-certificates --region $AWS_REGION --output json | ConvertFrom-Json
    
    $existingCert = $existingCerts.CertificateSummaryList | Where-Object { 
        $_.DomainName -eq $SUBDOMAIN -or $_.DomainName -eq "*.$DOMAIN" 
    } | Select-Object -First 1
    
    if ($existingCert) {
        Write-Host "✅ Certificado existente encontrado: $($existingCert.CertificateArn)" -ForegroundColor Green
        $certArn = $existingCert.CertificateArn
        
        # Verificar estado
        $certDetail = aws acm describe-certificate --certificate-arn $certArn --region $AWS_REGION --output json | ConvertFrom-Json
        if ($certDetail.Certificate.Status -ne "ISSUED") {
            Write-Host "⚠️  Certificado no está emitido aún. Estado: $($certDetail.Certificate.Status)" -ForegroundColor Yellow
            Write-Host "   Necesitas validar el dominio en AWS Certificate Manager." -ForegroundColor Yellow
        }
    } else {
        Write-Host "📝 Creando nuevo certificado para $SUBDOMAIN y *.$DOMAIN..." -ForegroundColor Cyan
        
        $certRequest = @{
            DomainName = $SUBDOMAIN
            SubjectAlternativeNames = @("*.$DOMAIN")
            ValidationMethod = "DNS"
            DomainValidationOptions = @(
                @{
                    DomainName = $SUBDOMAIN
                    ValidationDomain = $DOMAIN
                },
                @{
                    DomainName = "*.$DOMAIN"
                    ValidationDomain = $DOMAIN
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $certRequest | Out-File -FilePath "$env:TEMP\cert-request.json" -Encoding utf8
        
        $certResponse = aws acm request-certificate `
            --region $AWS_REGION `
            --domain-name $SUBDOMAIN `
            --subject-alternative-names "*.$DOMAIN" `
            --validation-method DNS `
            --output json | ConvertFrom-Json
        
        $certArn = $certResponse.CertificateArn
        Write-Host "✅ Certificado solicitado: $certArn" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Debes validar el certificado en ACM antes de continuar." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al crear/solicitar certificado: $_" -ForegroundColor Red
    exit 1
}

# Paso 2: Obtener información del entorno de Elastic Beanstalk
Write-Host "`n📦 Paso 2: Obteniendo información del entorno Elastic Beanstalk..." -ForegroundColor Cyan
try {
    $ebEnv = aws elasticbeanstalk describe-environments `
        --environment-names $EB_ENV_NAME `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    
    if (-not $ebEnv.Environments -or $ebEnv.Environments.Count -eq 0) {
        Write-Host "❌ Entorno $EB_ENV_NAME no encontrado" -ForegroundColor Red
        exit 1
    }
    
    $envId = $ebEnv.Environments[0].EnvironmentId
    $envName = $ebEnv.Environments[0].EnvironmentName
    $vpcId = $ebEnv.Environments[0].VPCId
    
    Write-Host "✅ Entorno encontrado: $envName (ID: $envId)" -ForegroundColor Green
    
    # Obtener subnets y security groups
    $envResources = aws elasticbeanstalk describe-environment-resources `
        --environment-id $envId `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    
    $subnets = @()
    $securityGroups = @()
    
    foreach ($resource in $envResources.EnvironmentResources.Resources) {
        if ($resource.Type -eq "AWS::EC2::Subnet") {
            $subnets += $resource.PhysicalResourceId
        }
        if ($resource.Type -eq "AWS::EC2::SecurityGroup") {
            $securityGroups += $resource.PhysicalResourceId
        }
    }
    
    Write-Host "✅ Subnets encontradas: $($subnets.Count)" -ForegroundColor Green
    Write-Host "✅ Security Groups encontrados: $($securityGroups.Count)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error al obtener información del entorno: $_" -ForegroundColor Red
    exit 1
}

# Paso 3: Crear Application Load Balancer
Write-Host "`n⚖️  Paso 3: Creando Application Load Balancer..." -ForegroundColor Cyan

$albName = "alb-$envName"
$targetGroupName = "tg-$envName"

try {
    # Verificar si el ALB ya existe
    $existingALBs = aws elbv2 describe-load-balancers --region $AWS_REGION --output json | ConvertFrom-Json
    $existingALB = $existingALBs.LoadBalancers | Where-Object { $_.LoadBalancerName -eq $albName } | Select-Object -First 1
    
    if ($existingALB) {
        Write-Host "✅ ALB ya existe: $($existingALB.LoadBalancerArn)" -ForegroundColor Green
        $albArn = $existingALB.LoadBalancerArn
        $albDns = $existingALB.DNSName
    } else {
        Write-Host "📝 Creando nuevo ALB: $albName..." -ForegroundColor Cyan
        
        # Crear ALB
        $albResponse = aws elbv2 create-load-balancer `
            --name $albName `
            --subnets $subnets `
            --security-groups $securityGroups `
            --scheme internet-facing `
            --type application `
            --ip-address-type ipv4 `
            --region $AWS_REGION `
            --output json | ConvertFrom-Json
        
        $albArn = $albResponse.LoadBalancers[0].LoadBalancerArn
        $albDns = $albResponse.LoadBalancers[0].DNSName
        
        Write-Host "✅ ALB creado: $albArn" -ForegroundColor Green
        Write-Host "   DNS: $albDns" -ForegroundColor Cyan
    }
    
    # Crear Target Group
    Write-Host "`n📝 Creando Target Group..." -ForegroundColor Cyan
    
    $existingTGs = aws elbv2 describe-target-groups --region $AWS_REGION --output json | ConvertFrom-Json
    $existingTG = $existingTGs.TargetGroups | Where-Object { $_.TargetGroupName -eq $targetGroupName } | Select-Object -First 1
    
    if ($existingTG) {
        Write-Host "✅ Target Group ya existe: $($existingTG.TargetGroupArn)" -ForegroundColor Green
        $tgArn = $existingTG.TargetGroupArn
    } else {
        # Obtener VPC ID de las subnets
        $subnetInfo = aws ec2 describe-subnets --subnet-ids $subnets[0] --region $AWS_REGION --output json | ConvertFrom-Json
        $vpcId = $subnetInfo.Subnets[0].VpcId
        
        $tgResponse = aws elbv2 create-target-group `
            --name $targetGroupName `
            --protocol HTTP `
            --port 8080 `
            --vpc-id $vpcId `
            --target-type instance `
            --health-check-path "/" `
            --health-check-interval-seconds 30 `
            --health-check-timeout-seconds 5 `
            --healthy-threshold-count 2 `
            --unhealthy-threshold-count 3 `
            --region $AWS_REGION `
            --output json | ConvertFrom-Json
        
        $tgArn = $tgResponse.TargetGroups[0].TargetGroupArn
        Write-Host "✅ Target Group creado: $tgArn" -ForegroundColor Green
    }
    
    # Registrar instancias del entorno EB en el Target Group
    Write-Host "`n📝 Registrando instancias en Target Group..." -ForegroundColor Cyan
    
    $instances = aws ec2 describe-instances `
        --filters "Name=tag:elasticbeanstalk:environment-name,Values=$envName" "Name=instance-state-name,Values=running" `
        --region $AWS_REGION `
        --output json | ConvertFrom-Json
    
    $instanceIds = @()
    foreach ($reservation in $instances.Reservations) {
        foreach ($instance in $reservation.Instances) {
            $instanceIds += $instance.InstanceId
        }
    }
    
    if ($instanceIds.Count -gt 0) {
        $instanceIdsString = $instanceIds -join " "
        aws elbv2 register-targets `
            --target-group-arn $tgArn `
            --targets ($instanceIds | ForEach-Object { "Id=$_" }) `
            --region $AWS_REGION | Out-Null
        
        Write-Host "✅ $($instanceIds.Count) instancia(s) registrada(s)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se encontraron instancias corriendo" -ForegroundColor Yellow
    }
    
    # Crear Listener HTTPS
    Write-Host "`n📝 Configurando Listener HTTPS..." -ForegroundColor Cyan
    
    $existingListeners = aws elbv2 describe-listeners --load-balancer-arn $albArn --region $AWS_REGION --output json | ConvertFrom-Json
    $httpsListener = $existingListeners.Listeners | Where-Object { $_.Port -eq 443 } | Select-Object -First 1
    
    if ($httpsListener) {
        Write-Host "✅ Listener HTTPS ya existe" -ForegroundColor Green
    } else {
        # Esperar a que el certificado esté validado
        Write-Host "⏳ Verificando estado del certificado..." -ForegroundColor Yellow
        $certDetail = aws acm describe-certificate --certificate-arn $certArn --region $AWS_REGION --output json | ConvertFrom-Json
        
        if ($certDetail.Certificate.Status -ne "ISSUED") {
            Write-Host "⚠️  El certificado aún no está validado. Estado: $($certDetail.Certificate.Status)" -ForegroundColor Yellow
            Write-Host "   Debes validar el certificado en ACM antes de crear el listener HTTPS." -ForegroundColor Yellow
            Write-Host "   Puedes continuar después de validar el certificado ejecutando:" -ForegroundColor Cyan
            Write-Host "   .\scripts\setup-https-listener.ps1 -CertArn $certArn -ALBArn $albArn -TGArn $tgArn" -ForegroundColor Cyan
        } else {
            $listenerResponse = aws elbv2 create-listener `
                --load-balancer-arn $albArn `
                --protocol HTTPS `
                --port 443 `
                --certificates "CertificateArn=$certArn" `
                --default-actions "Type=forward,TargetGroupArn=$tgArn" `
                --region $AWS_REGION `
                --output json | ConvertFrom-Json
            
            Write-Host "✅ Listener HTTPS creado" -ForegroundColor Green
        }
    }
    
    # Crear Listener HTTP que redirige a HTTPS
    Write-Host "`n📝 Configurando redirección HTTP -> HTTPS..." -ForegroundColor Cyan
    
    $httpListener = $existingListeners.Listeners | Where-Object { $_.Port -eq 80 } | Select-Object -First 1
    
    if ($httpListener) {
        Write-Host "✅ Listener HTTP ya existe" -ForegroundColor Green
    } else {
        $redirectConfig = @{
            Type = "redirect"
            RedirectConfig = @{
                Protocol = "HTTPS"
                Port = "443"
                StatusCode = "HTTP_301"
            }
        } | ConvertTo-Json -Depth 10
        
        $redirectConfig | Out-File -FilePath "$env:TEMP\redirect-config.json" -Encoding utf8
        
        aws elbv2 create-listener `
            --load-balancer-arn $albArn `
            --protocol HTTP `
            --port 80 `
            --default-actions "Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" `
            --region $AWS_REGION | Out-Null
        
        Write-Host "✅ Redirección HTTP -> HTTPS configurada" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error al crear/configurar ALB: $_" -ForegroundColor Red
    exit 1
}

# Paso 4: Configurar Route 53 (si el dominio está en Route 53)
Write-Host "`n🌐 Paso 4: Configurando Route 53..." -ForegroundColor Cyan

try {
    $hostedZones = aws route53 list-hosted-zones --output json | ConvertFrom-Json
    $hostedZone = $hostedZones.HostedZones | Where-Object { $_.Name -eq "$DOMAIN." } | Select-Object -First 1
    
    if ($hostedZone) {
        Write-Host "✅ Hosted Zone encontrada: $($hostedZone.Id)" -ForegroundColor Green
        
        # Crear o actualizar registro A
        $recordName = $SUBDOMAIN
        
        $changeBatch = @{
            Changes = @(
                @{
                    Action = "UPSERT"
                    ResourceRecordSet = @{
                        Name = $recordName
                        Type = "A"
                        AliasTarget = @{
                            HostedZoneId = "Z35SXDOTRQ7X7K"  # Zona ALB us-east-1
                            DNSName = $albDns
                            EvaluateTargetHealth = $true
                    }
                }
            }
        )
        } | ConvertTo-Json -Depth 10
        
        $changeBatch | Out-File -FilePath "$env:TEMP\route53-change.json" -Encoding utf8
        
        aws route53 change-resource-record-sets `
            --hosted-zone-id $hostedZone.Id `
            --change-batch "file://$env:TEMP\route53-change.json" `
            --output json | Out-Null
        
        Write-Host "✅ Registro A creado/actualizado para $recordName" -ForegroundColor Green
        Write-Host "   Apunta a: $albDns" -ForegroundColor Cyan
        
        Remove-Item "$env:TEMP\route53-change.json" -ErrorAction SilentlyContinue
    } else {
        Write-Host "⚠️  Hosted Zone no encontrada para $DOMAIN" -ForegroundColor Yellow
        Write-Host "   Si el dominio está en otro proveedor, configura manualmente:" -ForegroundColor Yellow
        Write-Host "   Tipo: A (Alias)" -ForegroundColor Cyan
        Write-Host "   Nombre: $SUBDOMAIN" -ForegroundColor Cyan
        Write-Host "   Valor: $albDns" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Error al configurar Route 53: $_" -ForegroundColor Yellow
    Write-Host "   Puedes configurar el DNS manualmente apuntando $SUBDOMAIN a $albDns" -ForegroundColor Yellow
}

# Resumen
Write-Host "`n✅✅✅ Configuración completada ✅✅✅`n" -ForegroundColor Green
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   ALB DNS: $albDns" -ForegroundColor Yellow
Write-Host "   Certificado: $certArn" -ForegroundColor Yellow
Write-Host "   Target Group: $tgArn" -ForegroundColor Yellow
Write-Host "`n⚠️  Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Valida el certificado SSL en AWS Certificate Manager" -ForegroundColor Cyan
Write-Host "   2. Si el dominio no está en Route 53, configura el DNS manualmente" -ForegroundColor Cyan
Write-Host "   3. Espera a que el DNS se propague (puede tomar hasta 48 horas)" -ForegroundColor Cyan
Write-Host "   4. Prueba accediendo a https://$SUBDOMAIN" -ForegroundColor Cyan
Write-Host "`n"

