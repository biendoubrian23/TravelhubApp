# Guide de Test du Système de Factures TravelHub

## 🎯 Objectif
Tester le système complet de génération automatique de factures PDF qui se créent à chaque réservation.

## 📋 Prérequis

### 1. Configuration Base de Données
```sql
-- Exécuter ce script dans Supabase SQL Editor :
-- src/database/setup-invoices-table.sql
```

### 2. Vérification des Modules
L'application doit démarrer sans erreurs de modules natifs. Si des erreurs persistent :
```bash
npx expo install expo-print expo-sharing expo-file-system
```

## 🧪 Plan de Test

### Phase 1 : Démarrage de l'Application ✅
1. **Test** : `npm start` puis ouvrir l'app
2. **Résultat Attendu** : Application se lance sans erreurs
3. **Status** : ✅ Validé

### Phase 2 : Navigation vers les Factures
1. **Test** : Aller dans Profil → Mes Factures
2. **Résultat Attendu** : Écran des factures s'affiche
3. **Vérifications** :
   - Message "Aucune facture disponible" si vide
   - Interface propre et responsive
   - Boutons fonctionnels

### Phase 3 : Création d'une Réservation
1. **Test** : Effectuer une réservation complète
2. **Étapes** :
   - Rechercher un voyage (ex: Yaoundé → Douala)
   - Sélectionner un bus et des sièges
   - Procéder au paiement
   - Valider la réservation
3. **Résultat Attendu** : Réservation créée avec succès

### Phase 4 : Génération Automatique de Facture
1. **Test** : Vérifier qu'une facture se crée automatiquement
2. **Points de Contrôle** :
   - Retourner dans Profil → Mes Factures
   - Une nouvelle facture doit apparaître
   - Vérifier les informations affichées
3. **Données à Valider** :
   - Numéro de facture (format FAC-24-XXXX)
   - Montant correct
   - Date d'émission
   - Statut "Payée"

### Phase 5 : Fonctionnalités des Factures
1. **Test Téléchargement** :
   - Cliquer sur "Télécharger" sur une facture
   - Vérifier la génération du PDF
   - Contrôler le contenu du PDF

2. **Test Statistiques** :
   - Vérifier l'affichage du total des factures
   - Contrôler le montant total

## 🐛 Gestion des Erreurs

### Si Modules Non Disponibles
- L'app affiche des messages d'information
- Les fonctionnalités restent accessibles
- Pas de crash de l'application

### Si Erreurs de PDF
- Vérifier que les modules sont installés
- Redémarrer le serveur de développement
- Tester sur un build de développement

## 📊 Critères de Succès

### ✅ Critères Essentiels
- [ ] Application démarre sans erreur
- [ ] Navigation vers écran factures fonctionne
- [ ] Facture se crée automatiquement après réservation
- [ ] Informations de facture correctes

### 🎯 Critères Avancés
- [ ] PDF se génère et s'affiche correctement
- [ ] Téléchargement fonctionne
- [ ] Statistiques sont justes
- [ ] Interface responsive et fluide

## 🔧 Debugging

### Logs à Surveiller
```javascript
// Dans la console de développement
console.log('🔍 InvoiceService:', invoiceService);
console.log('📄 Création facture:', invoice);
console.log('✅ PDF généré:', filePath);
```

### Base de Données
Vérifier dans Supabase :
```sql
-- Voir toutes les factures
SELECT * FROM invoices ORDER BY created_at DESC;

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'invoices';
```

## 📝 Rapport de Test

### Template de Rapport
```
# Test Système Factures - [Date]

## Environnement
- Device: [Android/iOS/Web]
- Version Expo: [XX.X.X]
- Modules PDF: [Disponibles/Non disponibles]

## Résultats
### Phase 1 - Démarrage : [✅/❌]
### Phase 2 - Navigation : [✅/❌]
### Phase 3 - Réservation : [✅/❌]
### Phase 4 - Génération Facture : [✅/❌]
### Phase 5 - Fonctionnalités : [✅/❌]

## Problèmes Rencontrés
[Description des erreurs]

## Recommandations
[Actions à prendre]
```

## 🚀 Prochaines Étapes

1. **Si Tests OK** : Système prêt pour production
2. **Si Erreurs PDF** : Configurer build de développement
3. **Si Erreurs DB** : Vérifier configuration Supabase
4. **Optimisations** : Améliorer performance et UX
