const mongoose = require('mongoose');
const PdfProcessor = require('../services/pdfProcessor');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

async function main() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    // Crear instancia del procesador
    const processor = new PdfProcessor();
    
    // Obtener archivos PDF
    const pdfFiles = await processor.getPdfFiles();
    console.log(`📁 Encontrados ${pdfFiles.length} archivos PDF`);
    
    if (pdfFiles.length === 0) {
      console.log('No hay archivos PDF para procesar');
      return;
    }
    
    // Procesar todos los PDFs
    console.log('🔄 Iniciando procesamiento...');
    const results = await processor.processAllPdfs();
    
    // El reporte ya se muestra automáticamente en processAllPdfs()
    
    // Mostrar resumen adicional
    const report = processor.getErrorReport();
    console.log('\n🎯 RESUMEN FINAL:');
    console.log(`📊 Tasa de éxito: ${((report.successful / report.total) * 100).toFixed(1)}%`);
    
    if (report.failed > 0) {
      console.log(`\n💡 SUGERENCIAS:`);
      console.log(`- Revisa los archivos con errores en la interfaz web: http://localhost:3000`);
      console.log(`- Algunos PDFs pueden estar corruptos o protegidos`);
      console.log(`- Para limpiar la base de datos: node scripts/clearDatabase.js`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = main; 