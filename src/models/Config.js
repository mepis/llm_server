const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['server', 'database', 'auth', 'llama', 'tts', 'matrix', 'session', 'logging']
  }
}, {
  timestamps: true
});

configSchema.index({ category: 1 });

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
