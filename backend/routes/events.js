const express = require('express');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');
const router = express.Router();

// Liste des événements (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json({ events });
});

// Création d’un événement (protégé)
router.post('/', auth, async (req, res) => {
  const { name, date, price } = req.body; // Ajout du prix
  try {
    const event = new Event({ name, date, price }); // Ajout du prix
    await event.save();
    res.status(201).json({ event });
  } catch (err) {
    res.status(400).json({ message: 'Erreur lors de la création', error: err.message });
  }
});

// Suppression d’un événement (admin uniquement)
router.delete('/:id', auth, async (req, res) => {
  // Pour l'exemple, on considère que le premier utilisateur créé est admin
  if (req.user.username !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  try {
    // Supprimer les tickets liés à cet événement
    await Ticket.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Événement supprimé' });
  } catch (err) {
    res.status(400).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
});

// Modification d’un événement (admin uniquement)
router.put('/:id', auth, async (req, res) => {
  if (req.user.username !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  const { name, date, price } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement introuvable' });
    if (name !== undefined) event.name = name;
    if (date !== undefined) event.date = date;
    if (price !== undefined) event.price = price;
    await event.save();
    res.json({ event });
  } catch (err) {
    res.status(400).json({ message: 'Erreur lors de la modification', error: err.message });
  }
});

module.exports = router;
