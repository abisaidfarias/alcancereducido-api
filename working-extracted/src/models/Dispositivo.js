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
    enum: ['telefono'],
    default: 'telefono',
    required: true
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

