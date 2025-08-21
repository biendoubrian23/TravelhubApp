# Guide de Test du Système de Réservation 

## 🎯 Objectif

Ce guide vous aide à tester et déboguer le système de réservation de TravelHub, particulièrement l'intégration entre les tables `seat_maps` et `bookings` de Supabase.

## 🚀 Démarrage Rapide

1. **Démarrer l'application**
   ```bash
   npm start
   ```

2. **Accéder à l'écran de test**
   - Naviguez vers `RealtimeTestScreen` dans votre app

3. **Lancer le test automatisé**
   - Appuyez sur "🚀 Test Complet" pour un diagnostic complet

## 🔧 Tests Disponibles

### Test Complet (Recommandé)
- **Bouton**: 🚀 Test Complet
- **Fonction**: Valide l'ensemble du système automatiquement
- **Vérifie**: 
  - Connexion Supabase ✅
  - Valeurs enum `payment_status` acceptées ✅
  - Création de réservation complète ✅
  - Marquage des sièges comme occupés ✅

### Tests Individuels

1. **Tester Enums** - Valide les valeurs `payment_status` acceptées par la BD
2. **Lister Réservations** - Affiche toutes les réservations existantes
3. **Créer Réservation** - Test manuel de création de réservation
4. **État Sièges** - Vérifie quels sièges sont occupés/disponibles
5. **🧹 Nettoyer** - Supprime les données de test
6. **🗑️ Vider Log** - Efface l'affichage

## 🐞 Résolution de Problèmes

### ❌ Problème: "Enum payment_status invalide"
**Solutions**:
1. Lancer "Tester Enums" pour voir les valeurs acceptées
2. Vérifier que votre BD accepte: `['pending', 'completed', 'failed', 'refunded']`
3. Modifier le schéma Supabase si nécessaire

### ❌ Problème: "Sièges marqués mais pas de réservation en BD" 
**Solutions**:
1. Lancer "Test Complet" pour diagnostic
2. Vérifier les logs dans la console pour voir l'erreur exacte
3. Utiliser "Lister Réservations" pour confirmer

### ❌ Problème: "Aucun utilisateur connecté"
**Solutions**:
1. Vous connecter d'abord dans l'app
2. Vérifier la configuration Supabase Auth
3. L'écran affiche l'email de l'utilisateur connecté

## 📊 Interprétation des Résultats

### ✅ Test Réussi
```
✅ Succès: OUI
📋 Statuts valides: [pending, completed, failed, refunded]
🎫 ID Réservation: 123
💬 Message: Tous les tests sont passés!
```

### ⚠️ Problème Partiel
```
✅ Succès: NON
📋 Statuts valides: [pending, completed]
💬 Message: Réservation mock - vérifier la base de données
```
→ Les sièges sont marqués mais la réservation n'est pas sauvée

### ❌ Échec Complet
```
✅ Succès: NON
❌ Erreur: permission denied for table bookings
💬 Message: Test échoué - vérifier la configuration
```
→ Problème de permissions ou configuration Supabase

## 🛠️ Fichiers Importants

- `src/services/bookingService.js` - Logique de réservation
- `src/screens/RealtimeTestScreen.js` - Interface de test
- `src/tests/bookingSystemTest.js` - Script de test automatisé
- `src/services/supabaseClient.js` - Configuration Supabase

## 💡 Conseils

1. **Toujours nettoyer après les tests** avec le bouton 🧹
2. **Vérifier les logs de la console** pour plus de détails
3. **Tester avec un utilisateur réel connecté**
4. **Utiliser le test complet d'abord** pour un diagnostic rapide

## 📞 Support

Si les tests échouent systématiquement :
1. Vérifiez votre configuration `.env` Supabase
2. Confirmez que les tables `bookings` et `seat_maps` existent
3. Vérifiez les permissions RLS (Row Level Security)
4. Consultez les logs Supabase Dashboard

---

**Note**: Ce système de test est conçu pour diagnostiquer rapidement les problèmes d'intégration BD sans impacter les données de production.
