-- Script pour remplir uniquement la table seat_maps
-- Utilise les trajets existants dans la base de données

-- Vider la table seat_maps
DELETE FROM seat_maps;

-- Ajouter des plans de sièges pour tous les trajets existants

-- Plan pour bus classique (45 places) - 5 colonnes, 9 rangées
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(CASE c.col_num 
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
        WHEN 5 THEN 'E'
    END, r.row_num::text) as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 'window'::seat_type
        WHEN c.col_num = 2 OR c.col_num = 4 THEN 'aisle'::seat_type
        ELSE 'middle'::seat_type
    END as seat_type,
    CASE WHEN RANDOM() > 0.2 THEN true ELSE false END as is_available, -- 80% des sièges disponibles
    0 as price_modifier_fcfa, -- Pas de supplément pour les sièges classiques
    r.row_num as position_row,
    c.col_num as position_column,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 9) as r(row_num)
CROSS JOIN generate_series(1, 5) as c(col_num)
WHERE t.bus_type = 'classique';

-- Plan pour bus premium (40 places) - 4 colonnes, 10 rangées  
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(CASE c.col_num 
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
    END, r.row_num::text) as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 4 THEN 'window'::seat_type
        ELSE 'aisle'::seat_type
    END as seat_type,
    CASE WHEN RANDOM() > 0.15 THEN true ELSE false END as is_available, -- 85% des sièges disponibles
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 4 THEN 500 -- Supplément fenêtre
        ELSE 0
    END as price_modifier_fcfa,
    r.row_num as position_row,
    c.col_num as position_column,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 10) as r(row_num)
CROSS JOIN generate_series(1, 4) as c(col_num)
WHERE t.bus_type = 'premium';

-- Plan pour bus VIP (35 places) - 5 colonnes, 7 rangées (configuration 2+1+2)
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(CASE c.col_num 
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
        WHEN 5 THEN 'E'
    END, r.row_num::text) as seat_number,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 'window'::seat_type
        WHEN c.col_num = 3 THEN 'premium'::seat_type -- Siège central VIP
        ELSE 'aisle'::seat_type
    END as seat_type,
    CASE WHEN RANDOM() > 0.1 THEN true ELSE false END as is_available, -- 90% des sièges disponibles
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 1000 -- Supplément fenêtre VIP
        WHEN c.col_num = 3 THEN 1500 -- Supplément siège central premium
        ELSE 500 -- Supplément couloir
    END as price_modifier_fcfa,
    r.row_num as position_row,
    c.col_num as position_column,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 7) as r(row_num)
CROSS JOIN generate_series(1, 5) as c(col_num)
WHERE t.bus_type = 'vip';

-- Vérification des résultats
SELECT 
    bus_type,
    COUNT(*) as total_seats_created,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_seats,
    COUNT(CASE WHEN seat_type = 'window' THEN 1 END) as window_seats,
    COUNT(CASE WHEN seat_type = 'aisle' THEN 1 END) as aisle_seats,
    COUNT(CASE WHEN seat_type = 'middle' THEN 1 END) as middle_seats,
    COUNT(CASE WHEN seat_type = 'premium' THEN 1 END) as premium_seats,
    AVG(price_modifier_fcfa) as avg_price_modifier
FROM seat_maps sm
JOIN trips t ON sm.trip_id = t.id
GROUP BY bus_type
ORDER BY bus_type;

-- Vérification détaillée pour un trajet de chaque type
SELECT 
    t.bus_type,
    t.departure_city,
    t.arrival_city,
    COUNT(sm.id) as seats_count,
    STRING_AGG(sm.seat_type, ', ') as seat_types_available
FROM trips t
LEFT JOIN seat_maps sm ON t.id = sm.trip_id
WHERE t.departure_time::date = '2025-08-03'
GROUP BY t.id, t.bus_type, t.departure_city, t.arrival_city
ORDER BY t.bus_type, t.departure_time
LIMIT 10;

-- Statistiques globales
SELECT 
    COUNT(DISTINCT trip_id) as trips_with_seats,
    COUNT(*) as total_seats_in_db,
    COUNT(CASE WHEN is_available = true THEN 1 END) as total_available_seats,
    ROUND(AVG(price_modifier_fcfa), 2) as avg_price_modifier
FROM seat_maps;
