-- Script pour créer la relation entre bookings et trips
-- Exécuter dans Supabase SQL Editor si vous voulez créer la relation

-- 1. Vérifier la structure actuelle des tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trips' 
ORDER BY ordinal_position;

-- 2. Ajouter la colonne trip_id dans bookings si elle n'existe pas
-- ALTER TABLE public.bookings 
-- ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id);

-- 3. Vérifier les données existantes
SELECT 
    id,
    booking_reference,
    departure,
    arrival,
    selected_seats,
    trip_id
FROM public.bookings 
LIMIT 10;

-- 4. Mettre à jour les bookings de test pour avoir des trip_id
-- (Vous pouvez créer des trips de test d'abord si nécessaire)

-- Créer un trip de test VIP
INSERT INTO public.trips (
    departure_city,
    arrival_city,
    departure_date,
    departure_time,
    bus_type,
    price,
    available_seats,
    status
) VALUES (
    'Douala',
    'Yaoundé',
    CURRENT_DATE,
    '14:30',
    'VIP',
    7500,
    50,
    'active'
) ON CONFLICT DO NOTHING;

-- Créer un trip de test Standard
INSERT INTO public.trips (
    departure_city,
    arrival_city,
    departure_date,
    departure_time,
    bus_type,
    price,
    available_seats,
    status
) VALUES (
    'Bafoussam',
    'Douala',
    CURRENT_DATE,
    '09:15',
    'Standard',
    6500,
    50,
    'active'
) ON CONFLICT DO NOTHING;
