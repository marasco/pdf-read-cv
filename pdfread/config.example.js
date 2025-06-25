// Ejemplo de configuración - Copia este archivo como .env
module.exports = {
  // URL de conexión a MongoDB
  MONGODB_URI: 'mongodb://localhost:27017/pdf-reader',
  
  // Puerto del servidor
  PORT: 3000,
  
  // Carpeta donde están los archivos PDF
  DOWNLOADS_FOLDER: './downloads'
};

// Para usar este archivo:
// 1. Cópialo como .env
// 2. Modifica los valores según tu configuración
// 3. El archivo .env será cargado automáticamente por dotenv 