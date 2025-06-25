const fs = require('fs-extra');
const path = require('path');

class FilenameNormalizer {
  constructor(downloadsFolder = './downloads') {
    this.downloadsFolder = downloadsFolder;
    this.renamedFiles = [];
    this.errors = [];
  }

  // Obtener todos los archivos PDF
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

  // Normalizar un nombre de archivo
  normalizeFilename(filename) {
    let normalized = filename;

    // Remover prefijos como "66dd7f8f53e60e0c1e8abf14_"
    normalized = normalized.replace(/^[a-f0-9]{24}_/, '');

    // Remover otros patrones comunes de prefijos
    normalized = normalized.replace(/^[a-f0-9]{8,}_/, '');
    normalized = normalized.replace(/^[0-9]{10,}_/, '');

    // Limpiar caracteres especiales y espacios
    normalized = normalized
      .replace(/[^\w\s.-]/g, '') // Remover caracteres especiales excepto guiones y puntos
      .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
      .replace(/_+/g, '_') // Múltiples guiones bajos por uno solo
      .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
      .toLowerCase(); // Convertir a minúsculas

    // Asegurar que termine en .pdf
    if (!normalized.endsWith('.pdf')) {
      normalized += '.pdf';
    }

    // Si el nombre está vacío después de la limpieza, usar un nombre por defecto
    if (normalized === '.pdf' || normalized.length < 5) {
      normalized = `document_${Date.now()}.pdf`;
    }

    return normalized;
  }

  // Renombrar un archivo individual
  async renameFile(oldFilename) {
    try {
      const oldPath = path.join(this.downloadsFolder, oldFilename);
      const newFilename = this.normalizeFilename(oldFilename);
      const newPath = path.join(this.downloadsFolder, newFilename);

      // Verificar si el archivo existe
      if (!await fs.pathExists(oldPath)) {
        throw new Error(`Archivo no encontrado: ${oldPath}`);
      }

      // Si el nuevo nombre es igual al anterior, no hacer nada
      if (oldFilename === newFilename) {
        console.log(`⏭️  ${oldFilename} ya está normalizado`);
        return { oldFilename, newFilename, skipped: true };
      }

      // Verificar si el nuevo nombre ya existe
      if (await fs.pathExists(newPath)) {
        // Agregar timestamp para evitar conflictos
        const timestamp = Date.now();
        const nameWithoutExt = newFilename.replace('.pdf', '');
        const finalNewFilename = `${nameWithoutExt}_${timestamp}.pdf`;
        const finalNewPath = path.join(this.downloadsFolder, finalNewFilename);
        
        await fs.move(oldPath, finalNewPath);
        console.log(`✅ ${oldFilename} → ${finalNewFilename}`);
        
        this.renamedFiles.push({
          old: oldFilename,
          new: finalNewFilename,
          timestamp: new Date()
        });
        
        return { oldFilename, newFilename: finalNewFilename, skipped: false };
      }

      // Renombrar el archivo
      await fs.move(oldPath, newPath);
      console.log(`✅ ${oldFilename} → ${newFilename}`);
      
      this.renamedFiles.push({
        old: oldFilename,
        new: newFilename,
        timestamp: new Date()
      });
      
      return { oldFilename, newFilename, skipped: false };

    } catch (error) {
      console.error(`❌ Error renombrando ${oldFilename}:`, error.message);
      this.errors.push({
        filename: oldFilename,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  // Normalizar todos los archivos
  async normalizeAllFiles() {
    const pdfFiles = await this.getPdfFiles();
    console.log(`📁 Encontrados ${pdfFiles.length} archivos PDF para normalizar`);
    
    if (pdfFiles.length === 0) {
      console.log('No hay archivos PDF para normalizar');
      return;
    }

    // Reiniciar contadores
    this.renamedFiles = [];
    this.errors = [];

    console.log('🔄 Iniciando normalización de nombres...\n');

    for (const filename of pdfFiles) {
      try {
        await this.renameFile(filename);
      } catch (error) {
        // Error ya manejado en renameFile
      }
    }

    // Mostrar reporte
    this.showReport();
  }

  // Mostrar reporte de normalización
  showReport() {
    console.log('\n📊 REPORTE DE NORMALIZACIÓN');
    console.log('='.repeat(50));
    
    const total = this.renamedFiles.length + this.errors.length;
    const successful = this.renamedFiles.length;
    const failed = this.errors.length;
    
    console.log(`📁 Total de archivos: ${total}`);
    console.log(`✅ Renombrados exitosamente: ${successful}`);
    console.log(`❌ Errores: ${failed}`);
    
    if (this.renamedFiles.length > 0) {
      console.log('\n✅ ARCHIVOS RENOMBRADOS:');
      console.log('-'.repeat(30));
      this.renamedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.old}`);
        console.log(`   → ${file.new}`);
        console.log(`   📅 ${file.timestamp.toLocaleString()}`);
        console.log('');
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ARCHIVOS CON ERRORES:');
      console.log('-'.repeat(30));
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.filename}`);
        console.log(`   Error: ${error.error}`);
        console.log(`   📅 ${error.timestamp.toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log('='.repeat(50));
  }

  // Obtener reporte
  getReport() {
    return {
      total: this.renamedFiles.length + this.errors.length,
      successful: this.renamedFiles.length,
      failed: this.errors.length,
      renamedFiles: this.renamedFiles,
      errors: this.errors
    };
  }

  // Mostrar preview de cambios sin aplicarlos
  async previewChanges() {
    const pdfFiles = await this.getPdfFiles();
    console.log(`📁 Encontrados ${pdfFiles.length} archivos PDF`);
    console.log('👀 PREVIEW DE CAMBIOS (no se aplicarán):\n');
    
    const changes = [];
    
    for (const filename of pdfFiles) {
      const newName = this.normalizeFilename(filename);
      if (filename !== newName) {
        changes.push({ old: filename, new: newName });
        console.log(`${filename} → ${newName}`);
      } else {
        console.log(`${filename} (sin cambios)`);
      }
    }
    
    console.log(`\n📊 Resumen: ${changes.length} archivos serían renombrados`);
    return changes;
  }
}

// Función principal
async function main() {
  const normalizer = new FilenameNormalizer();
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'preview':
        console.log('🔍 Modo preview - no se harán cambios reales\n');
        await normalizer.previewChanges();
        break;
        
      case 'normalize':
      default:
        console.log('🔄 Modo normalización - aplicando cambios\n');
        await normalizer.normalizeAllFiles();
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

module.exports = FilenameNormalizer; 