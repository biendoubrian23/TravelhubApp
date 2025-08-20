-- Script pour remplir uniquement la table seat_maps
-- Utilise les bonnes valeurs d'enum : standard, vip, premium

-- Vider la table seat_maps
DELETE FROM seat_maps;

-- Plan pour bus classique (45 places) - 5 colonnes, 9 rangées
-- Tous les sièges sont de type 'standard'
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(
        CASE c.col_num 
            WHEN 1 THEN 'A'
            WHEN 2 THEN 'B'
            WHEN 3 THEN 'C'
            WHEN 4 THEN 'D'
            WHEN 5 THEN 'E'
        END, 
        r.row_num::text
    ) as seat_number,
    'standard'::seat_type as seat_type,
    CASE WHEN RANDOM() > 0.2 THEN true ELSE false END as is_available,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 200 -- Supplément fenêtre
        ELSE 0
    END as price_modifier_fcfa,
    r.row_num as position_row,
    c.col_num as position_column,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 9) as r(row_num)
CROSS JOIN generate_series(1, 5) as c(col_num)
WHERE t.bus_type = 'classique';

-- Plan pour bus premium (40 places) - 4 colonnes, 10 rangées  
-- Tous les sièges sont de type 'premium'
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(
        CASE c.col_num 
            WHEN 1 THEN 'A'
            WHEN 2 THEN 'B'
            WHEN 3 THEN 'C'
            WHEN 4 THEN 'D'
        END, 
        r.row_num::text
    ) as seat_number,
    'premium'::seat_type as seat_type,
    CASE WHEN RANDOM() > 0.15 THEN true ELSE false END as is_available,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 4 THEN 500 -- Supplément fenêtre
        ELSE 200 -- Supplément base premium
    END as price_modifier_fcfa,
    r.row_num as position_row,
    c.col_num as position_column,
    NOW()
FROM trips t
CROSS JOIN generate_series(1, 10) as r(row_num)
CROSS JOIN generate_series(1, 4) as c(col_num)
WHERE t.bus_type = 'premium';

-- Plan pour bus VIP (35 places) - 5 colonnes, 7 rangées
-- Tous les sièges sont de type 'vip'
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at)
SELECT 
    gen_random_uuid(),
    t.id,
    CONCAT(
        CASE c.col_num 
            WHEN 1 THEN 'A'
            WHEN 2 THEN 'B'
            WHEN 3 THEN 'C'
            WHEN 4 THEN 'D'
            WHEN 5 THEN 'E'
        END, 
        r.row_num::text
    ) as seat_number,
    'vip'::seat_type as seat_type,
    CASE WHEN RANDOM() > 0.1 THEN true ELSE false END as is_available,
    CASE 
        WHEN c.col_num = 1 OR c.col_num = 5 THEN 1000 -- Supplément fenêtre VIP
        WHEN c.col_num = 3 THEN 1500 -- Supplément siège central VIP
        ELSE 700 -- Supplément base VIP
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
    COUNT(CASE WHEN seat_type = 'standard' THEN 1 END) as standard_seats,
    COUNT(CASE WHEN seat_type = 'premium' THEN 1 END) as premium_seats,
    COUNT(CASE WHEN seat_type = 'vip' THEN 1 END) as vip_seats,
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
    sm.seat_type
FROM trips t
LEFT JOIN seat_maps sm ON t.id = sm.trip_id
WHERE t.departure_time::date = '2025-08-03'
GROUP BY t.id, t.bus_type, t.departure_city, t.arrival_city, sm.seat_type
ORDER BY t.bus_type, t.departure_time
LIMIT 10;

-- Statistiques globales
SELECT 
    COUNT(DISTINCT trip_id) as trips_with_seats,
    COUNT(*) as total_seats_in_db,
    COUNT(CASE WHEN is_available = true THEN 1 END) as total_available_seats,
    ROUND(AVG(price_modifier_fcfa), 2) as avg_price_modifier
FROM seat_maps;
