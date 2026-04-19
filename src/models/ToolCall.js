const mongoose = require('mongoose');

const toolCallSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
    },
    message_id: {
      type: String,
      required: true,
    },
    tool_call_id: {
      type: String,
      required: true,
    },
    tool_name: {
      type: String,
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    state: {
      type: String,
      enum: ['pending', 'running', 'completed', 'error'],
      default: 'pending',
    },
    output: {
      type: String,
      default: '',
    },
    error: {
      type: String,
    },
    title: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

toolCallSchema.index({ session_id: 1, message_id: 1 });
toolCallSchema.index({ tool_call_id: 1 });

const ToolCall = mongoose.model('ToolCall', toolCallSchema);

module.exports = ToolCall;
