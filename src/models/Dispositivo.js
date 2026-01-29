import mongoose from 'mongoose';

const dispositivoSchema = new mongoose.Schema({
  modelo: {
    type: String,
    required: [true, 'El modelo es requerido'],
    unique: true,
    trim: true
  },
  tipo: {
    type: String,
    trim: true,
    default: '',
    description: 'Tipo de dispositivo (campo abierto)'
  },
  foto: {
    type: String,
    trim: true,
    default: '',
    description: 'URL o ruta de la foto del dispositivo'
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now,
    description: 'Fecha de publicación del dispositivo'
  },
  tecnologia: {
    type: [String],
    default: [],
    description: 'Array de tecnologías del dispositivo'
  },
  frecuencias: {
    type: [String],
    default: [],
    description: 'Array de frecuencias del dispositivo'
  },
  gananciaAntena: {
    type: [String],
    default: [],
    description: 'Array de ganancia de antena del dispositivo'
  },
  EIRP: {
    type: [String],
    default: [],
    description: 'Array de EIRP (Effective Isotropic Radiated Power) del dispositivo'
  },
  modulo: {
    type: [String],
    default: [],
    description: 'Array de módulos del dispositivo'
  },
  nombreTestReport: {
    type: [String],
    default: [],
    description: 'Array de nombres de Test Report del dispositivo'
  },
  testReportFiles: {
    type: String,
    trim: true,
    default: '',
    description: 'URL del archivo de Test Report (RAR/ZIP) subido al servidor'
  },
  fechaCertificacionSubtel: {
    type: Date,
    default: null,
    description: 'Fecha de Certificación SUBTEL'
  },
  oficioCertificacionSubtel: {
    type: String,
    trim: true,
    default: '',
    description: 'Oficio de Certificación SUBTEL'
  },
  resolutionVersion: {
    type: String,
    enum: ['2017', '2025'],
    default: '2017',
    description: 'Versión de resolución SUBTEL'
  },
  marca: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marca',
    required: [true, 'La marca es requerida']
  },
  distribuidores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distribuidor',
    required: true
  }]
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Índices para búsqueda
dispositivoSchema.index({ modelo: 1 }, { unique: true }); // Índice único para modelo
dispositivoSchema.index({ marca: 1 });
dispositivoSchema.index({ tipo: 1 });
dispositivoSchema.index({ distribuidores: 1 });

export const Dispositivo = mongoose.model('Dispositivo', dispositivoSchema);

