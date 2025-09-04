-- Script SQL pour créer un utilisateur de test avec le rôle agency_driver
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Insérer un utilisateur conducteur dans la table users
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'driver-test-001', 
  'conducteur.test@travelhub.com',
  'Jean Conducteur',
  '+237690123456',
  'agency_driver',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Insérer quelques trajets de test assignés à ce conducteur
INSERT INTO public.trips (
  id,
  agency_id,
  driver_id,
  departure_city,
  arrival_city,
  departure_time,
  arrival_time,
  price_fcfa,
  bus_type,
  available_seats,
  total_seats,
  created_at
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM public.agencies LIMIT 1), -- Première agence disponible
  'driver-test-001',
  'Douala',
  'Yaoundé',
  '2025-09-05 08:00:00+00',
  '2025-09-05 12:00:00+00',
  5000,
  'VIP',
  45,
  50,
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM public.agencies LIMIT 1),
  'driver-test-001',
  'Yaoundé',
  'Douala',
  '2025-09-05 15:00:00+00',
  '2025-09-05 19:00:00+00',
  5000,
  'VIP',
  48,
  50,
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM public.agencies LIMIT 1),
  'driver-test-001',
  'Douala',
  'Bafoussam',
  '2025-09-06 06:30:00+00',
  '2025-09-06 10:30:00+00',
  4500,
  'Standard',
  35,
  40,
  NOW()
);

-- 3. Ajouter quelques réservations de test
DO $$
DECLARE
    trip_record RECORD;
    user_id UUID;
BEGIN
    -- Prendre un utilisateur client existant ou créer un test
    SELECT id INTO user_id FROM public.users WHERE role = 'client' LIMIT 1;
    
    -- Si aucun client, en créer un pour les tests
    IF user_id IS NULL THEN
        INSERT INTO public.users (id, email, full_name, role) 
        VALUES ('test-client-001', 'client.test@travelhub.com', 'Client Test', 'client')
        RETURNING id INTO user_id;
    END IF;
    
    -- Ajouter des réservations pour les trajets du conducteur
    FOR trip_record IN 
        SELECT id FROM public.trips WHERE driver_id = 'driver-test-001' LIMIT 2
    LOOP
        INSERT INTO public.bookings (
            id,
            user_id,
            trip_id,
            passenger_name,
            passenger_phone,
            seat_number,
            total_price_fcfa,
            payment_method,
            payment_status,
            booking_status,
            booking_reference,
            created_at
        ) VALUES (
            gen_random_uuid(),
            user_id,
            trip_record.id,
            'Passager Test ' || floor(random() * 100),
            '+237' || floor(random() * 1000000000),
            'A' || floor(random() * 20 + 1),
            5000,
            'orange_money',
            'completed',
            'confirmed',
            'TH' || floor(random() * 1000000),
            NOW()
        );
    END LOOP;
END $$;

-- 4. Afficher un résumé des données créées
SELECT 
    'Conducteur créé' as type,
    email,
    full_name,
    role
FROM public.users 
WHERE id = 'driver-test-001'

UNION ALL

SELECT 
    'Trajets assignés' as type,
    departure_city || ' → ' || arrival_city as email,
    to_char(departure_time, 'DD/MM/YYYY HH24:MI') as full_name,
    bus_type as role
FROM public.trips 
WHERE driver_id = 'driver-test-001'

UNION ALL

SELECT 
    'Réservations' as type,
    passenger_name as email,
    booking_reference as full_name,
    booking_status as role
FROM public.bookings b
JOIN public.trips t ON b.trip_id = t.id
WHERE t.driver_id = 'driver-test-001';

-- Note: Pour tester la connexion, vous devrez:
-- 1. Aller dans l'onglet "Authentication" de Supabase
-- 2. Créer manuellement un utilisateur avec l'email: conducteur.test@travelhub.com
-- 3. S'assurer que l'ID de l'utilisateur dans auth.users correspond à 'driver-test-001'
-- 4. Ou utiliser le script create-driver-user.js pour créer l'utilisateur complet
