-- Vérifier les trajets et leurs sièges
SELECT 
    t.id as trip_id,
    t.departure_city,
    t.arrival_city, 
    t.bus_type,
    COUNT(sm.id) as seat_count,
    COUNT(CASE WHEN sm.is_available = true THEN 1 END) as available_seats
FROM trips t
LEFT JOIN seat_maps sm ON t.id = sm.trip_id
GROUP BY t.id, t.departure_city, t.arrival_city, t.bus_type
ORDER BY t.departure_time
LIMIT 10;

-- Vérifier la structure de seat_maps
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'seat_maps'
ORDER BY ordinal_position;
