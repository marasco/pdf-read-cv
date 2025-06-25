const mongoose = require('mongoose');
const PdfDocument = require('../models/PdfDocument');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

async function clearDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Confirmar antes de borrar
    const count = await PdfDocument.countDocuments();
    console.log(`📊 Encontrados ${count} documentos en la base de datos`);
    
    if (count === 0) {
      console.log('La base de datos ya está vacía');
      return;
    }

    // Borrar todos los documentos
    const result = await PdfDocument.deleteMany({});
    console.log(`🗑️  Eliminados ${result.deletedCount} documentos de la base de datos`);
    
    console.log('✅ Base de datos limpiada exitosamente');
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase; 