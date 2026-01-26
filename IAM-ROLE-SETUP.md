# Configuración de Rol IAM para S3

Para que la aplicación pueda subir imágenes a S3 desde Elastic Beanstalk, necesitas configurar un rol IAM con permisos para S3.

## Opción 1: Configurar Rol IAM (Recomendado - Más Seguro)

### Paso 1: Crear Política IAM para S3

1. Ve a la consola de AWS IAM: https://console.aws.amazon.com/iam/
2. Click en "Policies" → "Create policy"
3. Click en "JSON" y pega la siguiente política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::alcancereducido-images/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::alcancereducido-images"
        }
    ]
}
```

4. Click en "Next" → Dale un nombre: `alcancereducido-s3-policy`
5. Click en "Create policy"

### Paso 2: Asignar Política al Rol de Elastic Beanstalk

1. Ve a la consola de Elastic Beanstalk: https://console.aws.amazon.com/elasticbeanstalk/
2. Selecciona tu entorno: `alcancereducido-prod`
3. Click en "Configuration" en el menú izquierdo
4. Busca "Security" y click en "Edit"
5. En "Service role" o "Instance profile", verifica que tenga un rol asignado
6. Si no tiene rol, crea uno:
   - Ve a IAM → Roles → Create role
   - Selecciona "AWS service" → "EC2"
   - Click en "Next"
   - Busca y selecciona la política `alcancereducido-s3-policy` que creaste
   - Dale un nombre: `alcancereducido-ec2-role`
   - Click en "Create role"
7. Vuelve a Elastic Beanstalk y asigna este rol a tu entorno

### Paso 3: Verificar

Una vez configurado el rol, la aplicación usará automáticamente las credenciales del rol IAM. **No necesitas configurar AWS_ACCESS_KEY_ID ni AWS_SECRET_ACCESS_KEY**.

## Opción 2: Usar Credenciales Directas (Menos Seguro)

Si prefieres usar credenciales directas (no recomendado para producción):

```bash
eb setenv AWS_ACCESS_KEY_ID=tu_access_key_id AWS_SECRET_ACCESS_KEY=tu_secret_access_key
```

**⚠️ Advertencia:** Esta opción es menos segura porque las credenciales se almacenan como variables de entorno.

## Verificación

Después de configurar el rol IAM o las credenciales, prueba subir una imagen:

```bash
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: image=<archivo>
```

Si todo está bien configurado, deberías recibir una respuesta con la URL de la imagen en S3.



