const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // Correction de l'import pour le modèle User
const auth = require('../middleware/auth');
const sendExpoNotification = require('../utils/sendExpoNotification');
const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  const { username, password } = req.body; // Suppression de l'email
  if (!username || !password) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
    }
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé' });
  } catch (err) {
    res.status(400).json({ message: 'Erreur lors de l\'inscription', error: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Enregistrement du token push Expo
router.post('/push-token', auth, async (req, res) => {
  const userId = req.user.id;
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ message: 'pushToken manquant' });
  try {
    await User.findByIdAndUpdate(userId, { pushToken });
    res.json({ message: 'Push token enregistré' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Exemple: route pour tester l'envoi d'une notification à l'utilisateur connecté
router.post('/test-notification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.pushToken) return res.status(400).json({ message: 'Aucun pushToken enregistré pour cet utilisateur.' });
    const { title = 'Test', body = 'Ceci est une notification test', data = {} } = req.body;
    const result = await sendExpoNotification(user.pushToken, title, body, data);
    res.json({ message: 'Notification envoyée', result });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la notification', error: err.message });
  }
});

// Changement de mot de passe
router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Mot de passe modifié !' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
