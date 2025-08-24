# Modification de la sélection de sièges pour tous les types de transport

## Résumé des modifications
Cette modification permet maintenant à tous les types de transport (classique, premium, VIP) d'avoir une sélection de sièges, et non plus seulement les transports VIP.

## Fichiers modifiés

### 1. `SeatSelectionScreen.js`
- **Suppression de la condition `!currentTripIsVip`** qui bloquait l'affichage des sièges pour les transports non-VIP
- **Modification de la logique de chargement des sièges** pour inclure tous les types de bus :
  - Bus VIP : utilise `getVipSeatDisplayLayout()`
  - Bus standard/premium : utilise `getAvailableSeatsForTrip()`
- **Mise à jour du commentaire** pour indiquer que tous les trajets peuvent avoir une sélection de sièges
- **Simplification de l'interface** : tous les transports utilisent maintenant la même interface de sélection

### 2. `busService.js`
- **Ajout de la fonction `getAvailableSeatsForTrip()`** pour récupérer tous les sièges d'un trajet
- **Ajout de la fonction `getVipSeatDisplayLayout()`** généralisée pour tous types de sièges
- **Support complet de la table `seat_maps`** avec organisation par rangées et colonnes

### 3. `ResultsScreen.js`
- **Modification de `handleTripSelect()`** pour rediriger tous les types de transport vers la sélection de sièges
- **Suppression de la logique conditionnelle** basée sur `trip.is_vip`
- **Simplification du flux** : aller-retour et trajet simple utilisent la même logique

### 4. Base de données
- **Création du script `populate-all-seat-types.sql`** qui génère des sièges pour tous les types de bus :
  - Bus classique : 45 places (5 colonnes × 9 rangées), sièges type "standard"
  - Bus premium : 40 places (4 colonnes × 10 rangées), sièges type "premium"  
  - Bus VIP : 35 places (5 colonnes × 7 rangées), sièges type "vip"

## Configuration des sièges par type de bus

### Bus Classique
- **45 sièges** : configuration 5 colonnes (A, B, C, D, E) × 9 rangées
- **Type de siège** : "standard"
- **Supplément** : 200 FCFA pour les sièges fenêtre (A, E), 0 FCFA pour les autres

### Bus Premium  
- **40 sièges** : configuration 4 colonnes (A, B, C, D) × 10 rangées
- **Type de siège** : "premium"
- **Supplément** : 500 FCFA pour les sièges fenêtre (A, D), 200 FCFA pour les autres

### Bus VIP
- **35 sièges** : configuration 5 colonnes (A, B, C, D, E) × 7 rangées
- **Type de siège** : "vip"
- **Supplément** : 1000 FCFA pour les sièges fenêtre (A, E), 1500 FCFA pour le siège central (C), 700 FCFA pour les autres

## Comportement de l'application

### Avant les modifications
- Seuls les transports VIP permettaient la sélection de sièges
- Les transports standard/classique redirigaient directement vers le récapitulatif
- Interface différente selon le type de transport

### Après les modifications
- **Tous les types de transport** permettent la sélection de sièges
- **Interface unifiée** pour tous les types de bus
- **Différenciation visuelle** des sièges selon leur type (standard, premium, VIP)
- **Calcul du prix** avec suppléments selon le type et la position du siège

## Vérifications à effectuer

1. **Test avec bus classique** : vérifier que les sièges s'affichent correctement
2. **Test avec bus premium** : vérifier la configuration 4 colonnes
3. **Test avec bus VIP** : vérifier que la fonctionnalité existante continue de marcher
4. **Test aller-retour** : vérifier que la sélection fonctionne pour les deux trajets
5. **Test des prix** : vérifier que les suppléments s'appliquent correctement selon le type de siège

## Script SQL à exécuter

Pour peupler la base de données avec les nouveaux sièges :
```bash
# Exécuter le script dans Supabase ou votre base PostgreSQL
psql -f src/database/populate-all-seat-types.sql
```

Ce script va :
- Supprimer tous les sièges existants
- Créer des sièges pour tous les trajets selon leur type de bus
- Afficher des statistiques de vérification
