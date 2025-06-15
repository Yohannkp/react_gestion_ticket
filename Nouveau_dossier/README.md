# TicketShopApp – Application mobile Expo React Native

Application mobile moderne de billetterie (Ticketshop) développée avec Expo/React Native.
Permet d’acheter, stocker et présenter des billets pour des événements, avec notifications push, onboarding, et interface accessible et professionnelle.

## Fonctionnalités principales
- Liste d’événements avec marquage des billets déjà achetés
- Achat de billets (paiement fictif)
- Gestion des billets (affichage, suppression)
- Notifications push lors de l’achat
- Onboarding/tutoriel interactif
- Interface moderne, accessible et animée
- Espace profil utilisateur (modification mot de passe, etc.)
- Espace admin (gestion des événements)

## Prérequis
- Node.js >= 18
- npm >= 9
- Expo CLI (`npm install -g expo-cli`)
- Expo Go (application mobile pour tester)
- Accès au backend Node/Express/MongoDB (voir dossier `../backend`)

## Installation
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Lancer le serveur Expo :
   ```bash
   npm start
   # ou
   npx expo start
   ```
3. Scanner le QR code avec Expo Go (sur le même réseau Wi-Fi)

## Connexion au backend
- Par défaut, l’URL du backend est à configurer dans le code (ex: `utils/api.js` ou `.env`).
- Le backend doit être lancé séparément (voir `../backend/README.md`).

## Structure du projet
- `App.js` : point d’entrée principal
- `assets/` : icônes, images, splash
- `components/` : composants réutilisables (modals, banners, etc.)
- `screens/` : écrans principaux (Tickets, Events, Home, Profile, Admin, Onboarding)
- `utils/` : fonctions utilitaires (API, notifications, etc.)

## Commandes utiles
- `npm start` / `npx expo start` : serveur Expo
- `npm run android` : lancer sur un émulateur Android
- `npm run ios` : lancer sur un simulateur iOS (Mac)
- `npm run web` : lancer en mode web

## Personnalisation
Ajoutez vos écrans, navigation et logique métier dans ce projet. Voir les exemples dans `screens/` et `components/`.

## Dépannage
- Si l’application ne se connecte pas au backend, vérifiez l’URL et que le backend est bien lancé.
- Pour les notifications push, testez sur un vrai appareil (Expo Go).
- Pour toute erreur, consultez la console Expo et le terminal backend.

---

© 2025 – TicketShopApp
