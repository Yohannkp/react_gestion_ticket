# Backend TicketShop

Ce backend Express/MongoDB fournit une API REST pour une application mobile de billetterie (React Native).

## Fonctionnalités principales
- Authentification JWT (inscription, connexion)
- Gestion des utilisateurs
- Gestion des événements (CRUD)
- Achat de tickets
- Affichage des tickets de l'utilisateur

## Démarrage rapide

1. Installer les dépendances :
   ```powershell
   npm install
   ```
2. Créer un fichier `.env` à la racine avec :
   ```env
   MONGODB_URI=mongodb://localhost:27017/ticketshop
   JWT_SECRET=un_secret_tres_fort
   ```
3. Lancer le serveur :
   ```powershell
   node index.js
   ```

## Endpoints principaux
- POST /api/auth/register
- POST /api/auth/login
- GET /api/events
- POST /api/tickets/buy
- GET /api/tickets/my

Adaptez selon vos besoins.
