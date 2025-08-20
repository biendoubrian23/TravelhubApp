-- Script pour remplir uniquement la table seat_maps
-- Version simplifiée avec valeurs enum probables

-- Vider la table seat_maps
DELETE FROM seat_maps;

-- Première tentative : insérer un seul siège pour tester les valeurs d'enum
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'A1' as seat_number,
    'standard'::seat_type as seat_type,  -- Essayons 'standard'
    true as is_available,
    0 as price_modifier_fcfa,
    1 as position_row,
    1 as position_column,
    NOW()
FROM trips t
WHERE t.bus_type = 'classique'
LIMIT 1;

-- Si ça ne marche pas, essayons d'autres valeurs
-- Décommentez les lignes suivantes une par une pour tester

/*
-- Test avec 'normal'
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'A2' as seat_number,
    'normal'::seat_type as seat_type,
    true as is_available,
    0 as price_modifier_fcfa,
    1 as position_row,
    2 as position_column,
    NOW()
FROM trips t
WHERE t.bus_type = 'classique'
LIMIT 1;
*/

/*
-- Test avec 'regular'
INSERT INTO seat_maps (id, trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column, created_at) 
SELECT 
    gen_random_uuid(),
    t.id,
    'A3' as seat_number,
    'regular'::seat_type as seat_type,
    true as is_available,
    0 as price_modifier_fcfa,
    1 as position_row,
    3 as position_column,
    NOW()
FROM trips t
WHERE t.bus_type = 'classique'
LIMIT 1;
*/

-- Vérification
SELECT * FROM seat_maps LIMIT 5;
