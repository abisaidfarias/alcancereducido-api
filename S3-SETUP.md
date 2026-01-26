# Configuración de Amazon S3 para Almacenamiento de Imágenes

Este documento explica cómo configurar Amazon S3 para almacenar las imágenes de la API (logos de distribuidores, logos de marcas, fotos de dispositivos).

## Prerrequisitos

1. **AWS CLI instalado y configurado**
   - Descarga: https://aws.amazon.com/cli/
   - Configuración: `aws configure`

2. **Credenciales de AWS con permisos para:**
   - Crear buckets S3
   - Configurar políticas de bucket
   - Configurar CORS

## Opción 1: Script Automatizado (Recomendado)

### Windows (PowerShell)
```powershell
.\scripts\setup-s3.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/setup-s3.sh
./scripts/setup-s3.sh
```

## Opción 2: Configuración Manual

### 1. Crear el Bucket S3

```bash
aws s3api create-bucket \
    --bucket alcancereducido-images \
    --region us-east-1
```

**Nota:** Si usas una región diferente a `us-east-1`, agrega:
```bash
aws s3api create-bucket \
    --bucket alcancereducido-images \
    --region us-east-1 \
    --create-bucket-configuration LocationConstraint=us-east-1
```

### 2. Configurar CORS

Crea un archivo `cors-config.json`:
```json
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
```

Aplica la configuración:
```bash
aws s3api put-bucket-cors \
    --bucket alcancereducido-images \
    --cors-configuration file://cors-config.json
```

### 3. Configurar Política de Bucket (Lectura Pública)

Crea un archivo `bucket-policy.json`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::alcancereducido-images/*"
        }
    ]
}
```

Aplica la política:
```bash
aws s3api put-bucket-policy \
    --bucket alcancereducido-images \
    --policy file://bucket-policy.json
```

### 4. Configurar Bloqueo de Acceso Público

```bash
aws s3api put-public-access-block \
    --bucket alcancereducido-images \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

## Configurar Variables de Entorno

### Local (.env)
```env
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=alcancereducido-images
```

### AWS Elastic Beanstalk

Agrega estas variables en la consola de Elastic Beanstalk o usando el CLI:

```bash
eb setenv AWS_ACCESS_KEY_ID=tu_access_key_id \
          AWS_SECRET_ACCESS_KEY=tu_secret_access_key \
          AWS_REGION=us-east-1 \
          S3_BUCKET_NAME=alcancereducido-images
```

### AWS Secrets Manager (Opcional)

Si prefieres usar Secrets Manager (más seguro):

1. Crear secret para credenciales S3:
```bash
aws secretsmanager create-secret \
    --name s3-credentials \
    --secret-string '{"accessKeyId":"tu_access_key_id","secretAccessKey":"tu_secret_access_key","region":"us-east-1","bucket":"alcancereducido-images"}'
```

2. Actualizar `src/config/secretsManager.js` para leer estos secrets.

## Estructura de Carpetas en S3

Las imágenes se organizan automáticamente en:
- `logos/` - Logos de distribuidores y marcas
- `fotos/` - Fotos de dispositivos
- `general/` - Otras imágenes

## Uso del Endpoint

### Subir una imagen
```bash
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: <archivo>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "url": "https://alcancereducido-images.s3.us-east-1.amazonaws.com/logos/uuid.jpg",
  "key": "logos/uuid.jpg",
  "size": 123456,
  "mimetype": "image/jpeg",
  "originalName": "logo.jpg"
}
```

### Subir múltiples imágenes
```bash
POST /api/upload/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- images: <archivo1>
- images: <archivo2>
- images: <archivo3>
```

## Límites

- **Tamaño máximo por archivo:** 5MB
- **Tipos permitidos:** JPEG, JPG, PNG, GIF, WEBP
- **Máximo de archivos (múltiples):** 10

## Costos Estimados

S3 Standard Storage (us-east-1):
- Primeros 50 TB: $0.023 por GB/mes
- Transferencia de datos saliente: Primeros 100 GB/mes gratis, luego $0.09 por GB

Para una aplicación pequeña/mediana:
- 10 GB de almacenamiento: ~$0.23/mes
- 50 GB de transferencia: ~$0/mes (dentro del tier gratuito)

**Total estimado: < $1/mes** para uso típico.

## Seguridad

- Las imágenes son **públicas para lectura** (necesario para mostrarlas en el frontend)
- Solo usuarios **autenticados como admin** pueden subir imágenes
- Los nombres de archivo son UUIDs únicos (no se pueden adivinar)
- Validación de tipos MIME y tamaño de archivo

## Troubleshooting

### Error: "Access Denied"
- Verifica que las credenciales de AWS sean correctas
- Verifica que el usuario IAM tenga permisos para S3

### Error: "Bucket already exists"
- El bucket ya existe, puedes usarlo o crear uno con otro nombre

### Error: "CORS policy not found"
- Ejecuta el script de configuración de CORS nuevamente

### Las imágenes no se muestran
- Verifica que la política de bucket permita lectura pública
- Verifica que el bloqueo de acceso público esté configurado correctamente
- Verifica la URL en el navegador directamente



