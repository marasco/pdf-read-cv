const mongoose = require('mongoose');
const PdfProcessor = require('../services/pdfProcessor');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

async function main() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
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
    
    // Determinar tamaño del lote basado en la cantidad de archivos
    let batchSize = 5; // Por defecto
    if (pdfFiles.length > 100) {
      batchSize = 3; // Lotes más pequeños para muchos archivos
    } else if (pdfFiles.length > 50) {
      batchSize = 4;
    }
    
    console.log(`🔄 Iniciando procesamiento en lotes de ${batchSize} archivos...`);
    
    // Procesar todos los PDFs
    const results = await processor.processAllPdfs(batchSize);
    
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
      console.log(`- Para reintentar solo los fallidos: node scripts/retryFailed.js`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
    } catch (disconnectError) {
      console.log('⚠️  Error al desconectar de MongoDB:', disconnectError.message);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = main; 