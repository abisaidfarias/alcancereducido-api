import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

/**
 * Crea un usuario por defecto si no existe
 */
export const initDefaultUser = async () => {
  try {
    const defaultEmail = 'abisaidfarias@gmail.com';
    const defaultPassword = '@Abisaidvero1317';

    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ email: defaultEmail });
    
    if (existingUser) {
      console.log('ℹ️  Usuario por defecto ya existe');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Crear usuario por defecto
    const defaultUser = await User.create({
      nombre: 'Usuario Administrador',
      email: defaultEmail,
      password: hashedPassword,
      rol: 'admin'
    });

    console.log('✅ Usuario por defecto creado exitosamente');
    console.log(`   Email: ${defaultEmail}`);
    console.log(`   Rol: admin`);
  } catch (error) {
    console.error('❌ Error al crear usuario por defecto:', error.message);
  }
};



