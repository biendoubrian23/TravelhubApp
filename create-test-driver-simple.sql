-- Script SQL simple pour créer un utilisateur conducteur de test
-- À exécuter dans Supabase SQL Editor

-- 1. D'abord vérifier s'il y a des utilisateurs existants
SELECT id, email, role FROM users LIMIT 5;

-- 2. Créer un utilisateur conducteur avec un ID fixe pour les tests
-- Remplacer '00000000-0000-0000-0000-000000000000' par un UUID réel
INSERT INTO users (
  id,
  email, 
  full_name, 
  phone, 
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000', -- UUID de test
  'conducteur.test@travelhub.cm',
  'Jean Conducteur',
  '+237696123456',
  'agency_driver',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'agency_driver',
  full_name = 'Jean Conducteur',
  phone = '+237696123456',
  updated_at = NOW();

-- 3. Créer une agence pour ce conducteur
INSERT INTO agencies (
  user_id,
  name,
  description,
  phone,
  email,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Transport Express',
  'Agence de transport fiable et sécurisée',
  '+237696123456',
  'contact@transport-express.cm',
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  name = 'Transport Express',
  description = 'Agence de transport fiable et sécurisée',
  phone = '+237696123456',
  email = 'contact@transport-express.cm';

-- 4. Créer des trajets de test
INSERT INTO trips (
  agency_id,
  driver_id,
  departure_city,
  arrival_city,
  departure_time,
  arrival_time,
  price_fcfa,
  available_seats,
  bus_type,
  created_at
) VALUES 
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'),
  '550e8400-e29b-41d4-a716-446655440000',
  'Douala',
  'Yaoundé',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
  5000,
  30,
  'vip',
  NOW()
),
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'),
  '550e8400-e29b-41d4-a716-446655440000',
  'Yaoundé',
  'Bafoussam',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '4 hours',
  7500,
  25,
  'classique',
  NOW()
);

-- 5. Créer quelques réservations de test
WITH trip_ids AS (
  SELECT id, departure_city, arrival_city 
  FROM trips 
  WHERE driver_id = '550e8400-e29b-41d4-a716-446655440000'
  LIMIT 2
)
INSERT INTO bookings (
  trip_id,
  user_id,
  passenger_name,
  passenger_phone,
  seat_number,
  total_price_fcfa,
  booking_status,
  payment_status,
  booking_reference,
  created_at
) VALUES 
(
  (SELECT id FROM trip_ids WHERE departure_city = 'Douala'),
  '550e8400-e29b-41d4-a716-446655440000',
  'Marie Dupont',
  '+237677123456',
  'A1',
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::text || '01',
  NOW()
),
(
  (SELECT id FROM trip_ids WHERE departure_city = 'Douala'),
  '550e8400-e29b-41d4-a716-446655440000',
  'Paul Martin',
  '+237678987654',
  'B2',
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::text || '02',
  NOW()
),
(
  (SELECT id FROM trip_ids WHERE departure_city = 'Yaoundé'),
  '550e8400-e29b-41d4-a716-446655440000',
  'Sophie Durand',
  '+237679876543',
  'C3',
  7500,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::text || '03',
  NOW()
);

-- 6. Vérifier les données créées
SELECT 
  u.email,
  u.full_name,
  u.role,
  a.name as agency_name,
  COUNT(t.id) as total_trips,
  COUNT(b.id) as total_bookings
FROM users u
LEFT JOIN agencies a ON u.id = a.user_id
LEFT JOIN trips t ON u.id = t.driver_id
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE u.id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY u.email, u.full_name, u.role, a.name;

-- 7. Voir les trajets avec leurs réservations
SELECT 
  t.departure_city,
  t.arrival_city,
  t.departure_time,
  t.bus_type,
  t.price_fcfa,
  COUNT(b.id) as passengers_count,
  SUM(b.total_price_fcfa) as total_revenue
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.driver_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY t.id, t.departure_city, t.arrival_city, t.departure_time, t.bus_type, t.price_fcfa
ORDER BY t.departure_time;
