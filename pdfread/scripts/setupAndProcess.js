const mongoose = require('mongoose');
const PdfProcessor = require('../services/pdfProcessor');
const FilenameNormalizer = require('./normalizeFilenames');
const clearDatabase = require('./clearDatabase');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

async function setupAndProcess() {
  try {
    console.log('🚀 INICIANDO PROCESO COMPLETO DE PDFs');
    console.log('='.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Paso 1: Limpiar base de datos
    console.log('📋 PASO 1: Limpiando base de datos...');
    await clearDatabase();
    console.log('✅ Base de datos limpiada\n');

    // Paso 2: Normalizar nombres de archivos
    console.log('📋 PASO 2: Normalizando nombres de archivos...');
    const normalizer = new FilenameNormalizer();
    await normalizer.normalizeAllFiles();
    const normalizeReport = normalizer.getReport();
    console.log('✅ Nombres normalizados\n');

    // Paso 3: Procesar PDFs
    console.log('📋 PASO 3: Procesando PDFs...');
    const processor = new PdfProcessor();
    const results = await processor.processAllPdfs();
    const processReport = processor.getErrorReport();
    console.log('✅ PDFs procesados\n');

    // Reporte final
    console.log('🎯 REPORTE FINAL COMPLETO');
    console.log('='.repeat(60));
    console.log('📁 NORMALIZACIÓN DE NOMBRES:');
    console.log(`   - Total archivos: ${normalizeReport.total}`);
    console.log(`   - Renombrados: ${normalizeReport.successful}`);
    console.log(`   - Errores: ${normalizeReport.failed}`);
    
    console.log('\n📄 PROCESAMIENTO DE PDFs:');
    console.log(`   - Total archivos: ${processReport.total}`);
    console.log(`   - Exitosos: ${processReport.successful}`);
    console.log(`   - Fallidos: ${processReport.failed}`);
    console.log(`   - Omitidos: ${processReport.skipped}`);
    
    const successRate = ((processReport.successful / processReport.total) * 100).toFixed(1);
    console.log(`   - Tasa de éxito: ${successRate}%`);
    
    console.log('\n🌐 PRÓXIMOS PASOS:');
    console.log('   - Abre http://localhost:3000 para ver la interfaz web');
    console.log('   - Usa la búsqueda para encontrar documentos');
    console.log('   - Revisa los documentos con errores si los hay');
    
    if (processReport.failed > 0) {
      console.log('\n⚠️  DOCUMENTOS CON ERRORES:');
      processReport.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.filename}: ${error.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Función para solo normalizar nombres (sin limpiar DB)
async function normalizeOnly() {
  try {
    console.log('🔄 NORMALIZANDO SOLO NOMBRES DE ARCHIVOS');
    console.log('='.repeat(50));
    
    const normalizer = new FilenameNormalizer();
    await normalizer.normalizeAllFiles();
    
  } catch (error) {
    console.error('❌ Error normalizando nombres:', error);
  }
}

// Función para solo procesar PDFs (sin limpiar DB ni normalizar)
async function processOnly() {
  try {
    console.log('🔄 PROCESANDO SOLO PDFs');
    console.log('='.repeat(50));
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const processor = new PdfProcessor();
    await processor.processAllPdfs();
    
  } catch (error) {
    console.error('❌ Error procesando PDFs:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'normalize':
      await normalizeOnly();
      break;
    case 'process':
      await processOnly();
      break;
    case 'full':
    default:
      await setupAndProcess();
      break;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { setupAndProcess, normalizeOnly, processOnly }; 