const mongoose = require('mongoose');

const ragChunkSchema = new mongoose.Schema({
  document_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RAGDocument',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: [{
    type: Number
  }],
  chunk_index: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

ragChunkSchema.index({ document_id: 1, chunk_index: 1 });

module.exports = mongoose.model('RAGChunk', ragChunkSchema);
