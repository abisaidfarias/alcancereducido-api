/**
 * Script de migración: distribuidores[] → distribuidor
 * 
 * Convierte el campo 'distribuidores' (array de ObjectIds) a 'distribuidor' (ObjectId único o null).
 * - Si distribuidores tiene un elemento → distribuidor = ese elemento
 * - Si distribuidores está vacío → distribuidor = null
 * - Si distribuidores tiene múltiples elementos → distribuidor = el primero
 * 
 * Uso: node src/scripts/migrateDistribuidores.js
 */

import mongoose from 'mongoose';
import { config } from '../config/config.js';

const run = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('dispositivos');

    // Obtener todos los dispositivos que aún tienen el campo 'distribuidores'
    const dispositivos = await collection.find({ distribuidores: { $exists: true } }).toArray();
    
    console.log(`\n📊 Encontrados ${dispositivos.length} dispositivos con campo 'distribuidores'`);

    let migrados = 0;
    let sinDistribuidor = 0;
    let conMultiples = 0;

    for (const dispositivo of dispositivos) {
      const distribuidores = dispositivo.distribuidores || [];
      let nuevoDistribuidor = null;

      if (distribuidores.length === 0) {
        nuevoDistribuidor = null;
        sinDistribuidor++;
      } else if (distribuidores.length === 1) {
        nuevoDistribuidor = distribuidores[0];
      } else {
        // Múltiples distribuidores: tomar el primero
        nuevoDistribuidor = distribuidores[0];
        conMultiples++;
        console.log(`  ⚠️  Dispositivo "${dispositivo.modelo}" (${dispositivo._id}) tenía ${distribuidores.length} distribuidores. Se conserva el primero: ${distribuidores[0]}`);
      }

      // Actualizar: agregar campo 'distribuidor' y eliminar 'distribuidores'
      await collection.updateOne(
        { _id: dispositivo._id },
        {
          $set: { distribuidor: nuevoDistribuidor },
          $unset: { distribuidores: "" }
        }
      );
      migrados++;
    }

    console.log(`\n✅ Migración completada:`);
    console.log(`   - Total migrados: ${migrados}`);
    console.log(`   - Sin distribuidor (null): ${sinDistribuidor}`);
    console.log(`   - Con múltiples distribuidores (se conservó el primero): ${conMultiples}`);

    // Verificar resultado
    const verificacion = await collection.find({ distribuidores: { $exists: true } }).count();
    console.log(`\n🔍 Verificación: ${verificacion} documentos aún con campo 'distribuidores' (debería ser 0)`);

    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

run();
