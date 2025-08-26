-- Correction de la relation manquante entre bookings et trips
-- Script pour le problème d'erreur: "Could not find a relationship between 'bookings' and 'trips'"

-- 1. Vérifier l'existence des contraintes actuelles
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='bookings';

-- 2. Ajouter la contrainte de clé étrangère si elle n'existe pas déjà
ALTER TABLE bookings
ADD CONSTRAINT IF NOT EXISTS bookings_trip_id_fkey
FOREIGN KEY (trip_id)
REFERENCES trips(id)
ON DELETE SET NULL;

-- 3. Corriger les transactions avec des jointures qui utilisent bookings et trips
-- Cette requête permet de confirmer que les données sont accessibles avec la relation
SELECT 
    bt.id as transaction_id,
    bt.amount,
    bt.transaction_type,
    bt.created_at,
    b.booking_reference,
    b.total_price_fcfa,
    t.departure_city,
    t.arrival_city
FROM 
    balance_transactions bt
LEFT JOIN 
    bookings b ON bt.booking_id = b.id
LEFT JOIN 
    trips t ON b.trip_id = t.id
LIMIT 10;

-- 4. Identifier les réservations qui n'ont pas de trajet associé (données orphelines)
SELECT 
    b.id,
    b.booking_reference,
    b.seat_number,
    b.created_at
FROM 
    bookings b
LEFT JOIN 
    trips t ON b.trip_id = t.id
WHERE 
    b.trip_id IS NOT NULL AND t.id IS NULL;

-- 5. Si nécessaire, relier ces réservations orphelines à des trajets existants
-- (Décommenter et adapter si nécessaire)
/*
UPDATE bookings
SET trip_id = (SELECT id FROM trips ORDER BY created_at DESC LIMIT 1)
WHERE trip_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM trips t WHERE t.id = bookings.trip_id
);
*/
