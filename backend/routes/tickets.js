const express = require('express');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const sendExpoNotification = require('../utils/sendExpoNotification');

// Acheter un ticket pour un événement
router.post('/buy', auth, async (req, res) => {
  const { eventId } = req.body;
  try {
    // Vérifier si l'utilisateur a déjà un ticket pour cet événement
    const existingTicket = await Ticket.findOne({ user: req.user.id, event: eventId });
    if (existingTicket) {
      return res.status(400).json({ message: 'Vous avez déjà un ticket pour cet événement.' });
    }
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    // Générer le QR code (données simples : id du ticket + user)
    const qrData = `${req.user.id}|${event._id}|${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);
    // Créer le ticket
    const ticket = new Ticket({ user: req.user.id, event: event._id, qrCode });
    await ticket.save();
    // S'assurer que le dossier public existe
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    // Générer le PDF
    const pdfPath = path.join(publicDir, `ticket_${ticket._id}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text('Ticket pour ' + event.name);
    doc.text('Date : ' + event.date);
    doc.text('Utilisateur : ' + req.user.username);
    doc.text('Ticket ID : ' + ticket._id);
    doc.image(Buffer.from(qrCode.split(",")[1], 'base64'), { fit: [150, 150] });
    doc.end();
    // Stocker l'URL du PDF
    ticket.pdfUrl = `/api/tickets/pdf/${ticket._id}`;
    await ticket.save();
    // NOTIFICATION PUSH (si pushToken dispo)
    try {
      const user = await User.findById(req.user.id);
      if (user && user.pushToken) {
        await sendExpoNotification(
          user.pushToken,
          'Ticket acheté',
          `Votre ticket pour "${event.name}" a été généré !`,
          { eventId: event._id, ticketId: ticket._id }
        );
      }
    } catch (e) {
      console.warn('Erreur notification push:', e);
    }
    res.status(201).json({ ticket });
  } catch (err) {
    // Gestion de l'erreur de duplication (index unique)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Vous avez déjà un ticket pour cet événement.' });
    }
    res.status(400).json({ message: 'Erreur lors de l’achat', error: err.message });
  }
});

// Servir le PDF du ticket
router.get('/pdf/:ticketId', async (req, res, next) => {
  // Accepte le token en header Authorization OU en query string
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  // Vérification du token (copie de la logique du middleware auth)
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
  req.user = await User.findById(decoded.id);
  if (!req.user) return res.status(401).json({ message: 'Utilisateur non trouvé' });
  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé' });
  const pdfPath = path.join(__dirname, '../public', `ticket_${ticket._id}.pdf`);
  if (!fs.existsSync(pdfPath)) return res.status(404).json({ message: 'PDF non généré' });
  res.sendFile(pdfPath);
});

// Voir ses tickets
router.get('/my', auth, async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id }).populate('event');
  res.json({ tickets: tickets
    .filter(t => t.event) // Ignore tickets whose event is missing (deleted)
    .map(t => ({
      id: t._id,
      eventName: t.event.name,
      eventDate: t.event.date,
      createdAt: t.createdAt,
      pdfUrl: t.pdfUrl,
      qrCode: t.qrCode,
    })) });
});

module.exports = router;
