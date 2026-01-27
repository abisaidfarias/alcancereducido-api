import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Alcance Reducido',
      version: '1.0.0',
      description: 'API REST para gestión de usuarios y distribuidores con autenticación JWT y generación de códigos QR',
      contact: {
        name: 'API Support',
        email: 'abisaidfarias@gmail.com'
      }
    },
    servers: [
      {
        url: config.baseUrl,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido del login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del usuario (MongoDB ObjectId)'
            },
            nombre: {
              type: 'string',
              description: 'Nombre completo del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario (único)'
            },
            rol: {
              type: 'string',
              enum: ['usuario', 'admin', 'distribuidor'],
              description: 'Rol del usuario'
            },
            distribuidorId: {
              type: 'string',
              description: 'ID del distribuidor asociado (solo para usuarios tipo distribuidor)',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Distribuidor: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del distribuidor (MongoDB ObjectId)'
            },
            representante: {
              type: 'string',
              description: 'Nombre del representante del distribuidor',
              example: 'Juan Pérez'
            },
            nombreRepresentante: {
              type: 'string',
              description: 'Nombre completo del representante',
              example: 'Juan Pérez García'
            },
            domicilio: {
              type: 'string',
              description: 'Dirección del distribuidor',
              example: 'Calle Principal 123'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de contacto del distribuidor',
              example: 'contacto@distribuidor.com'
            },
            sitioWeb: {
              type: 'string',
              description: 'Sitio web del distribuidor',
              example: 'https://www.distribuidor.com'
            },
            logo: {
              type: 'string',
              description: 'URL o ruta de la imagen del logo',
              example: 'https://example.com/logo.png'
            },
            dispositivos: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de IDs de dispositivos asociados'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Marca: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único de la marca (MongoDB ObjectId)'
            },
            fabricante: {
              type: 'string',
              description: 'Nombre del fabricante',
              example: 'Samsung Electronics'
            },
            marca: {
              type: 'string',
              description: 'Nombre de la marca',
              example: 'Samsung'
            },
            logo: {
              type: 'string',
              description: 'URL o ruta de la imagen del logo',
              example: 'https://example.com/logo-samsung.png'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Dispositivo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del dispositivo (MongoDB ObjectId)'
            },
            modelo: {
              type: 'string',
              description: 'Modelo del dispositivo',
              example: 'Galaxy S23',
              required: true
            },
            tipo: {
              type: 'string',
              description: 'Tipo de dispositivo (campo abierto)',
              example: 'telefono'
            },
            foto: {
              type: 'string',
              description: 'URL o ruta de la foto del dispositivo',
              example: 'https://example.com/foto.jpg'
            },
            fechaPublicacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de publicación del dispositivo',
              example: '2025-01-22T10:00:00.000Z'
            },
            tecnologia: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de tecnologías del dispositivo',
              example: ['4G', '5G', 'WiFi']
            },
            frecuencias: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de frecuencias del dispositivo',
              example: ['850 MHz', '1900 MHz', '2.4 GHz']
            },
            gananciaAntena: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de ganancia de antena del dispositivo',
              example: ['3 dBi', '5 dBi']
            },
            EIRP: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de EIRP (Effective Isotropic Radiated Power) del dispositivo',
              example: ['20 dBm', '23 dBm']
            },
            modulo: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array de módulos del dispositivo',
              example: ['Módulo A', 'Módulo B']
            },
            marca: {
              type: 'object',
              description: 'Marca del dispositivo (referencia a Marca)',
              $ref: '#/components/schemas/Marca'
            },
            distribuidores: {
              type: 'array',
              items: {
                type: 'object',
                description: 'Distribuidor asociado',
                $ref: '#/components/schemas/Distribuidor'
              },
              description: 'Array de distribuidores asociados (relación muchos a muchos, requerido)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'abisaidfarias@gmail.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: '@Abisaidvero1317'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: {
              type: 'string',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            },
            rol: {
              type: 'string',
              enum: ['usuario', 'admin', 'distribuidor'],
              example: 'usuario'
            },
            distribuidorId: {
              type: 'string',
              description: 'ID del distribuidor asociado (requerido si rol es distribuidor)',
              example: null
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT token para autenticación'
            }
          }
        },
        QRResponse: {
          type: 'object',
          properties: {
            qrCode: {
              type: 'string',
              description: 'QR code en formato base64 (data URL)'
            },
            url: {
              type: 'string',
              description: 'URL codificada en el QR'
            },
            distribuidorId: {
              type: 'string',
              description: 'ID del distribuidor'
            },
            distribuidorRepresentante: {
              type: 'string',
              description: 'Representante del distribuidor'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Tipo de error'
            },
            message: {
              type: 'string',
              description: 'Mensaje de error detallado'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints para registro, login y perfil de usuario'
      },
      {
        name: 'Usuarios',
        description: 'CRUD de usuarios (requiere autenticación)'
      },
      {
        name: 'Distribuidores',
        description: 'CRUD de distribuidores y generación de QR (requiere autenticación)'
      },
      {
        name: 'Dispositivos',
        description: 'CRUD de dispositivos móviles (requiere autenticación)'
      },
      {
        name: 'Marcas',
        description: 'CRUD de marcas/fabricantes (requiere autenticación, solo admin para crear/editar/eliminar)'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);

