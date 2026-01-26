import mongoose from 'mongoose';
import { config } from './config.js';
import { initDefaultUser } from './initDefaultUser.js';

// Conectar a MongoDB
export const connectDB = async () => {
  try {
    const mongoUri = config.mongoUri;
    console.log('🔗 Intentando conectar a MongoDB...');
    console.log('📍 URI (primeros 50 chars):', mongoUri.substring(0, 50) + '...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB conectado exitosamente');
    
    // Inicializar usuario por defecto después de conectar
    await initDefaultUser();
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de MongoDB:', err);
});
