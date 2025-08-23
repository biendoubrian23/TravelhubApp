-- Script pour corriger la numérotation des sièges pour les bus classiques
-- Les bus classiques doivent avoir des numéros simples (1, 2, 3...) au lieu de (1A, 1B, 1C...)

-- 1. Supprimer tous les sièges existants pour les bus classiques
DELETE FROM public.seat_maps 
WHERE trip_id IN (
    SELECT id FROM public.trips WHERE bus_type = 'classique'
);

-- 2. Regénérer les sièges avec la numérotation correcte pour les bus classiques
DO $$
DECLARE
    trip_record RECORD;
    seat_num TEXT;
    row_num INTEGER;
    col_num INTEGER;
    seat_number INTEGER;
    seat_type_val seat_type;
    price_mod INTEGER;
BEGIN
    -- Pour chaque voyage de type classique
    FOR trip_record IN SELECT id FROM public.trips WHERE bus_type = 'classique' LOOP
        -- Bus classique: 40 sièges (numérotation simple 1-40)
        FOR seat_number IN 1..40 LOOP
            row_num := ((seat_number - 1) / 5) + 1;  -- 5 sièges par rangée
            col_num := ((seat_number - 1) % 5) + 1;  -- Position dans la rangée
            seat_num := seat_number::TEXT;           -- Numérotation simple: 1, 2, 3, etc.
            seat_type_val := 'standard';
            price_mod := 0;
            
            INSERT INTO public.seat_maps (trip_id, seat_number, seat_type, is_available, price_modifier_fcfa, position_row, position_column)
            VALUES (trip_record.id, seat_num, seat_type_val, true, price_mod, row_num, col_num);
        END LOOP;
    END LOOP;
END $$;

-- 3. Vérifier les résultats
SELECT 
    t.bus_type,
    COUNT(sm.id) as total_seats,
    ARRAY_AGG(sm.seat_number ORDER BY sm.seat_number::INTEGER) as seat_numbers
FROM public.trips t
JOIN public.seat_maps sm ON t.id = sm.trip_id
WHERE t.bus_type = 'classique'
GROUP BY t.id, t.bus_type
LIMIT 3;
