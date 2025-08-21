# Services de données réelles - TravelHub

## Vue d'ensemble

L'application TravelHub utilise maintenant des services connectés à la base de données Supabase pour récupérer les données réelles des trajets et des bus, remplaçant les données mockées.

## Services disponibles

### 1. tripService.js
Service principal pour la gestion des trajets.

**Fonctions principales :**
- `searchTrips(searchParams)` : Recherche des trajets selon les critères
- `getTripDetails(tripId)` : Récupère les détails d'un trajet spécifique
- `getOccupiedSeats(tripId)` : Récupère les sièges occupés pour un trajet
- `getBusSeatingLayout(busId)` : Récupère la configuration des sièges d'un bus
- `isSeatAvailable(tripId, seatNumber)` : Vérifie la disponibilité d'un siège
- `getPopularTrips(limit)` : Récupère les trajets populaires

### 2. busService.js
Service pour la gestion des bus et des sièges.

**Fonctions principales :**
- `getBusDetails(busId)` : Récupère les informations d'un bus
- `getBusesByAgency(agencyId)` : Récupère tous les bus d'une agence
- `getSeatConfiguration(busId)` : Récupère la configuration des sièges
- `getAvailableSeatsForTrip(tripId, busId)` : Récupère les sièges disponibles pour un trajet
- `generateDefaultSeatLayout(totalSeats, isVip)` : Génère une configuration par défaut
- `reserveSeatTemporarily(tripId, seatNumber, userId)` : Réservation temporaire
- `releaseTemporaryReservation(tripId, seatNumber, userId)` : Libère une réservation temporaire

### 3. bookingService.js
Service pour la gestion des réservations.

**Fonctions principales :**
- `createBooking(bookingData)` : Crée une nouvelle réservation
- `updatePaymentStatus(bookingId, paymentStatus)` : Met à jour le statut de paiement
- `getUserBookings(userId)` : Récupère les réservations d'un utilisateur
- `getBookingDetails(bookingId)` : Récupère les détails d'une réservation
- `cancelBooking(bookingId, reason)` : Annule une réservation
- `checkSeatAvailability(tripId, seatNumber)` : Vérifie la disponibilité d'un siège

## Utilisation

### Recherche de trajets

```javascript
import { tripService } from '../services/tripService'

const searchTrips = async () => {
  try {
    const trips = await tripService.searchTrips({
      departure: 'Yaoundé',
      arrival: 'Douala',
      date: '2025-08-22'
    })
    console.log('Trajets trouvés:', trips)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

### Récupération des sièges disponibles

```javascript
import { busService } from '../services/busService'

const loadSeats = async (tripId, busId) => {
  try {
    const seats = await busService.getAvailableSeatsForTrip(tripId, busId)
    console.log('Sièges disponibles:', seats)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

### Création d'une réservation

```javascript
import { bookingService } from '../services/bookingService'

const createReservation = async () => {
  try {
    const booking = await bookingService.createBooking({
      tripId: 'uuid-du-trajet',
      userId: 'uuid-de-l-utilisateur',
      seatNumber: 12,
      passengerName: 'John Doe',
      passengerPhone: '+237600000000',
      passengerEmail: 'john@example.com',
      totalPrice: 5000
    })
    console.log('Réservation créée:', booking)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

## Structure des données

### Format des trajets retournés

```javascript
{
  id: 'uuid',
  ville_depart: 'Yaoundé',
  ville_arrivee: 'Douala',
  date: '2025-08-22',
  heure_dep: '08:00',
  heure_arr: '11:30',
  prix: 5000,
  is_vip: true,
  bus_type: 'VIP',
  agencies: {
    nom: 'Express Voyageur',
    id: 'uuid'
  },
  bus_info: {
    id: 'uuid',
    name: 'Express 001',
    total_seats: 35,
    is_vip: true
  },
  available_seats: 25,
  total_seats: 35,
  occupied_seats: 10,
  amenities: ['wifi', 'climatisation', 'repas']
}
```

### Format des sièges

```javascript
{
  seat_number: 1,
  row_number: 1,
  seat_letter: 'A',
  seat_type: 'window', // 'window', 'aisle'
  is_vip: true,
  position: 'left', // 'left', 'right'
  is_available: true,
  is_occupied: false
}
```

## Configuration VIP vs Standard

### Bus VIP
- Configuration 1+2 (1 siège à gauche, 2 sièges à droite)
- Total généralement 35 sièges
- Sélection de siège obligatoire
- Prix plus élevé

### Bus Standard
- Configuration 2+2 (2 sièges de chaque côté)
- Total généralement 40 sièges
- Sélection de siège optionnelle
- Prix standard

## Gestion des erreurs

Tous les services incluent une gestion d'erreur robuste avec :
- Logs détaillés pour le debugging
- Messages d'erreur appropriés
- Fallback vers les données mockées si nécessaire

## Migration depuis les données mockées

1. Les services detectent automatiquement si les données réelles sont disponibles
2. En cas d'erreur de connexion, retour automatique aux données mockées
3. Interface utilisateur identique, seule la source de données change

## Performance

- Mise en cache automatique des configurations de sièges
- Requêtes optimisées avec sélection des champs nécessaires
- Pagination pour les listes importantes
- Cleanup automatique des réservations temporaires expirées
