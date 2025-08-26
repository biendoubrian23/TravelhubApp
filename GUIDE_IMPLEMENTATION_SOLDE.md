# Guide d'Implémentation du Système de Solde Utilisateur

## 📁 Fichiers Créés

### 1. Base de Données
- **`src/database/add-balance-system.sql`** - Script SQL pour ajouter les colonnes et fonctions nécessaires

### 2. Services
- **`src/services/balanceService.js`** - Service pour gérer le solde utilisateur
- **`src/services/paymentService.js`** - Service pour les paiements avec solde

### 3. Composants
- **`src/components/BalanceCard.js`** - Composant pour afficher le solde
- **`src/screens/Profile/BalanceHistoryScreen.js`** - Écran d'historique du solde
- **`src/screens/Bookings/CancellationConfirmationScreen.js`** - Écran de confirmation d'annulation
- **`src/screens/Payment/PaymentMethodSelectionScreen.js`** - Sélection de mode de paiement

### 4. Stores
- **`src/store/index.js`** - Ajout du `useBalanceStore`

## 🗃️ Modifications de Base de Données

### Étapes d'exécution :

1. **Connectez-vous à votre interface Supabase**
2. **Allez dans l'éditeur SQL**
3. **Exécutez le script `add-balance-system.sql`**

### Ce qui sera ajouté :

#### Tables modifiées :
- **`users`** : ajout de la colonne `balance`
- **`bookings`** : ajout des colonnes `refund_amount` et `cancellation_fee`

#### Nouvelles tables :
- **`app_settings`** : paramètres globaux (frais d'annulation, etc.)
- **`balance_transactions`** : historique des transactions de solde

#### Fonctions PostgreSQL :
- **`handle_booking_cancellation()`** : gère automatiquement les remboursements
- **`process_payment_with_balance()`** : traite les paiements avec solde

## 🔧 Intégration dans l'App

### 1. Navigation

Ajoutez les nouveaux écrans dans votre fichier de navigation :

```javascript
// Dans votre Stack Navigator
<Stack.Screen 
  name="CancellationConfirmation" 
  component={CancellationConfirmationScreen} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="BalanceHistory" 
  component={BalanceHistoryScreen} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="PaymentMethodSelection" 
  component={PaymentMethodSelectionScreen} 
  options={{ headerShown: false }}
/>
```

### 2. Mise à jour du système de paiement existant

Dans votre écran de paiement actuel, remplacez la logique par :

```javascript
import { paymentService } from '../services/paymentService';

// Avant de traiter le paiement
const handlePayment = async () => {
  // Naviguer vers la sélection de méthode de paiement
  navigation.navigate('PaymentMethodSelection', {
    totalPrice: calculateTotalPrice(),
    bookingData: getBookingData()
  });
};
```

### 3. Mise à jour du ProfileScreen

Le composant `BalanceCard` a déjà été ajouté au ProfileScreen. Il affichera automatiquement le solde de l'utilisateur.

## 🔄 Workflow Utilisateur

### 1. Affichage du Solde
- Le solde apparaît dans la zone de profil
- Clic dessus → navigation vers l'historique des transactions

### 2. Nouvelle Réservation
1. Utilisateur sélectionne un trajet et des sièges
2. Sur l'écran de paiement → sélection de méthode
3. L'app propose automatiquement l'utilisation du solde
4. Paiement mixte si solde insuffisant

### 3. Annulation de Réservation
1. Clic sur "Annuler" dans les détails de réservation
2. → Navigation vers `CancellationConfirmationScreen`
3. Affichage des frais (30% par défaut)
4. Confirmation → remboursement automatique au solde

## ⚙️ Configuration

### Paramètres de Frais d'Annulation

Vous pouvez modifier le pourcentage de frais via la table `app_settings` :

```sql
UPDATE app_settings 
SET setting_value = '25' 
WHERE setting_key = 'cancellation_fee_percent';
```

### Ajout d'Autres Paramètres

```sql
INSERT INTO app_settings (setting_key, setting_value, description) 
VALUES ('max_balance_limit', '500000', 'Limite maximale du solde utilisateur en FCFA');
```

## 🧪 Tests Recommandés

### 1. Test du Système d'Annulation
```javascript
// 1. Créer une réservation
// 2. L'annuler via l'interface
// 3. Vérifier que le solde est crédité
// 4. Vérifier les montants dans la BD
```

### 2. Test du Paiement avec Solde
```javascript
// 1. Avoir un solde > 0
// 2. Faire une réservation
// 3. Vérifier que le solde est proposé
// 4. Confirmer le paiement mixte
```

### 3. Test de l'Historique
```javascript
// 1. Effectuer plusieurs transactions
// 2. Vérifier l'affichage dans BalanceHistoryScreen
// 3. Vérifier les calculs de totaux
```

## 🔍 Points d'Attention

### 1. Gestion des Erreurs
- Tous les services incluent une gestion d'erreur robuste
- Fallback vers les valeurs par défaut si la BD est inaccessible

### 2. Sécurité
- Les transactions utilisent les policies RLS de Supabase
- Validation côté serveur via les fonctions PostgreSQL

### 3. Performance
- Index ajoutés sur les colonnes importantes
- Utilisation de vues pour les requêtes complexes

### 4. UX/UI
- Indicateurs de chargement partout
- Messages d'erreur explicites
- Confirmation avant actions irréversibles

## 🚀 Étapes de Déploiement

1. **Exécuter le script SQL** dans Supabase
2. **Tester les nouvelles fonctions** en base
3. **Intégrer les écrans** dans la navigation
4. **Tester le workflow complet**
5. **Déployer** l'application

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console
2. Contrôlez que les colonnes ont été ajoutées en BD
3. Testez les fonctions PostgreSQL manuellement
4. Vérifiez les imports de services

## 🔮 Évolutions Futures

### Fonctionnalités à Considérer :
- **Transfert de solde** entre utilisateurs
- **Cashback** pour fidéliser
- **Limites de solde** par utilisateur
- **Historique détaillé** avec filtres
- **Notifications** sur changements de solde
