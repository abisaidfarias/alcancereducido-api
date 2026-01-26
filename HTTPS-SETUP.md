# 🔒 Guía de Configuración HTTPS con Application Load Balancer

Esta guía te ayudará a configurar HTTPS para tu API usando un Application Load Balancer (ALB) en AWS con el dominio `api.alcance-reducido.com`.

## 📋 Prerrequisitos

1. ✅ Dominio `alcance-reducido.com` registrado
2. ✅ AWS CLI configurado con credenciales
3. ✅ Entorno de Elastic Beanstalk desplegado y funcionando
4. ✅ Acceso a la consola de AWS (para validar certificado SSL)

## 🏗️ Arquitectura

```
Internet
   ↓
Route 53 (DNS)
   ↓
Application Load Balancer (ALB)
   ├─ Listener HTTP (80) → Redirige a HTTPS
   └─ Listener HTTPS (443) → Certificado SSL
         ↓
   Target Group
         ↓
   Instancias EC2 (Elastic Beanstalk)
```

## 🚀 Configuración Automatizada

### Opción 1: Script PowerShell (Windows)

```powershell
# Ejecutar script de configuración
.\scripts\setup-https-alb.ps1
```

El script:
1. ✅ Solicita certificado SSL en AWS Certificate Manager (ACM)
2. ✅ Crea Application Load Balancer
3. ✅ Configura Target Group
4. ✅ Configura Listeners (HTTP → HTTPS redirect, HTTPS)
5. ✅ Configura Route 53 (si el dominio está en Route 53)

### Opción 2: Configuración Manual

Si prefieres hacerlo manualmente, sigue estos pasos:

## 📝 Pasos Detallados

### Paso 1: Solicitar Certificado SSL

1. Ve a **AWS Certificate Manager (ACM)** en la consola de AWS
2. Selecciona la región `us-east-1` (requerido para ALB)
3. Click en **"Request a certificate"**
4. Selecciona **"Request a public certificate"**
5. Ingresa:
   - **Domain name**: `api.alcance-reducido.com`
   - **Subject alternative names (SAN)**: `*.alcance-reducido.com`
6. Selecciona **"DNS validation"**
7. Click en **"Request"**

### Paso 2: Validar Certificado

1. En la lista de certificados, selecciona el que acabas de crear
2. En la sección **"Domains"**, verás registros CNAME que debes agregar a tu DNS
3. **Si el dominio está en Route 53:**
   - Click en **"Create record in Route 53"** (automático)
4. **Si el dominio está en otro proveedor:**
   - Copia los registros CNAME
   - Agrégalos manualmente en tu proveedor de DNS
   - Espera a que se valide (puede tomar unos minutos)

### Paso 3: Crear Application Load Balancer

1. Ve a **EC2 → Load Balancers**
2. Click en **"Create Load Balancer"**
3. Selecciona **"Application Load Balancer"**
4. Configura:
   - **Name**: `alb-alcancereducido-prod`
   - **Scheme**: `Internet-facing`
   - **IP address type**: `IPv4`
   - **VPC**: Selecciona la VPC de tu entorno EB
   - **Availability Zones**: Selecciona al menos 2 zonas
   - **Security groups**: Selecciona el security group de tu entorno EB

### Paso 4: Configurar Security Group del ALB

Asegúrate de que el Security Group del ALB permita:
- **Inbound**: Puerto 80 (HTTP) desde `0.0.0.0/0`
- **Inbound**: Puerto 443 (HTTPS) desde `0.0.0.0/0`
- **Outbound**: Todo el tráfico

### Paso 5: Crear Target Group

1. Ve a **EC2 → Target Groups**
2. Click en **"Create target group"**
3. Configura:
   - **Target type**: `Instances`
   - **Name**: `tg-alcancereducido-prod`
   - **Protocol**: `HTTP`
   - **Port**: `8080` (puerto de tu aplicación)
   - **VPC**: Misma VPC del ALB
   - **Health check path**: `/`
   - **Health check interval**: `30 seconds`
   - **Healthy threshold**: `2`
   - **Unhealthy threshold**: `3`

4. Click en **"Next"**
5. Registra las instancias de tu entorno EB
6. Click en **"Create target group"**

### Paso 6: Configurar Listeners del ALB

#### Listener HTTPS (443)

1. En el ALB, ve a la pestaña **"Listeners"**
2. Click en **"Add listener"**
3. Configura:
   - **Protocol**: `HTTPS`
   - **Port**: `443`
   - **Default action**: `Forward to` → Selecciona tu Target Group
   - **Default SSL certificate**: Selecciona el certificado que creaste
4. Click en **"Add"**

#### Listener HTTP (80) - Redirección

1. Click en **"Add listener"** nuevamente
2. Configura:
   - **Protocol**: `HTTP`
   - **Port**: `80`
   - **Default action**: `Redirect to`
   - **Protocol**: `HTTPS`
   - **Port**: `443`
   - **Status code**: `301 - Permanently moved`
3. Click en **"Add"**

### Paso 7: Configurar DNS (Route 53)

