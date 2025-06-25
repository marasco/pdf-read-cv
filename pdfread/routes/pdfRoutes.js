const express = require('express');
const router = express.Router();
const PdfProcessor = require('../services/pdfProcessor');
const PdfDocument = require('../models/PdfDocument');
const path = require('path');
const fs = require('fs-extra');

const pdfProcessor = new PdfProcessor();

// GET /api/pdfs - Obtener todos los documentos procesados
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const documents = await PdfDocument.find(query)
      .select('filename status metadata createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PdfDocument.countDocuments(query);
    
    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pdfs/search - Buscar por palabra clave
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q, 'i');
    
    const documents = await PdfDocument.find({
      $or: [
        { 'words.word': searchRegex },
        { content: searchRegex },
        { filename: searchRegex }
      ]
    })
    .select('filename status metadata words')
    .sort({ 'metadata.processedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await PdfDocument.countDocuments({
      $or: [
        { 'words.word': searchRegex },
        { content: searchRegex },
        { filename: searchRegex }
      ]
    });
    
    res.json({
      query: q,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pdfs/download/:filename - Descargar/ver PDF (DEBE IR ANTES DE /:id)
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Buscar el documento en la base de datos
    const document = await PdfDocument.findOne({ filename });
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    // Construir la ruta del archivo
    const filePath = path.join(process.env.DOWNLOADS_FOLDER || './downloads', filename);
    
    // Verificar que el archivo existe
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado en el servidor' });
    }
    
    // Obtener estadísticas del archivo
    const stats = await fs.stat(filePath);
    
    // Configurar headers para descarga/visualización
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Enviar el archivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error sirviendo PDF:', error);
    res.status(500).json({ error: 'Error al servir el archivo PDF' });
  }
});

// GET /api/pdfs/errors - Obtener documentos con errores
router.get('/errors', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const documents = await PdfDocument.find({ status: 'error' })
      .select('filename error createdAt metadata')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PdfDocument.countDocuments({ status: 'error' });
    
    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pdfs/stats/overview - Estadísticas de procesamiento
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await PdfDocument.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalWords = await PdfDocument.aggregate([
      {
        $unwind: '$words'
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: '$words.count' },
          uniqueWords: { $addToSet: '$words.word' }
        }
      }
    ]);
    
    res.json({
      statusStats: stats,
      wordStats: totalWords[0] || { totalWords: 0, uniqueWords: [] }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pdfs/:id - Obtener documento específico (DEBE IR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
router.get('/:id', async (req, res) => {
  try {
    const document = await PdfDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pdfs/process - Procesar todos los PDFs pendientes
router.post('/process', async (req, res) => {
  try {
    const results = await pdfProcessor.processAllPdfs();
    res.json({
      message: 'Procesamiento completado',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pdfs/process/:filename - Procesar un PDF específico
router.post('/process/:filename', async (req, res) => {
  try {
    const result = await pdfProcessor.processPdfFile(req.params.filename);
    res.json({
      message: 'PDF procesado exitosamente',
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 