const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pdfRoutes = require('./routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-reader';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
  process.exit(1);
});

// Rutas API
app.use('/api/pdfs', pdfRoutes);

// Ruta principal - servir la interfaz web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de prueba para API
app.get('/api', (req, res) => {
  res.json({
    message: 'PDF Reader API',
    version: '1.0.0',
    endpoints: {
      'GET /api/pdfs': 'Obtener todos los documentos',
      'GET /api/pdfs/search?q=keyword': 'Buscar por palabra clave',
      'POST /api/pdfs/process': 'Procesar todos los PDFs',
      'GET /api/pdfs/stats/overview': 'Estadísticas del sistema'
    }
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta de PDFs: ${process.env.DOWNLOADS_FOLDER || './downloads'}`);
  console.log(`🌐 Interfaz web disponible en: http://localhost:${PORT}`);
});

module.exports = app; 