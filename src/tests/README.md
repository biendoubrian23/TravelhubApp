# Tests et Scripts de Test

Ce dossier contient tous les scripts de test et les utilitaires de développement.

## Tests d'authentification
- `test-auth.js` - Tests des fonctionnalités d'authentification
- `test-supabase.js` - Tests généraux de Supabase
- `test-db.js` - Tests de base de données

## Scripts de création d'utilisateurs
- `create-user.js` - Script principal de création d'utilisateurs
- `create-user-simple.js` - Version simplifiée pour création d'utilisateurs

## Utilisation
```bash
# Pour exécuter un test
node src/tests/test-auth.js

# Pour créer un utilisateur de test
node src/tests/create-user.js
```

## Prérequis
Assurez-vous que vos variables d'environnement sont configurées dans le fichier `.env` avant d'exécuter ces scripts.
