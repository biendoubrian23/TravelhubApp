-- Script simple pour découvrir les valeurs d'enum seat_type

-- Méthode 1: Vérifier l'enum directement
SELECT enumlabel as seat_type_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'seat_type')
ORDER BY enumsortorder;

-- Méthode 2: Essayer d'insérer avec différentes valeurs communes
-- (Décommentez une ligne à la fois pour tester)

-- Test 1: 'standard'
-- INSERT INTO seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column) 
-- VALUES ((SELECT id FROM trips LIMIT 1), 'TEST1', 'standard', true, 0, 1, 1);

-- Test 2: 'normal' 
-- INSERT INTO seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column) 
-- VALUES ((SELECT id FROM trips LIMIT 1), 'TEST2', 'normal', true, 0, 1, 2);

-- Test 3: 'regular'
-- INSERT INTO seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column) 
-- VALUES ((SELECT id FROM trips LIMIT 1), 'TEST3', 'regular', true, 0, 1, 3);

-- Test 4: 'economy'
-- INSERT INTO seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column) 
-- VALUES ((SELECT id FROM trips LIMIT 1), 'TEST4', 'economy', true, 0, 1, 4);

-- Test 5: 'business'
-- INSERT INTO seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column) 
-- VALUES ((SELECT id FROM trips LIMIT 1), 'TEST5', 'business', true, 0, 1, 5);
