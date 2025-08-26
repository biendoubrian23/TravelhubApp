-- 🧹 Nettoyage des sièges fantômes
-- Script SQL pour identifier et libérer les sièges marqués occupés sans réservation active

-- 1. Diagnostic : Voir l'état actuel des sièges
SELECT 
    t.departure_city || ' → ' || t.arrival_city as route,
    t.departure_date,
    COUNT(sm.seat_number) as total_seats,
    COUNT(CASE WHEN sm.is_available = false THEN 1 END) as occupied_seats,
    COUNT(CASE WHEN sm.is_available = true THEN 1 END) as available_seats
FROM trips t
LEFT JOIN seat_maps sm ON t.id = sm.trip_id
WHERE t.departure_date >= CURRENT_DATE
GROUP BY t.id, t.departure_city, t.arrival_city, t.departure_date
ORDER BY t.departure_date
LIMIT 10;

-- 2. Identifier les sièges fantômes (occupés sans réservation active)
SELECT 
    sm.trip_id,
    sm.seat_number,
    t.departure_city || ' → ' || t.arrival_city as route,
    t.departure_date,
    'FANTÔME' as status
FROM seat_maps sm
JOIN trips t ON sm.trip_id = t.id
WHERE sm.is_available = false
  AND sm.seat_number NOT IN (
    SELECT DISTINCT seat_number 
    FROM bookings 
    WHERE trip_id = sm.trip_id 
      AND booking_status IN ('confirmed', 'pending')
      AND seat_number IS NOT NULL
  )
  AND t.departure_date >= CURRENT_DATE
ORDER BY t.departure_date, sm.trip_id, sm.seat_number;

-- 3. Nettoyer les sièges fantômes (décommenter pour exécuter)
/*
UPDATE seat_maps 
SET is_available = true,
    updated_at = NOW()
WHERE is_available = false
  AND seat_number NOT IN (
    SELECT DISTINCT seat_number 
    FROM bookings 
    WHERE trip_id = seat_maps.trip_id 
      AND booking_status IN ('confirmed', 'pending')
      AND seat_number IS NOT NULL
  )
  AND trip_id IN (
    SELECT id FROM trips WHERE departure_date >= CURRENT_DATE
  );
*/

-- 4. Vérification post-nettoyage
SELECT 
    COUNT(*) as sièges_fantômes_restants
FROM seat_maps sm
JOIN trips t ON sm.trip_id = t.id
WHERE sm.is_available = false
  AND sm.seat_number NOT IN (
    SELECT DISTINCT seat_number 
    FROM bookings 
    WHERE trip_id = sm.trip_id 
      AND booking_status IN ('confirmed', 'pending')
      AND seat_number IS NOT NULL
  )
  AND t.departure_date >= CURRENT_DATE;

-- 5. Script pour libérer un siège spécifique (en cas de problème)
/*
-- Remplacer TRIP_ID et SEAT_NUMBER par les vraies valeurs
UPDATE seat_maps 
SET is_available = true,
    updated_at = NOW()
WHERE trip_id = 'TRIP_ID' 
  AND seat_number = SEAT_NUMBER;
*/
