const mongoose = require('mongoose');

// Correction : évite l'erreur OverwriteModelError en réutilisant le modèle s'il existe déjà
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
