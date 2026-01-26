# Documentación API - Endpoint de Upload de Imágenes

## Información General

**URL Base de Producción:**
```
http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com
```

**URL Base de Desarrollo (local):**
```
http://localhost:3000
```

---

## Endpoint 1: Subir una Imagen

### Información del Endpoint

- **URL:** `POST /api/upload`
- **URL Completa (Producción):** `http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload`
- **Autenticación:** Requerida (Bearer Token)
- **Permisos:** Solo usuarios con rol `admin`
- **Content-Type:** `multipart/form-data`

### Headers Requeridos

```http
Authorization: Bearer <tu_token_jwt>
Content-Type: multipart/form-data
```

### Body (Form Data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image` | File | ✅ Sí | Archivo de imagen a subir |

### Validaciones

- **Tipos de archivo permitidos:**
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/gif`
  - `image/webp`

- **Tamaño máximo:** 5MB por archivo

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "url": "https://alcancereducido-images.s3.us-east-1.amazonaws.com/logos/123e4567-e89b-12d3-a456-426614174000.jpg",
  "key": "logos/123e4567-e89b-12d3-a456-426614174000.jpg",
  "size": 123456,
  "mimetype": "image/jpeg",
  "originalName": "logo.jpg"
}
```

### Respuestas de Error

#### 400 Bad Request - Archivo no proporcionado
```json
{
  "success": false,
  "error": "No se proporcionó ningún archivo",
  "message": "Debes enviar un archivo de imagen en el campo \"image\""
}
```

#### 400 Bad Request - Archivo demasiado grande
```json
{
  "error": "Archivo demasiado grande",
  "message": "El tamaño máximo permitido es 5MB"
}
```

#### 400 Bad Request - Tipo de archivo no permitido
```json
{
  "error": "Error al procesar archivo",
  "message": "Tipo de archivo no permitido. Solo se permiten: image/jpeg, image/jpg, image/png, image/gif, image/webp"
}
```

#### 401 Unauthorized - Token inválido o faltante
```json
{
  "error": "Token no proporcionado o inválido"
}
```

#### 403 Forbidden - Sin permisos de admin
```json
{
  "error": "Acceso denegado",
  "message": "Solo los administradores pueden subir imágenes"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error al subir imagen",
  "message": "Mensaje de error detallado"
}
```

---

## Endpoint 2: Subir Múltiples Imágenes

### Información del Endpoint

- **URL:** `POST /api/upload/multiple`
- **URL Completa (Producción):** `http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload/multiple`
- **Autenticación:** Requerida (Bearer Token)
- **Permisos:** Solo usuarios con rol `admin`
- **Content-Type:** `multipart/form-data`

### Headers Requeridos

```http
Authorization: Bearer <tu_token_jwt>
Content-Type: multipart/form-data
```

### Body (Form Data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `images` | File[] | ✅ Sí | Array de archivos de imagen (máximo 10) |

### Validaciones

- **Tipos de archivo permitidos:** Mismos que el endpoint individual
- **Tamaño máximo:** 5MB por archivo
- **Cantidad máxima:** 10 archivos por solicitud

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "3 imagen(es) subida(s) exitosamente",
  "images": [
    {
      "url": "https://alcancereducido-images.s3.us-east-1.amazonaws.com/logos/uuid1.jpg",
      "key": "logos/uuid1.jpg",
      "size": 123456,
      "mimetype": "image/jpeg",
      "originalName": "logo1.jpg"
    },
    {
      "url": "https://alcancereducido-images.s3.us-east-1.amazonaws.com/fotos/uuid2.png",
      "key": "fotos/uuid2.png",
      "size": 234567,
      "mimetype": "image/png",
      "originalName": "foto2.png"
    },
    {
      "url": "https://alcancereducido-images.s3.us-east-1.amazonaws.com/general/uuid3.gif",
      "key": "general/uuid3.gif",
      "size": 345678,
      "mimetype": "image/gif",
      "originalName": "imagen3.gif"
    }
  ]
}
```

### Respuestas de Error

Mismas que el endpoint individual, más:

#### 400 Bad Request - No se proporcionaron archivos
```json
{
  "success": false,
  "error": "No se proporcionaron archivos",
  "message": "Debes enviar al menos un archivo de imagen en el campo \"images\""
}
```

---

## Ejemplos de Código

### JavaScript/Fetch - Subir una imagen

```javascript
async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(
      'http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO incluyas Content-Type, el navegador lo hará automáticamente con el boundary
        },
        body: formData
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('Imagen subida:', data.url);
      return data;
    } else {
      console.error('Error:', data);
      throw new Error(data.message || 'Error al subir imagen');
    }
  } catch (error) {
    console.error('Error de red:', error);
    throw error;
  }
}

// Uso
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const token = 'tu_token_jwt_aqui';

