import mongoose from 'mongoose';

const marcaSchema = new mongoose.Schema({
  fabricante: {
    type: String,
    required: [true, 'El fabricante es requerido'],
    trim: true
  },
  marca: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true
  },
  logo: {
    type: String,
    trim: true,
    default: '',
    description: 'URL o ruta de la imagen del logo de la marca'
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Índices para búsqueda
marcaSchema.index({ fabricante: 1, marca: 1 });
marcaSchema.index({ fabricante: 1 });
marcaSchema.index({ marca: 1 });

export const Marca = mongoose.model('Marca', marcaSchema);

