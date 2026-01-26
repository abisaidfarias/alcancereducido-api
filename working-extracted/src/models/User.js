import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  rol: {
    type: String,
    enum: ['usuario', 'admin', 'distribuidor'],
    default: 'usuario'
  },
  distribuidorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distribuidor',
    default: null,
    description: 'Referencia al distribuidor asociado (solo para usuarios tipo distribuidor)'
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Validación: Si el rol es distribuidor, debe tener un distribuidorId
userSchema.pre('validate', function(next) {
  if (this.rol === 'distribuidor' && !this.distribuidorId) {
    this.invalidate('distribuidorId', 'Los usuarios tipo distribuidor deben tener un distribuidor asociado');
  }
  if (this.rol !== 'distribuidor' && this.distribuidorId) {
    this.distribuidorId = null; // Limpiar si no es distribuidor
  }
  next();
});

// Método para convertir a JSON sin la contraseña
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model('User', userSchema);