uploadImage(file, token)
  .then(result => {
    console.log('URL de la imagen:', result.url);
    // Usa result.url para guardar en tu base de datos
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Axios - Subir una imagen

```javascript
import axios from 'axios';

async function uploadImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(
      'http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Error del servidor:', error.response.data);
      throw new Error(error.response.data.message || 'Error al subir imagen');
    } else {
      // Error de red
      console.error('Error de red:', error.message);
      throw error;
    }
  }
}

// Uso
const file = document.querySelector('input[type="file"]').files[0];
const token = 'tu_token_jwt_aqui';

uploadImage(file, token)
  .then(result => {
    console.log('URL de la imagen:', result.url);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### React - Hook personalizado

```javascript
import { useState } from 'react';
import axios from 'axios';

function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (file, token) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        'http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploading(false);
      return response.data;
    } catch (err) {
      setUploading(false);
      const errorMessage = err.response?.data?.message || 'Error al subir imagen';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return { uploadImage, uploading, error };
}

// Uso en componente
function ImageUploadComponent() {
  const { uploadImage, uploading, error } = useImageUpload();
  const token = localStorage.getItem('token'); // O donde guardes el token

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido');
      return;
    }

    try {
      const result = await uploadImage(file, token);
      console.log('Imagen subida:', result.url);
      // Guardar result.url en tu estado o base de datos
    } catch (err) {
      console.error('Error:', err.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Subiendo imagen...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Subir múltiples imágenes

```javascript
async function uploadMultipleImages(files, token) {
  const formData = new FormData();
  
  // Agregar todos los archivos al FormData
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(
      'http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com/api/upload/multiple',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }
    );

    const data = await response.json();

    if (response.ok) {
      return data.images; // Array de objetos con las URLs
    } else {
      throw new Error(data.message || 'Error al subir imágenes');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
const fileInput = document.querySelector('input[type="file"][multiple]');
const files = fileInput.files;
const token = 'tu_token_jwt_aqui';

uploadMultipleImages(files, token)
  .then(images => {
    images.forEach(img => {
      console.log('Imagen subida:', img.url);
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## Organización de Archivos en S3

Las imágenes se organizan automáticamente en carpetas según el campo del formulario:

- **`logo`** → `logos/uuid.ext`
- **`foto`** → `fotos/uuid.ext`
- **`image`** (por defecto) → `general/uuid.ext`

**Nota:** Actualmente el endpoint usa el campo `image` para todas las imágenes, por lo que todas van a `general/`. Si necesitas organizarlas en `logos/` o `fotos/`, puedes modificar el código del frontend para usar diferentes nombres de campo, o podemos modificar el endpoint para aceptar un parámetro `type`.

---

## URL Base de las Imágenes

Todas las imágenes subidas estarán disponibles públicamente en:

```
https://alcancereducido-images.s3.us-east-1.amazonaws.com/
```

Ejemplo completo:
```
https://alcancereducido-images.s3.us-east-1.amazonaws.com/logos/123e4567-e89b-12d3-a456-426614174000.jpg
```

---

## Notas Importantes

1. **Autenticación:** Siempre incluye el token JWT en el header `Authorization`
2. **Permisos:** Solo usuarios con rol `admin` pueden subir imágenes
3. **Content-Type:** No establezcas `Content-Type` manualmente cuando uses `FormData`, el navegador lo hará automáticamente con el boundary correcto
4. **Validación en Frontend:** Valida tamaño y tipo de archivo antes de enviar para mejor UX
5. **Nombres únicos:** Los archivos se renombran automáticamente con UUID para evitar colisiones
6. **URLs públicas:** Todas las imágenes son públicas y accesibles directamente por su URL

---

## Flujo Recomendado

1. Usuario selecciona archivo
2. Validar en frontend (tipo y tamaño)
3. Mostrar preview si es posible
4. Enviar al endpoint con token JWT
5. Recibir URL de la imagen
6. Guardar la URL en tu base de datos (no el archivo completo)
7. Usar la URL para mostrar la imagen en tu aplicación

---

## Ejemplo Completo - Formulario React

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function ImageUploadForm() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = 'http://alcancereducido-prod.eba-bynjpc2g.us-east-1.elasticbeanstalk.com';
  const token = localStorage.getItem('token');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    // Validar tamaño
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Tipo de archivo no permitido');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${API_URL}/api/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImageUrl(response.data.url);
      setUploading(false);
      
      // Aquí puedes guardar response.data.url en tu base de datos
      console.log('Imagen subida exitosamente:', response.data.url);
    } catch (err) {
      setUploading(false);
      const errorMessage = err.response?.data?.message || 'Error al subir imagen';
      setError(errorMessage);
      console.error('Error:', errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Seleccionar imagen:</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {preview && (
        <div>
          <p>Preview:</p>
          <img src={preview} alt="Preview" style={{ maxWidth: '300px' }} />
        </div>
      )}

      {imageUrl && (
        <div>
          <p>Imagen subida:</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
          <p>URL: {imageUrl}</p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit" disabled={!file || uploading}>
        {uploading ? 'Subiendo...' : 'Subir Imagen'}
      </button>
    </form>
  );
}

export default ImageUploadForm;
```

---

## Soporte

Si tienes problemas o preguntas sobre el endpoint de upload, revisa:
- Los logs del servidor
- La consola del navegador para errores de red
- Que el token JWT sea válido y no haya expirado
- Que el usuario tenga rol `admin`



