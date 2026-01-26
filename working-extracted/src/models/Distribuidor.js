import mongoose from 'mongoose';

const distribuidorSchema = new mongoose.Schema({
  representante: {
    type: String,
    required: [true, 'El representante es requerido'],
    unique: true,
    trim: true
  },
  domicilio: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'El email debe tener un formato válido'
    }
  },
  sitioWeb: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Permitir vacío
        return /^https?:\/\/.+/.test(v);
      },
      message: 'El sitio web debe ser una URL válida (http:// o https://)'
    }
  },
  logo: {
    type: String,
    trim: true,
    default: '',
    description: 'URL o ruta de la imagen del logo'
  },
  dispositivos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispositivo'
  }]
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Índice único para representante
distribuidorSchema.index({ representante: 1 }, { unique: true });

export const Distribuidor = mongoose.model('Distribuidor', distribuidorSchema);
