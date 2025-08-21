# Guide de Déploiement TravelHub

## 1. Configuration Supabase

### Base de données
1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'onglet "SQL Editor"
3. Exécutez le contenu du fichier `supabase-schema.sql`
4. Vérifiez que toutes les tables sont créées

### Authentification
1. Allez dans "Authentication" > "Settings"
2. Activez "Enable email confirmations" si souhaité
3. Configurez les URLs de redirection pour l'app mobile
4. Pour Google OAuth :
   - Allez dans "Authentication" > "Providers"
   - Activez Google
   - Ajoutez vos Client ID et Client Secret

### Row Level Security
- Toutes les politiques RLS sont déjà configurées dans le schema
- Vérifiez qu'elles sont actives dans "Authentication" > "Policies"

## 2. Configuration Stripe

1. Créez un compte Stripe (ou utilisez un existant)
2. Récupérez vos clés API dans le dashboard Stripe
3. Ajoutez la clé publique dans `.env` :
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

## 3. Configuration Orange Money

1. Contactez Orange Cameroun pour obtenir les accès API
2. Obtenez vos identifiants API
3. Ajoutez la clé dans `.env` :
   ```
   EXPO_PUBLIC_ORANGE_MONEY_API_KEY=your_api_key
   ```

## 4. Build et Déploiement

### Build de développement
```bash
# Démarrer le serveur de développement
npm start

# Pour Android
npm run android

# Pour iOS (Mac seulement)
npm run ios

# Pour le web
npm run web
```

### Build de production

#### Android (APK)
```bash
# Build APK
eas build --platform android --profile production

# Ou build local
expo build:android
```

#### iOS (IPA)
```bash
# Build iOS (nécessite un Mac et un compte Apple Developer)
eas build --platform ios --profile production
```

#### Web
```bash
# Build web
expo export:web

# Déployer sur un service comme Netlify, Vercel, etc.
```

## 5. Publication sur les Stores

### Google Play Store
1. Créez un compte Google Play Console
2. Uploadez l'APK signé
3. Remplissez les informations de l'app
4. Soumettez pour review

### Apple App Store
1. Créez un compte Apple Developer
2. Utilisez Xcode ou Transporter pour uploader l'IPA
3. Configurez l'app dans App Store Connect
4. Soumettez pour review

## 6. Variables d'Environnement

Créez un fichier `.env` avec :
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_ORANGE_MONEY_API_KEY=votre_api_key
```

## 7. Monitoring et Analytics

### Supabase Dashboard
- Surveillez les métriques de la base de données
- Vérifiez les logs d'authentification
- Surveillez l'utilisation de l'API

### Expo Analytics
- Utilisez Expo Analytics pour le suivi des erreurs
- Configurez les notifications push avec Expo

### Sentry (Optionnel)
```bash
npm install @sentry/react-native
```

## 8. Maintenance

### Updates OTA (Over-The-Air)
```bash
# Publier une mise à jour OTA
expo publish
```

### Monitoring des erreurs
- Surveillez les logs Supabase
- Vérifiez les rapports de crash sur les stores
- Utilisez Flipper pour le debug en développement

## 9. Sécurité

### Clés API
- Ne jamais commiter les clés de production
- Utilisez des clés de test en développement
- Rotez régulièrement les clés API

### Base de données
- Vérifiez régulièrement les politiques RLS
- Surveillez les tentatives d'accès non autorisées
- Faites des sauvegardes régulières

### Authentification
- Configurez des mots de passe forts obligatoires
- Activez la 2FA pour les comptes admin
- Surveillez les tentatives de connexion suspectes

## 10. Performance

### Optimisations
- Utilisez React.memo pour les composants
- Implémentez la pagination pour les listes
- Optimisez les images avec Expo ImageOptim
- Utilisez les hooks useCallback et useMemo

### Monitoring
- Surveillez les temps de réponse API
- Optimisez les requêtes SQL
- Utilisez le cache pour les données statiques

## Support

Pour toute question technique :
- Documentation Expo : https://docs.expo.dev/
- Documentation Supabase : https://supabase.com/docs
- Documentation React Navigation : https://reactnavigation.org/

Bon déploiement ! 🚀
