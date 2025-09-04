-- Script pour créer un utilisateur conducteur de test
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer l'utilisateur d'authentification (via l'interface Supabase ou l'API)
-- Email: conducteur.test@travelhub.cm
-- Mot de passe: Conducteur123!

-- 2. Une fois l'utilisateur créé, mettre à jour son profil pour lui donner le rôle agency_driver
-- Remplacez 'USER_ID_FROM_AUTH' par l'ID réel de l'utilisateur créé

-- Exemple d'insertion du profil utilisateur avec le rôle conducteur
INSERT INTO public.users (
  id,
  email,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH', -- Remplacer par l'ID réel
  'conducteur.test@travelhub.cm',
  'Jean Conducteur',
  '+237696123456',
  'agency_driver',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'agency_driver',
  full_name = 'Jean Conducteur',
  phone = '+237696123456',
  updated_at = now();

-- 3. Créer quelques trajets de test pour ce conducteur
-- (Optionnel - pour tester l'interface)

-- Insérer une agence de test si elle n'existe pas
INSERT INTO public.agencies (
  id,
  user_id,
  name,
  description,
  phone,
  email,
  created_at
) VALUES (
  gen_random_uuid(),
  'USER_ID_FROM_AUTH', -- Remplacer par l'ID réel
  'Transport Express',
  'Agence de transport fiable et sécurisée',
  '+237696123456',
  'contact@transport-express.cm',
  now()
) ON CONFLICT DO NOTHING;

-- Insérer quelques trajets de test
WITH agency_data AS (
  SELECT id as agency_id FROM public.agencies WHERE user_id = 'USER_ID_FROM_AUTH' LIMIT 1
)
INSERT INTO public.trips (
  id,
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
) 
SELECT 
  gen_random_uuid(),
  agency_data.agency_id,
  'USER_ID_FROM_AUTH', -- Remplacer par l'ID réel
  'Douala',
  'Yaoundé',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours')::timestamp,
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours')::timestamp,
  5000,
  30,
  'vip',
  now()
FROM agency_data
UNION ALL
SELECT 
  gen_random_uuid(),
  agency_data.agency_id,
  'USER_ID_FROM_AUTH', -- Remplacer par l'ID réel
  'Yaoundé',
  'Bafoussam',
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours')::timestamp,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours')::timestamp,
  7500,
  25,
  'classique',
  now()
FROM agency_data;

-- 4. Créer quelques réservations de test
-- (Optionnel - pour tester l'affichage des passagers)

-- Note: Pour créer l'utilisateur d'authentification, utilisez soit :
-- 1. L'interface Supabase (Authentication > Users > Add user)
-- 2. L'API admin de Supabase
-- 3. Le script create-driver-user.js fourni

-- Après avoir créé l'utilisateur, récupérez son ID et remplacez 'USER_ID_FROM_AUTH' dans ce script
