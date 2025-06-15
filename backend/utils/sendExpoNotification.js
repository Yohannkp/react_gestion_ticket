// backend/utils/sendExpoNotification.js
const fetch = require('node-fetch');

/**
 * Envoie une notification push Expo à un utilisateur
 * @param {string} pushToken - Le token Expo Push de l'utilisateur
 * @param {string} title - Titre de la notification
 * @param {string} body - Corps du message
 * @param {object} [data] - Données additionnelles (optionnel)
 * @returns {Promise<object>} Résultat de l'appel à l'API Expo
 */
async function sendExpoNotification(pushToken, title, body, data = {}) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    throw new Error('Token Expo Push invalide');
  }
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  return response.json();
}

module.exports = sendExpoNotification;
