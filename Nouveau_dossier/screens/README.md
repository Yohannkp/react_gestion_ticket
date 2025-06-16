# Dossier `screens`

Ce dossier contient tous les écrans principaux de l’application mobile TicketShopApp (Expo/React Native).
Chaque écran est séparé dans un fichier pour une meilleure organisation et maintenabilité.

## Structure

- `LoginScreen.js` : Écran de connexion utilisateur
- `RegisterScreen.js` : Écran d’inscription
- `EventsScreen.js` : Liste des événements (achat, marquage, recherche)
- `TicketsScreen.js` : Liste des tickets achetés par l’utilisateur
- `AdminScreen.js` : Gestion des événements (admin)
- `ProfileScreen.js` : Profil utilisateur et changement de mot de passe
- `HomeScreen.js` : Accueil personnalisé/dashboard
- `OnboardingScreen.js` : Tutoriel interactif de démarrage

## Bonnes pratiques
- Chaque écran importe les contextes, hooks et styles nécessaires depuis `../App.js`.
- Les composants sont exportés par défaut (`export default`).
- Pour ajouter un nouvel écran, créez un fichier dans ce dossier et ajoutez l’import dans `App.js`.

---

© 2025 – TicketShopApp
