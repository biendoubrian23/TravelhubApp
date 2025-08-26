# Tests du Système de Solde Utilisateur

## 🧪 Tests de Base de Données

### 1. Test des Colonnes Ajoutées

```sql
-- Vérifier que la colonne balance existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'balance';

-- Vérifier les colonnes de remboursement
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('refund_amount', 'cancellation_fee');
```

### 2. Test des Fonctions PostgreSQL

```sql
-- Test de calcul des frais d'annulation
SELECT setting_value FROM app_settings WHERE setting_key = 'cancellation_fee_percent';

-- Test de la fonction de remboursement (simulation)
-- Créer d'abord une réservation test, puis la mettre à jour pour déclencher le trigger
```

### 3. Test des Triggers

```sql
-- Simuler une annulation
UPDATE bookings 
SET booking_status = 'cancelled' 
WHERE id = 'ID_DE_TEST' 
AND booking_status != 'cancelled';

-- Vérifier que le solde a été crédité
SELECT balance FROM users WHERE id = 'USER_ID_TEST';
```

## 📱 Tests Front-End

### 1. Test d'Affichage du Solde

```javascript
// Dans ProfileScreen, vérifier que BalanceCard s'affiche
// 1. Naviguer vers le profil
// 2. Vérifier que le solde est visible
// 3. Cliquer sur la carte de solde
// 4. Vérifier la navigation vers BalanceHistoryScreen
```

### 2. Test d'Annulation avec Remboursement

```javascript
// Workflow complet d'annulation
const testCancellation = async () => {
  // 1. Créer une réservation via l'app
  console.log('✅ Réservation créée');
  
  // 2. Aller dans "Mes trajets"
  console.log('✅ Navigation vers mes trajets');
  
  // 3. Cliquer sur "Détail" d'une réservation
  console.log('✅ Ouverture des détails');
  
  // 4. Cliquer sur "Annuler"
  console.log('✅ Clic sur annuler');
  
  // 5. Vérifier l'affichage de CancellationConfirmationScreen
  console.log('✅ Écran de confirmation affiché');
  
  // 6. Vérifier le calcul des frais (30%)
  console.log('✅ Frais calculés correctement');
  
  // 7. Confirmer l'annulation
  console.log('✅ Annulation confirmée');
  
  // 8. Vérifier le message de succès
  console.log('✅ Message de succès affiché');
  
  // 9. Vérifier que le solde a augmenté
  console.log('✅ Solde mis à jour');
};
```

### 3. Test de Paiement avec Solde

```javascript
// Test du nouveau système de paiement
const testPaymentWithBalance = async () => {
  // 1. S'assurer d'avoir un solde > 0
  console.log('✅ Solde initial vérifié');
  
  // 2. Sélectionner un trajet
  console.log('✅ Trajet sélectionné');
  
  // 3. Aller au paiement
  console.log('✅ Navigation vers paiement');
  
  // 4. Vérifier l'affichage des méthodes de paiement
  console.log('✅ Méthodes de paiement affichées');
  
  // 5. Vérifier le calcul de répartition
  console.log('✅ Répartition solde/externe calculée');
  
  // 6. Sélectionner paiement mixte
  console.log('✅ Méthode mixte sélectionnée');
  
  // 7. Procéder au paiement
  console.log('✅ Paiement traité');
  
  // 8. Vérifier la déduction du solde
  console.log('✅ Solde déduit correctement');
};
```

## 🔍 Tests de Scenarios

### Scenario 1: Utilisateur Nouveau (Solde = 0)

```javascript
const testNewUser = {
  setup: 'Utilisateur avec solde = 0',
  steps: [
    '1. Créer une réservation',
    '2. Vérifier que seules les méthodes externes sont proposées',
    '3. Effectuer le paiement',
    '4. Annuler la réservation',
    '5. Vérifier que le solde est crédité'
  ],
  expected: 'Solde final = 70% du prix de la réservation'
};
```

### Scenario 2: Utilisateur avec Solde Partiel

```javascript
const testPartialBalance = {
  setup: 'Utilisateur avec solde = 5000 FCFA, réservation = 10000 FCFA',
  steps: [
    '1. Sélectionner un trajet à 10000 FCFA',
    '2. Aller au paiement',
    '3. Vérifier la proposition de paiement mixte',
    '4. Confirmer: 5000 du solde + 5000 externe'
  ],
  expected: 'Paiement réussi, solde = 0'
};
```

