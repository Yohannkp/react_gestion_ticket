const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdAt: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  qrCode: { type: String },
});

ticketSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
