const mongoose = require('mongoose');
const PdfProcessor = require('../services/pdfProcessor');
const PdfDocument = require('../models/PdfDocument');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

async function retryFailed() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener documentos con errores
    const failedDocs = await PdfDocument.find({ status: 'error' })
      .select('filename originalPath')
      .sort({ createdAt: -1 });

    console.log(`📁 Encontrados ${failedDocs.length} documentos con errores`);

    if (failedDocs.length === 0) {
      console.log('🎉 No hay documentos con errores para reintentar');
      return;
    }

    // Crear instancia del procesador
    const processor = new PdfProcessor();

    console.log('🔄 Reintentando procesamiento de archivos fallidos...\n');

    // Procesar solo los archivos que fallaron
    const results = [];
    for (const doc of failedDocs) {
      try {
        console.log(`🔄 Reintentando: ${doc.filename}`);
        const result = await processor.processPdfFile(doc.filename);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error reintentando ${doc.filename}:`, error.message);
        results.push({ filename: doc.filename, error: error.message });
      }
    }

    // Mostrar reporte
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    console.log('\n📊 REPORTE DE REINTENTO');
    console.log('='.repeat(40));
    console.log(`📁 Total reintentados: ${failedDocs.length}`);
    console.log(`✅ Exitosos: ${successful}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`📊 Tasa de éxito: ${((successful / failedDocs.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ ARCHIVOS QUE SIGUEN FALLANDO:');
      console.log('-'.repeat(30));
      results.filter(r => r.error).forEach((result, index) => {
        console.log(`${index + 1}. ${result.filename}`);
        console.log(`   Error: ${result.error}`);
        console.log('');
      });
    }

    console.log('='.repeat(40));

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
  retryFailed();
}

module.exports = retryFailed; 