**Si el dominio está en Route 53:**

1. Ve a **Route 53 → Hosted zones**
2. Selecciona la zona de `alcance-reducido.com`
3. Click en **"Create record"**
4. Configura:
   - **Record name**: `api`
   - **Record type**: `A - Routes traffic to an IPv4 address and some AWS resources`
   - **Alias**: `Yes`
   - **Route traffic to**: `Alias to Application and Classic Load Balancer`
   - **Region**: `us-east-1`
   - **Load balancer**: Selecciona tu ALB
   - **Evaluate target health**: `Yes`
5. Click en **"Create records"**

**Si el dominio está en otro proveedor:**

1. Crea un registro **A (Alias)** o **CNAME**
2. **Nombre**: `api`
3. **Valor**: DNS name del ALB (ej: `alb-alcancereducido-prod-123456789.us-east-1.elb.amazonaws.com`)

### Paso 8: Actualizar Elastic Beanstalk (Opcional)

Si quieres que Elastic Beanstalk use el ALB directamente:

1. Ve a **Elastic Beanstalk → Environments**
2. Selecciona tu entorno
3. Click en **"Configuration"**
4. En **"Load balancer"**, click en **"Edit"**
5. Selecciona **"Application Load Balancer"**
6. Configura los listeners y target groups
7. Click en **"Apply"**

## 🔍 Verificación

### 1. Verificar Certificado

```bash
# Ver estado del certificado
aws acm list-certificates --region us-east-1

# Ver detalles
aws acm describe-certificate \
  --certificate-arn <ARN_DEL_CERTIFICADO> \
  --region us-east-1
```

### 2. Verificar ALB

```bash
# Listar ALBs
aws elbv2 describe-load-balancers --region us-east-1

# Ver listeners
aws elbv2 describe-listeners \
  --load-balancer-arn <ARN_DEL_ALB> \
  --region us-east-1
```

### 3. Verificar Target Group

```bash
# Ver target groups
aws elbv2 describe-target-groups --region us-east-1

# Ver targets registrados
aws elbv2 describe-target-health \
  --target-group-arn <ARN_DEL_TARGET_GROUP> \
  --region us-east-1
```

### 4. Probar Endpoints

```bash
# Probar HTTP (debe redirigir a HTTPS)
curl -I http://api.alcance-reducido.com

# Probar HTTPS
curl -I https://api.alcance-reducido.com

# Probar endpoint de la API
curl https://api.alcance-reducido.com/
```

## ⚙️ Configuración de la Aplicación

### Actualizar BASE_URL

Actualiza la variable de entorno `BASE_URL` en Elastic Beanstalk:

```bash
eb setenv BASE_URL=https://api.alcance-reducido.com
```

O desde la consola de AWS:
1. Elastic Beanstalk → Environment → Configuration → Software
2. Agrega/modifica: `BASE_URL` = `https://api.alcance-reducido.com`

### Actualizar Swagger

El Swagger UI usará automáticamente la nueva URL si `BASE_URL` está configurado correctamente.

## 🆘 Troubleshooting

### Error: "Certificate not found"

**Solución:**
- Asegúrate de que el certificado esté en la región `us-east-1`
- Verifica que el certificado esté en estado `ISSUED`

### Error: "DNS not resolving"

**Solución:**
- Verifica que el registro DNS esté configurado correctamente
- Espera a que se propague (puede tomar hasta 48 horas)
- Usa `dig api.alcance-reducido.com` o `nslookup api.alcance-reducido.com` para verificar

### Error: "502 Bad Gateway"

**Solución:**
- Verifica que las instancias estén registradas en el Target Group
- Verifica que el health check esté pasando
- Verifica que el puerto de la aplicación sea `8080`
- Revisa los logs de la aplicación

### Error: "SSL Certificate Error"

**Solución:**
- Verifica que el certificado esté validado
- Verifica que el dominio del certificado coincida con el dominio usado
- Asegúrate de que el certificado esté asociado al listener HTTPS

## 📊 Costos Estimados

- **Application Load Balancer**: ~$0.0225 por hora (~$16.20/mes)
- **Data Transfer**: $0.01 por GB (primeros 10 TB)
- **Certificate**: **GRATIS** (AWS Certificate Manager)
- **Route 53**: $0.50 por hosted zone/mes + $0.40 por millón de queries

**Total estimado**: ~$17-20/mes (sin incluir instancias EC2)

## ✅ Checklist

- [ ] Certificado SSL solicitado y validado en ACM
- [ ] Application Load Balancer creado
- [ ] Target Group creado y configurado
- [ ] Instancias registradas en Target Group
- [ ] Listener HTTPS (443) configurado con certificado
- [ ] Listener HTTP (80) configurado para redirigir a HTTPS
- [ ] DNS configurado (Route 53 o proveedor externo)
- [ ] Health checks pasando
- [ ] BASE_URL actualizado en Elastic Beanstalk
- [ ] Pruebas de endpoints funcionando
- [ ] Redirección HTTP → HTTPS funcionando

## 📚 Referencias

- [AWS Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)


