# API Documentation - TravelHub

## 📋 Vue d'ensemble

TravelHub utilise Supabase comme backend, offrant une API REST automatique avec authentification intégrée et sécurité au niveau des lignes (RLS).

## 🔐 Authentification

### Inscription
```javascript
import { authService } from './src/services/supabase'

const { data, error } = await authService.signUp(
  'user@example.com',
  'password123',
  {
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '+237123456789',
    role: 'client' // ou 'agence'
  }
)
```


### Connexion
```javascript
const { data, error } = await authService.signIn(
  'user@example.com',
  'password123'
)
```

### Connexion Google
```javascript
const { data, error } = await authService.signInWithGoogle()
```

## 🚌 Gestion des Trajets

### Rechercher des trajets
```javascript
import { tripService } from './src/services/supabase'

const { data, error } = await tripService.searchTrips(
  'Douala',      // Ville de départ
  'Yaoundé',     // Ville d'arrivée
  '2024-03-15'   // Date (YYYY-MM-DD)
)
```

### Obtenir les détails d'un trajet
```javascript
const { data, error } = await tripService.getTripById('trip-uuid')
```

### Créer un trajet (agences uniquement)
```javascript
const tripData = {
  agency_id: 'agency-uuid',
  ville_depart: 'Douala',
  ville_arrivee: 'Yaoundé',
  date: '2024-03-15',
  heure_dep: '08:00',
  heure_arr: '13:30',
  prix: 3500,
  is_vip: false,
  places_total: 50,
  places_disponibles: 50
}

const { data, error } = await tripService.createTrip(tripData)
```

## 🎫 Gestion des Réservations

### Créer une réservation
```javascript
import { bookingService } from './src/services/supabase'

const bookingData = {
  user_id: 'user-uuid',
  trip_id: 'trip-uuid',
  seat_numbers: [12, 13], // Numéros de sièges
  nombre_passagers: 2,
  prix_total: 7000,
  payment_method: 'stripe' // ou 'orange_money'
}

const { data, error } = await bookingService.createBooking(bookingData)
```

### Obtenir les réservations d'un utilisateur
```javascript
const { data, error } = await bookingService.getUserBookings('user-uuid')
```

## 🏢 Gestion des Agences

### Obtenir une agence par utilisateur
```javascript
import { agencyService } from './src/services/supabase'

const { data, error } = await agencyService.getAgencyByUserId('user-uuid')
```

### Créer une agence
```javascript
const agencyData = {
  user_id: 'user-uuid',
  nom: 'Transport Express',
  description: 'Votre partenaire de voyage',
  telephone: '+237123456789',
  email: 'contact@transport.cm',
  ville: 'Douala'
}

const { data, error } = await agencyService.createAgency(agencyData)
```

## 📊 Structure des Données

### Profile (Utilisateur)
```typescript
interface Profile {
  id: string;           // UUID de l'utilisateur
  nom: string;          // Nom de famille
  prenom: string;       // Prénom
  telephone: string;    // Numéro de téléphone
  role: 'client' | 'agence';
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
}
```

### Trip (Trajet)
```typescript
interface Trip {
  id: string;                    // UUID du trajet
  agency_id: string;             // UUID de l'agence
  ville_depart: string;          // Ville de départ
  ville_arrivee: string;         // Ville d'arrivée
  date: string;                  // Date (YYYY-MM-DD)
  heure_dep: string;             // Heure de départ (HH:MM)
  heure_arr: string;             // Heure d'arrivée (HH:MM)
  prix: number;                  // Prix en FCFA
  is_vip: boolean;               // Trajet VIP ou classique
  places_total: number;          // Nombre total de places
  places_disponibles: number;    // Places disponibles
  status: 'active' | 'cancelled' | 'completed';
  agencies?: Agency;             // Données de l'agence (jointure)
  trip_services?: TripService[]; // Services du trajet (jointure)
}
```

### TripService (Services du trajet)
```typescript
interface TripService {
  id: string;
  trip_id: string;
  wifi: boolean;
  repas: boolean;
  clim: boolean;
  usb: boolean;
  films: boolean;
  toilettes: boolean;
  sieges_inclinables: boolean;
  espace_jambes: boolean;
}
```

### Booking (Réservation)
```typescript
interface Booking {
  id: string;
  user_id: string;
  trip_id: string;
  seat_numbers: number[];        // Numéros de sièges réservés
  nombre_passagers: number;
  prix_total: number;            // Prix total en FCFA
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_method: 'stripe' | 'orange_money' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  booking_reference: string;     // Référence unique (ex: TH1234567890)
  created_at: string;
  updated_at: string;
}
```

### Agency (Agence)
```typescript
interface Agency {
  id: string;
  user_id: string;      // UUID du propriétaire
  nom: string;          // Nom de l'agence
  description?: string; // Description
  logo_url?: string;    // URL du logo
  telephone?: string;   // Téléphone
  email?: string;       // Email
  adresse?: string;     // Adresse
  ville?: string;       // Ville principale
  created_at: string;
  updated_at: string;
}
```

## 🔒 Sécurité (Row Level Security)

### Politiques de sécurité implémentées :

1. **Profiles** : Les utilisateurs peuvent uniquement voir/modifier leur propre profil
2. **Agencies** : Visibles par tous, modifiables par le propriétaire uniquement
3. **Trips** : Visibles par tous (trajets actifs), gérables par l'agence propriétaire
4. **Bookings** : Visibles par l'utilisateur et l'agence du trajet
5. **Trip Services** : Visibles par tous, gérables par l'agence

## 📱 Intégration dans l'App

### Store Zustand
L'application utilise Zustand pour la gestion d'état globale :

```javascript
// Store d'authentification
const { user, signIn, signOut } = useAuthStore()

// Store de recherche
const { searchParams, setSearchParams, searchResults } = useSearchStore()

// Store de réservation
const { currentTrip, selectedSeats, setCurrentTrip } = useBookingStore()
```

### Gestion d'erreur
Toutes les fonctions API retournent un objet `{ data, error }` :

```javascript
const { data, error } = await tripService.searchTrips(...)

if (error) {
  console.error('Erreur API:', error.message)
  // Afficher un message d'erreur à l'utilisateur
} else {
  // Utiliser les données
  console.log('Trajets trouvés:', data)
}
```

## 🚀 Endpoints Personnalisés (si nécessaire)

Pour des besoins spécifiques, vous pouvez créer des fonctions Edge avec Supabase :

```sql
-- Exemple : Fonction pour obtenir les trajets populaires
CREATE OR REPLACE FUNCTION get_popular_routes()
RETURNS TABLE (
  ville_depart TEXT,
  ville_arrivee TEXT,
  count_bookings BIGINT,
  avg_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.ville_depart,
    t.ville_arrivee,
    COUNT(b.id) as count_bookings,
    AVG(t.prix) as avg_price
  FROM trips t
  LEFT JOIN bookings b ON t.id = b.trip_id
  WHERE t.status = 'active'
  GROUP BY t.ville_depart, t.ville_arrivee
  ORDER BY count_bookings DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

## 📞 Support API

En cas de problème avec l'API :
1. Vérifiez les logs dans le dashboard Supabase
2. Assurez-vous que les politiques RLS sont correctes
3. Vérifiez que l'utilisateur est bien authentifié
4. Consultez la documentation Supabase : https://supabase.com/docs
