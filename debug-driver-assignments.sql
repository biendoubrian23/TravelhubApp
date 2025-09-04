-- Script de vérification et correction des données conducteur
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur connecté dans l'app
SELECT 
  'Utilisateur connecté dans l\'app:' as info,
  id,
  email,
  full_name,
  role
FROM users 
WHERE email = 'conducteur.deux@generalexpress.com';

-- 2. Vérifier tous les trajets et leurs conducteurs assignés
SELECT 
  t.id,
  t.departure_city || ' → ' || t.arrival_city as route,
  t.departure_time,
  t.driver_id,
  u.full_name as conducteur_name,
  u.email as conducteur_email,
  CASE 
    WHEN t.driver_id = (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com') 
    THEN '✅ Votre trajet'
    ELSE '❌ Autre conducteur'
  END as assignment_status
FROM trips t
LEFT JOIN users u ON t.driver_id = u.id
WHERE t.departure_time >= CURRENT_DATE
ORDER BY t.departure_time;

-- 3. Compter les trajets par conducteur
SELECT 
  u.full_name as conducteur,
  u.email,
  COUNT(t.id) as nombre_trajets
FROM users u
LEFT JOIN trips t ON u.id = t.driver_id AND t.departure_time >= CURRENT_DATE
WHERE u.role = 'agency_driver'
GROUP BY u.id, u.full_name, u.email
ORDER BY nombre_trajets DESC;

-- 4. Si vous voulez assigner des trajets à votre utilisateur connecté
-- Décommentez et modifiez selon vos besoins :

/*
-- Récupérer l'ID de votre utilisateur
WITH my_user AS (
  SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com'
)
-- Assigner les 2 premiers trajets du jour à cet utilisateur
UPDATE trips 
SET driver_id = (SELECT id FROM my_user)
WHERE id IN (
  SELECT id FROM trips 
  WHERE departure_time >= CURRENT_DATE 
  LIMIT 2
);
*/

-- 5. Créer des trajets de test spécifiquement pour votre utilisateur
INSERT INTO trips (
  departure_city,
  arrival_city,
  departure_time,
  arrival_time,
  price_fcfa,
  available_seats,
  bus_type,
  driver_id,
  created_at
) VALUES 
(
  'Douala',
  'Yaoundé',
  CURRENT_DATE + INTERVAL '2 hours',
  CURRENT_DATE + INTERVAL '6 hours',
  5000,
  30,
  'vip',
  (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com'),
  NOW()
),
(
  'Yaoundé',
  'Bafoussam',
  CURRENT_DATE + INTERVAL '4 hours',
  CURRENT_DATE + INTERVAL '8 hours',
  7500,
  25,
  'classique',
  (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com'),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 6. Créer des passagers pour ces trajets
WITH user_trips AS (
  SELECT t.id as trip_id
  FROM trips t
  WHERE t.driver_id = (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com')
  AND t.departure_time >= CURRENT_DATE
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
) 
SELECT 
  ut.trip_id,
  (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com'),
  'Passager Test ' || row_number() OVER(),
  '+23767' || (6000000 + row_number() OVER()),
  'A' || row_number() OVER(),
  5000,
  'confirmed',
  'completed',
  'TH' || extract(epoch from now())::bigint || row_number() OVER(),
  NOW()
FROM user_trips ut, generate_series(1, 3) as gs
ON CONFLICT DO NOTHING;

-- 7. Vérification finale
SELECT 
  'Vérification finale:' as titre,
  COUNT(t.id) as trajets_assignes,
  COUNT(b.id) as passagers_total
FROM trips t
LEFT JOIN bookings b ON t.id = b.trip_id AND b.booking_status = 'confirmed'
WHERE t.driver_id = (SELECT id FROM users WHERE email = 'conducteur.deux@generalexpress.com')
AND t.departure_time >= CURRENT_DATE;
