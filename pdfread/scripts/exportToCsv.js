const mongoose = require('mongoose');
const PdfDocument = require('../models/PdfDocument');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

class CsvExporter {
  constructor() {
    this.outputDir = './exports';
    this.batchSize = 1000; // Procesar en lotes de 1000 documentos
  }

  // Crear directorio de exportaciones si no existe
  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  // Escapar texto para CSV
  escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // Si contiene comas, comillas o saltos de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  // Convertir array de palabras a string
  formatWords(words) {
    if (!words || !Array.isArray(words)) {
      return '';
    }
    
    return words
      .sort((a, b) => b.count - a.count) // Ordenar por frecuencia
      .slice(0, 50) // Top 50 palabras
      .map(word => `${word.word}(${word.count})`)
      .join('; ');
  }

  // Generar nombre de archivo con timestamp
  generateFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `pdf_documents_${timestamp}.csv`;
  }

  // Procesar un documento individual
  processDocument(doc) {
    return [
      doc._id.toString(),
      this.escapeCsvValue(doc.filename),
      this.escapeCsvValue(doc.originalPath),
      this.escapeCsvValue(doc.status),
      doc.metadata?.pages || 0,
      doc.metadata?.fileSize || 0,
      doc.metadata?.fileSize ? (doc.metadata.fileSize / (1024 * 1024)).toFixed(2) : 0,
      doc.metadata?.createdAt ? new Date(doc.metadata.createdAt).toISOString() : '',
      doc.metadata?.processedAt ? new Date(doc.metadata.processedAt).toISOString() : '',
      doc.words ? doc.words.length : 0,
      doc.words ? doc.words.reduce((sum, word) => sum + word.count, 0) : 0,
      this.escapeCsvValue(this.formatWords(doc.words)),
      this.escapeCsvValue(doc.error || ''),
      this.escapeCsvValue(doc.content || '')
    ].join(',');
  }

  // Exportar documentos a CSV usando streaming
  async exportToCsv() {
    try {
      console.log('🔄 Conectando a MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Conectado a MongoDB');

      // Crear directorio de salida
      await this.ensureOutputDir();

      // Obtener total de documentos
      console.log('📊 Contando documentos...');
      const totalDocs = await PdfDocument.countDocuments({});
      console.log(`📁 Total de documentos: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log('❌ No hay documentos para exportar');
        return;
      }

      // Definir headers del CSV
      const headers = [
        'ID',
        'Nombre del Archivo',
        'Ruta Original',
        'Estado',
        'Páginas',
        'Tamaño (bytes)',
        'Tamaño (MB)',
        'Fecha de Creación',
        'Fecha de Procesamiento',
        'Palabras Únicas',
        'Total de Palabras',
        'Top 50 Palabras',
        'Error (si aplica)',
        'Contenido Completo'
      ].join(',');

      // Generar nombre de archivo
      const filename = this.generateFilename();
      const filePath = path.join(this.outputDir, filename);

      // Crear stream de escritura
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      // Escribir headers
      writeStream.write(headers + '\n');

      // Variables para estadísticas
      let processedCount = 0;
      let completedCount = 0;
      let errorCount = 0;
      let pendingCount = 0;
      let processingCount = 0;
      let totalWords = 0;
      let uniqueWords = 0;
      let totalSize = 0;

      // Procesar documentos en lotes
      console.log('🔄 Procesando documentos en lotes...');
      
      for (let skip = 0; skip < totalDocs; skip += this.batchSize) {
        const batch = await PdfDocument.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(this.batchSize)
          .lean()
          .allowDiskUse(true); // Permitir uso de disco para ordenamiento

        for (const doc of batch) {
          // Procesar documento
          const csvLine = this.processDocument(doc);
          writeStream.write(csvLine + '\n');

          // Actualizar estadísticas
          processedCount++;
          
          // Contar por estado
          switch (doc.status) {
            case 'completed': completedCount++; break;
            case 'error': errorCount++; break;
            case 'pending': pendingCount++; break;
            case 'processing': processingCount++; break;
          }

          // Estadísticas de palabras
          if (doc.words) {
            uniqueWords += doc.words.length;
            totalWords += doc.words.reduce((sum, word) => sum + word.count, 0);
          }

          // Estadísticas de tamaño
          totalSize += doc.metadata?.fileSize || 0;
        }

        // Mostrar progreso
        console.log(`📊 Procesados ${processedCount}/${totalDocs} documentos (${((processedCount/totalDocs)*100).toFixed(1)}%)`);
      }

      // Cerrar stream
      writeStream.end();

      // Esperar a que termine de escribir
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Generar reporte
      this.generateReport({
        totalDocs,
        completedCount,
        errorCount,
        pendingCount,
        processingCount,
        totalWords,
        uniqueWords,
        totalSize
      }, filePath);

      console.log('✅ Exportación completada exitosamente');
      console.log(`📄 Archivo guardado en: ${filePath}`);

    } catch (error) {
      console.error('❌ Error durante la exportación:', error);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
    }
  }

  // Exportar documentos a CSV sin ordenamiento (para evitar problemas de memoria)
  async exportToCsvNoSort() {
    try {
      console.log('🔄 Conectando a MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Conectado a MongoDB');

      // Crear directorio de salida
      await this.ensureOutputDir();

      // Obtener total de documentos
      console.log('📊 Contando documentos...');
      const totalDocs = await PdfDocument.countDocuments({});
      console.log(`📁 Total de documentos: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log('❌ No hay documentos para exportar');
        return;
      }

      // Definir headers del CSV
      const headers = [
        'ID',
        'Nombre del Archivo',
        'Ruta Original',
        'Estado',
        'Páginas',
        'Tamaño (bytes)',
        'Tamaño (MB)',
        'Fecha de Creación',
        'Fecha de Procesamiento',
        'Palabras Únicas',
        'Total de Palabras',
        'Top 50 Palabras',
        'Error (si aplica)',
        'Contenido Completo'
      ].join(',');

      // Generar nombre de archivo
      const filename = this.generateFilename().replace('.csv', '_no_sort.csv');
      const filePath = path.join(this.outputDir, filename);

      // Crear stream de escritura
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      // Escribir headers
      writeStream.write(headers + '\n');

      // Variables para estadísticas
      let processedCount = 0;
      let completedCount = 0;
      let errorCount = 0;
      let pendingCount = 0;
      let processingCount = 0;
      let totalWords = 0;
      let uniqueWords = 0;
      let totalSize = 0;

      // Procesar documentos en lotes SIN ordenamiento
      console.log('🔄 Procesando documentos en lotes (sin ordenamiento)...');
      
      for (let skip = 0; skip < totalDocs; skip += this.batchSize) {
        const batch = await PdfDocument.find({})
          .skip(skip)
          .limit(this.batchSize)
          .lean(); // Sin ordenamiento para evitar problemas de memoria

        for (const doc of batch) {
          // Procesar documento
          const csvLine = this.processDocument(doc);
          writeStream.write(csvLine + '\n');

          // Actualizar estadísticas
          processedCount++;
          
          // Contar por estado
          switch (doc.status) {
            case 'completed': completedCount++; break;
            case 'error': errorCount++; break;
            case 'pending': pendingCount++; break;
            case 'processing': processingCount++; break;
          }

          // Estadísticas de palabras
          if (doc.words) {
            uniqueWords += doc.words.length;
            totalWords += doc.words.reduce((sum, word) => sum + word.count, 0);
          }

          // Estadísticas de tamaño
          totalSize += doc.metadata?.fileSize || 0;
        }

        // Mostrar progreso
        console.log(`📊 Procesados ${processedCount}/${totalDocs} documentos (${((processedCount/totalDocs)*100).toFixed(1)}%)`);
      }

      // Cerrar stream
      writeStream.end();

      // Esperar a que termine de escribir
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Generar reporte
      this.generateReport({
        totalDocs,
        completedCount,
        errorCount,
        pendingCount,
        processingCount,
        totalWords,
        uniqueWords,
        totalSize
      }, filePath);

      console.log('✅ Exportación completada exitosamente (sin ordenamiento)');
      console.log(`📄 Archivo guardado en: ${filePath}`);

    } catch (error) {
      console.error('❌ Error durante la exportación:', error);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
    }
  }

  // Generar reporte de exportación
  generateReport(stats, filePath) {
    console.log('\n📊 REPORTE DE EXPORTACIÓN');
    console.log('='.repeat(50));
    
    console.log(`📁 Total de documentos: ${stats.totalDocs}`);
    console.log(`✅ Completados: ${stats.completedCount}`);
    console.log(`❌ Con errores: ${stats.errorCount}`);
    console.log(`⏳ Pendientes: ${stats.pendingCount}`);
    console.log(`🔄 Procesando: ${stats.processingCount}`);

    console.log(`📝 Total de palabras: ${stats.totalWords.toLocaleString()}`);
    console.log(`🔤 Palabras únicas: ${stats.uniqueWords.toLocaleString()}`);

    console.log(`💾 Tamaño total: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`);

    // Información del archivo
    const fileStats = fs.statSync(filePath);
    console.log(`📄 Tamaño del CSV: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`📂 Ubicación: ${filePath}`);

    console.log('='.repeat(50));
  }

  // Exportar solo documentos con errores
  async exportErrorsOnly() {
    try {
      console.log('🔄 Conectando a MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Conectado a MongoDB');

      await this.ensureOutputDir();

      console.log('📊 Obteniendo documentos con errores...');
      const documents = await PdfDocument.find({ status: 'error' })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📁 Encontrados ${documents.length} documentos con errores`);

      if (documents.length === 0) {
        console.log('✅ No hay documentos con errores');
        return;
      }

      // Headers específicos para errores
      const headers = [
        'ID',
        'Nombre del Archivo',
        'Ruta Original',
        'Error',
        'Fecha de Creación',
        'Fecha de Última Actualización'
      ].join(',');

      // Generar nombre de archivo
      const filename = `pdf_errors_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`;
      const filePath = path.join(this.outputDir, filename);

      // Crear stream de escritura
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      // Escribir headers
      writeStream.write(headers + '\n');

      // Procesar documentos con errores
      documents.forEach(doc => {
        const row = [
          doc._id.toString(),
          this.escapeCsvValue(doc.filename),
          this.escapeCsvValue(doc.originalPath),
          this.escapeCsvValue(doc.error || ''),
          doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
          doc.updatedAt ? new Date(doc.updatedAt).toISOString() : ''
        ].join(',');

        writeStream.write(row + '\n');
      });

      // Cerrar stream
      writeStream.end();

      // Esperar a que termine de escribir
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      console.log('✅ Exportación de errores completada');
      console.log(`📄 Archivo guardado en: ${filePath}`);

    } catch (error) {
      console.error('❌ Error durante la exportación:', error);
    } finally {
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const exporter = new CsvExporter();

  try {
    switch (command) {
      case 'errors':
        console.log('📊 Exportando solo documentos con errores...');
        await exporter.exportErrorsOnly();
        break;
      case 'no-sort':
        console.log('📊 Exportando todos los documentos (sin ordenamiento)...');
        await exporter.exportToCsvNoSort();
        break;
      case 'all':
      default:
        console.log('📊 Exportando todos los documentos...');
        try {
          await exporter.exportToCsv();
        } catch (error) {
          if (error.message.includes('Sort exceeded memory limit')) {
            console.log('⚠️  Error de memoria detectado, intentando sin ordenamiento...');
            await exporter.exportToCsvNoSort();
          } else {
            throw error;
          }
        }
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = CsvExporter; 