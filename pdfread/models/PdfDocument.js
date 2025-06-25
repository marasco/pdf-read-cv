const mongoose = require('mongoose');

const pdfDocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalPath: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: false
  },
  words: [{
    word: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 1
    },
    positions: [{
      page: Number,
      position: Number
    }]
  }],
  metadata: {
    pages: Number,
    fileSize: Number,
    createdAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending'
  },
  error: String
}, {
  timestamps: true
});

// Índice para búsquedas por palabras
pdfDocumentSchema.index({ 'words.word': 1 });
pdfDocumentSchema.index({ filename: 1 });
pdfDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('PdfDocument', pdfDocumentSchema); 