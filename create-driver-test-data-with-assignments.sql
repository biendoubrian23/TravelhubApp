-- Script pour créer des données de test avec conducteurs assignés
-- À exécuter dans Supabase SQL Editor

-- 1. Créer des utilisateurs conducteurs de test
INSERT INTO users (
  id,
  email, 
  full_name, 
  phone, 
  role,
  created_at,
  updated_at
) VALUES 
-- Conducteur principal (celui qui va se connecter)
(
  '550e8400-e29b-41d4-a716-446655440000',
  'conducteur.test@travelhub.cm',
  'Jean Conducteur',
  '+237696123456',
  'agency_driver',
  NOW(),
  NOW()
),
-- Autres conducteurs
(
  '550e8400-e29b-41d4-a716-446655440001',
  'paul.driver@travelhub.cm',
  'Paul Martin',
  '+237677888999',
  'agency_driver',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'marie.conductrice@travelhub.cm',
  'Marie Dupont',
  '+237678999000',
  'agency_driver',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Créer des agences pour ces conducteurs
INSERT INTO agencies (
  user_id,
  name,
  description,
  phone,
  email,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Transport Express',
  'Agence de transport fiable et sécurisée',
  '+237696123456',
  'contact@transport-express.cm',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Voyages Rapides',
  'Transport rapide et confortable',
  '+237677888999',
  'info@voyages-rapides.cm',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Confort Bus',
  'Le confort avant tout',
  '+237678999000',
  'hello@confort-bus.cm',
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

-- 3. Supprimer les anciens trajets de test
DELETE FROM trips WHERE departure_time >= CURRENT_DATE;

-- 4. Créer des trajets avec différents conducteurs assignés
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
-- Trajets assignés à Jean Conducteur (notre utilisateur principal)
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'),
  '550e8400-e29b-41d4-a716-446655440000', -- Jean Conducteur
  'Douala',
  'Yaoundé',
  CURRENT_DATE + INTERVAL '8 hours', -- 8h aujourd'hui
  CURRENT_DATE + INTERVAL '12 hours', -- 12h aujourd'hui
  5000,
  30,
  'vip',
  NOW()
),
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'),
  '550e8400-e29b-41d4-a716-446655440000', -- Jean Conducteur
  'Yaoundé',
  'Bafoussam',
  CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours', -- 14h demain
  CURRENT_DATE + INTERVAL '1 day' + INTERVAL '18 hours', -- 18h demain
  7500,
  25,
  'classique',
  NOW()
),
-- Trajets assignés à d'autres conducteurs
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'),
  '550e8400-e29b-41d4-a716-446655440001', -- Paul Martin
  'Douala',
  'Bamenda',
  CURRENT_DATE + INTERVAL '10 hours', -- 10h aujourd'hui
  CURRENT_DATE + INTERVAL '15 hours', -- 15h aujourd'hui
  8000,
  28,
  'vip',
  NOW()
),
(
  (SELECT id FROM agencies WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'),
  '550e8400-e29b-41d4-a716-446655440002', -- Marie Dupont
  'Yaoundé',
  'Douala',
  CURRENT_DATE + INTERVAL '16 hours', -- 16h aujourd'hui
  CURRENT_DATE + INTERVAL '20 hours', -- 20h aujourd'hui
  4500,
  32,
  'classique',
  NOW()
);

-- 5. Créer des réservations pour les trajets de Jean Conducteur
WITH jean_trips AS (
  SELECT id, departure_city, arrival_city 
  FROM trips 
  WHERE driver_id = '550e8400-e29b-41d4-a716-446655440000'
  AND departure_time >= CURRENT_DATE
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
-- Passagers pour Douala → Yaoundé
(
  (SELECT id FROM jean_trips WHERE departure_city = 'Douala' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Sophie Martin',
  '+237677123456',
  'A1',
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '01',
  NOW()
),
(
  (SELECT id FROM jean_trips WHERE departure_city = 'Douala' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Ahmed Bello',
  '+237678987654',
  'A2',
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '02',
  NOW()
),
(
  (SELECT id FROM jean_trips WHERE departure_city = 'Douala' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Fatima Nguesso',
  '+237679876543',
  'B1',
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '03',
  NOW()
),
-- Passagers pour Yaoundé → Bafoussam
(
  (SELECT id FROM jean_trips WHERE departure_city = 'Yaoundé' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Pierre Kamga',
  '+237680123456',
  'C1',
  7500,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '04',
  NOW()
),
(
  (SELECT id FROM jean_trips WHERE departure_city = 'Yaoundé' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'Grace Mballa',
  '+237681234567',
  'C2',
  7500,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '05',
  NOW()
);

-- 6. Créer quelques réservations pour les autres trajets (pour le test)
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
  (SELECT id FROM trips WHERE driver_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440001',
  'Client Test 1',
  '+237682345678',
  'D1',
  8000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '06',
  NOW()
),
(
  (SELECT id FROM trips WHERE driver_id = '550e8400-e29b-41d4-a716-446655440002' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440002',
  'Client Test 2',
  '+237683456789',
  'E1',
  4500,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || '07',
  NOW()
);

-- 7. Vérification des données créées
SELECT 
  t.id,
  t.departure_city || ' → ' || t.arrival_city as route,
  t.departure_time,
  d.full_name as conducteur,
  d.email as conducteur_email,
  COUNT(b.id) as passengers_count,
  CASE 
    WHEN t.driver_id = '550e8400-e29b-41d4-a716-446655440000' THEN '✅ Jean (Principal)'
    ELSE '👤 Autre conducteur'
  END as assignment_status
FROM trips t
LEFT JOIN users d ON t.driver_id = d.id
LEFT JOIN bookings b ON t.id = b.trip_id AND b.booking_status = 'confirmed'
WHERE t.departure_time >= CURRENT_DATE
GROUP BY t.id, t.departure_city, t.arrival_city, t.departure_time, d.full_name, d.email, t.driver_id
ORDER BY t.departure_time;

-- 8. Vérification spécifique pour Jean Conducteur
SELECT 
  '👤 Utilisateur: Jean Conducteur' as info,
  'ID: 550e8400-e29b-41d4-a716-446655440000' as user_id,
  COUNT(t.id) as trajets_assignes,
  SUM(CASE WHEN b.booking_status = 'confirmed' THEN 1 ELSE 0 END) as total_passagers
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.driver_id = '550e8400-e29b-41d4-a716-446655440000'
AND t.departure_time >= CURRENT_DATE;
