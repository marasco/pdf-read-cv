const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const PdfDocument = require('../models/PdfDocument');

class PdfProcessor {
  constructor(downloadsFolder = './downloads') {
    this.downloadsFolder = downloadsFolder;
    this.processingReport = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
  }

  // Obtener todos los archivos PDF de la carpeta downloads
  async getPdfFiles() {
    try {
      const files = await fs.readdir(this.downloadsFolder);
      return files.filter(file => 
        path.extname(file).toLowerCase() === '.pdf'
      );
    } catch (error) {
      console.error('Error reading downloads folder:', error);
      return [];
    }
  }

  // Procesar un archivo PDF individual
  async processPdfFile(filename) {
    const filePath = path.join(this.downloadsFolder, filename);
    let pdfDoc = null;
    
    try {
      // Verificar si el archivo existe
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      // Verificar si el archivo ya fue procesado
      const existingDoc = await PdfDocument.findOne({ filename });
      if (existingDoc && existingDoc.status === 'completed') {
        console.log(`⏭️  PDF ${filename} ya fue procesado anteriormente`);
        this.processingReport.skipped++;
        return existingDoc;
      }

      // Actualizar o crear documento con estado processing
      pdfDoc = existingDoc;
      if (!pdfDoc) {
        pdfDoc = new PdfDocument({
          filename,
          originalPath: filePath,
          status: 'processing'
        });
      } else {
        pdfDoc.status = 'processing';
        pdfDoc.error = null;
      }
      await pdfDoc.save();

      // Leer el archivo PDF
      const dataBuffer = await fs.readFile(filePath);
      const fileStats = await fs.stat(filePath);

      // Verificar que el archivo no esté vacío
      if (dataBuffer.length === 0) {
        throw new Error('El archivo PDF está vacío');
      }

      // Configurar opciones para pdf-parse para suprimir warnings
      const options = {
        // Suprimir warnings de caracteres inválidos
        normalizeWhitespace: true,
        disableCombineTextItems: false
      };

      // Extraer texto del PDF con manejo de errores mejorado
      let pdfData;
      try {
        pdfData = await pdfParse(dataBuffer, options);
      } catch (parseError) {
        // Intentar con opciones más permisivas
        console.log(`⚠️  Primer intento falló para ${filename}, intentando con opciones alternativas...`);
        try {
          pdfData = await pdfParse(dataBuffer, { 
            normalizeWhitespace: false,
            disableCombineTextItems: true 
          });
        } catch (secondError) {
          throw new Error(`Error al parsear PDF: ${parseError.message}`);
        }
      }
      
      // Verificar que se extrajo texto
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('No se pudo extraer texto del PDF (archivo posiblemente corrupto o protegido)');
      }
      
      // Procesar palabras
      const words = this.extractWords(pdfData.text);
      
      // Actualizar documento
      pdfDoc.content = pdfData.text;
      pdfDoc.words = words;
      pdfDoc.metadata = {
        pages: pdfData.numpages || 0,
        fileSize: fileStats.size,
        createdAt: fileStats.birthtime || new Date(),
        processedAt: new Date()
      };
      pdfDoc.status = 'completed';
      
      await pdfDoc.save();
      console.log(`✅ PDF ${filename} procesado exitosamente - ${words.length} palabras únicas`);
      this.processingReport.successful++;
      
      return pdfDoc;
    } catch (error) {
      console.error(`❌ Error procesando PDF ${filename}:`, error.message);
      
      // Registrar error en el reporte
      this.processingReport.errors.push({
        filename,
        error: error.message,
        timestamp: new Date()
      });
      this.processingReport.failed++;
      
      // Actualizar estado de error
      if (pdfDoc) {
        try {
          pdfDoc.status = 'error';
          pdfDoc.error = error.message;
          await pdfDoc.save();
        } catch (saveError) {
          console.error(`Error guardando estado de error para ${filename}:`, saveError.message);
        }
      }
      
      throw error;
    }
  }

  // Extraer y contar palabras del texto
  extractWords(text) {
    const wordMap = new Map();
    
    // Limpiar y dividir el texto en palabras
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remover caracteres especiales
      .split(/\s+/)
      .filter(word => word.length > 2); // Filtrar palabras muy cortas
    
    // Contar palabras
    words.forEach((word, index) => {
      if (wordMap.has(word)) {
        wordMap.get(word).count++;
      } else {
        wordMap.set(word, {
          word,
          count: 1,
          positions: [{ page: Math.floor(index / 100) + 1, position: index }]
        });
      }
    });

    return Array.from(wordMap.values());
  }

  // Procesar todos los PDFs pendientes
  async processAllPdfs() {
    const pdfFiles = await this.getPdfFiles();
    console.log(`📁 Encontrados ${pdfFiles.length} archivos PDF para procesar`);
    
    // Reiniciar reporte
    this.processingReport = {
      total: pdfFiles.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    const results = [];
    for (const filename of pdfFiles) {
      try {
        const result = await this.processPdfFile(filename);
        results.push(result);
      } catch (error) {
        console.error(`Error procesando ${filename}:`, error.message);
        results.push({ filename, error: error.message });
      }
    }
    
    // Mostrar reporte final
    this.showProcessingReport();
    
    return results;
  }

  // Mostrar reporte de procesamiento
  showProcessingReport() {
    console.log('\n📊 REPORTE DE PROCESAMIENTO');
    console.log('='.repeat(50));
    console.log(`📁 Total de archivos: ${this.processingReport.total}`);
    console.log(`✅ Exitosos: ${this.processingReport.successful}`);
    console.log(`❌ Fallidos: ${this.processingReport.failed}`);
    console.log(`⏭️  Omitidos: ${this.processingReport.skipped}`);
    
    if (this.processingReport.errors.length > 0) {
      console.log('\n❌ ARCHIVOS CON ERRORES:');
      console.log('-'.repeat(30));
      this.processingReport.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.filename}`);
        console.log(`   Error: ${error.error}`);
        console.log(`   Fecha: ${error.timestamp.toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(50));
  }

  // Obtener reporte de errores
  getErrorReport() {
    return this.processingReport;
  }

  // Buscar documentos por palabra clave
  async searchByKeyword(keyword) {
    const searchRegex = new RegExp(keyword, 'i');
    
    return await PdfDocument.find({
      $or: [
        { 'words.word': searchRegex },
        { content: searchRegex }
      ]
    }).sort({ 'metadata.processedAt': -1 });
  }

  // Obtener documentos con errores
  async getDocumentsWithErrors() {
    return await PdfDocument.find({ status: 'error' })
      .select('filename error createdAt')
      .sort({ createdAt: -1 });
  }
}

module.exports = PdfProcessor; 