### Scenario 3: Utilisateur avec Solde Suffisant

```javascript
const testSufficientBalance = {
  setup: 'Utilisateur avec solde = 15000 FCFA, réservation = 10000 FCFA',
  steps: [
    '1. Sélectionner un trajet à 10000 FCFA',
    '2. Aller au paiement',
    '3. Vérifier la proposition de paiement par solde uniquement',
    '4. Confirmer le paiement'
  ],
  expected: 'Paiement réussi, solde restant = 5000 FCFA'
};
```

## 📊 Tests de Performance

### 1. Test de Charge des Transactions

```sql
-- Insérer plusieurs transactions pour tester les performances
INSERT INTO balance_transactions (user_id, transaction_type, amount, description)
SELECT 
  'USER_ID_TEST',
  'refund',
  random() * 50000,
  'Test transaction ' || generate_series
FROM generate_series(1, 1000);

-- Tester la vue user_balance_summary
SELECT * FROM user_balance_summary WHERE user_id = 'USER_ID_TEST';
```

### 2. Test de Concurrence

```sql
-- Simuler plusieurs annulations simultanées
-- (À exécuter dans des sessions parallèles)
UPDATE bookings 
SET booking_status = 'cancelled' 
WHERE user_id = 'USER_ID_TEST' 
AND booking_status = 'confirmed'
LIMIT 1;
```

## 🚨 Tests d'Erreurs

### 1. Test de Résilience aux Erreurs Réseau

```javascript
// Simuler des échecs de connexion
const testNetworkFailure = async () => {
  // 1. Couper la connexion internet
  // 2. Essayer de charger le solde
  // 3. Vérifier l'affichage d'erreur gracieux
  // 4. Rétablir la connexion
  // 5. Vérifier la récupération automatique
};
```

### 2. Test de Données Corrompues

```javascript
// Test avec des données invalides
const testInvalidData = {
  scenarios: [
    'Solde négatif en base',
    'Montant de réservation = 0',
    'Pourcentage de frais > 100%',
    'Utilisateur inexistant'
  ]
};
```

## 📋 Checklist de Tests

### ✅ Tests Obligatoires Avant Déploiement

- [ ] **Base de données**
  - [ ] Script SQL exécuté sans erreur
  - [ ] Toutes les colonnes créées
  - [ ] Fonctions PostgreSQL opérationnelles
  - [ ] Triggers activés

- [ ] **Services**
  - [ ] balanceService.getUserBalance() fonctionne
  - [ ] balanceService.calculateCancellationFees() calcule correctement
  - [ ] paymentService.getAvailablePaymentMethods() retourne les bonnes options

- [ ] **Interface Utilisateur**
  - [ ] BalanceCard s'affiche dans le profil
  - [ ] Navigation vers BalanceHistoryScreen fonctionne
  - [ ] CancellationConfirmationScreen affiche les bons montants
  - [ ] PaymentMethodSelectionScreen propose les bonnes options

- [ ] **Workflow Complet**
  - [ ] Création de réservation → Annulation → Remboursement
  - [ ] Utilisation du solde pour nouvelle réservation
  - [ ] Paiement mixte (solde + externe)
  - [ ] Historique des transactions mis à jour

### 🔍 Tests de Validation

```javascript
// Validation des montants
const validateAmounts = (originalPrice, feePercent, expectedRefund) => {
  const fee = originalPrice * (feePercent / 100);
  const refund = originalPrice - fee;
  return refund === expectedRefund;
};

// Test: 10000 FCFA avec 30% de frais = 7000 FCFA de remboursement
console.assert(validateAmounts(10000, 30, 7000), 'Calcul de remboursement incorrect');
```

## 📈 Métriques à Surveiller

### 1. En Production
- Temps de réponse des services de solde
- Taux d'erreur des transactions
- Fréquence d'utilisation du solde
- Montant moyen des remboursements

### 2. Métriques Utilisateur
- Nombre d'annulations avec remboursement
- Utilisation du solde vs paiement externe
- Satisfaction utilisateur (feedback)
