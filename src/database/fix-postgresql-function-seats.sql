-- Correction de la fonction PostgreSQL pour résoudre les problèmes BK et accolades
-- Script de correction : c:\TravelHub\src\database\fix-postgresql-function-seats.sql

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS process_payment_with_balance(UUID,UUID,INTEGER[],DECIMAL,VARCHAR);

-- Recréer la fonction avec les corrections
CREATE OR REPLACE FUNCTION process_payment_with_balance(
    p_user_id UUID,
    p_trip_id UUID,
    p_seat_number INTEGER[], -- Array de sièges
    p_total_price DECIMAL,
    p_payment_method VARCHAR
) RETURNS TABLE(
    booking_id UUID,
    amount_from_balance DECIMAL,
    amount_to_pay DECIMAL,
    balance_sufficient BOOLEAN
) AS $$
DECLARE
    user_balance DECIMAL;
    amount_from_balance DECIMAL;
    amount_to_pay DECIMAL;
    new_booking_id UUID;
    balance_sufficient BOOLEAN;
    booking_ref VARCHAR(20);
    seat_num INTEGER;
    seat_string VARCHAR(10);
    base_price DECIMAL;
BEGIN
    -- Récupérer le solde actuel de l'utilisateur
    SELECT balance INTO user_balance 
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Si pas de solde trouvé, initialiser à 0
    IF user_balance IS NULL THEN
        user_balance := 0;
    END IF;
    
    -- Calculer les montants
    IF user_balance >= p_total_price THEN
        amount_from_balance := p_total_price;
        amount_to_pay := 0;
        balance_sufficient := TRUE;
    ELSE
        amount_from_balance := user_balance;
        amount_to_pay := p_total_price - user_balance;
        balance_sufficient := FALSE;
    END IF;
    
    -- Calculer le prix par siège
    base_price := p_total_price / array_length(p_seat_number, 1);
    
    -- 🔥 CORRECTION 1: Utiliser des références TH- comme le reste du système
    -- 🔥 CORRECTION 2: Créer UNE réservation par siège (pas une seule avec array)
    
    -- Boucler sur chaque siège pour créer une réservation séparée
    FOREACH seat_num IN ARRAY p_seat_number LOOP
        -- Convertir le numéro de siège en chaîne propre
        seat_string := seat_num::VARCHAR;
        
        -- Générer une référence TH unique pour chaque réservation
        booking_ref := 'TH' || extract(epoch from now())::bigint || '-' || seat_num;
        
        -- Créer une réservation pour ce siège
        INSERT INTO public.bookings (
            user_id, 
            trip_id, 
            seat_number, -- 🔥 CORRECTION: Une chaîne simple, pas un array
            total_price_fcfa,
            payment_method,
            booking_reference,
            payment_status,
            booking_status,
            passenger_name,
            passenger_phone
        ) VALUES (
            p_user_id,
            p_trip_id,
            seat_string, -- 🔥 CORRECTION: Chaîne simple au lieu d'array
            base_price, -- Prix par siège
            p_payment_method,
            booking_ref, -- Référence TH unique
            CASE WHEN balance_sufficient THEN 'paid'::payment_status ELSE 'pending'::payment_status END,
            'confirmed'::booking_status,
            'Réservation via solde',
            '+237000000000'
        ) RETURNING id INTO new_booking_id;
        
        -- Marquer le siège comme occupé dans seat_maps
        UPDATE public.seat_maps 
        SET is_available = FALSE 
        WHERE trip_id = p_trip_id AND seat_number = seat_string;
        
    END LOOP;
    
    -- Si on utilise du solde, débiter et enregistrer la transaction UNE SEULE FOIS
    IF amount_from_balance > 0 THEN
        UPDATE public.users 
        SET balance = balance - amount_from_balance
        WHERE id = p_user_id;
        
        INSERT INTO public.balance_transactions (user_id, booking_id, transaction_type, amount, description)
        VALUES (
            p_user_id,
            new_booking_id, -- Utiliser l'ID de la dernière réservation créée
            'payment',
            -amount_from_balance,
            'Paiement par solde utilisateur'
        );
    END IF;
    
    -- Retourner les résultats avec l'ID de la dernière réservation
    RETURN QUERY SELECT 
        new_booking_id,
        amount_from_balance,
        amount_to_pay,
        balance_sufficient;
END;
$$ LANGUAGE plpgsql;

-- 🔥 CORRECTION SUPPLÉMENTAIRE: Nettoyer les anciennes réservations BK avec des accolades
UPDATE public.bookings 
SET seat_number = TRIM(REPLACE(REPLACE(seat_number, '{', ''), '}', ''))
WHERE booking_reference LIKE 'BK-%' 
AND (seat_number LIKE '{%}' OR seat_number LIKE '%{%' OR seat_number LIKE '%}%');

-- Afficher un rapport de correction
SELECT 'Réservations BK corrigées' as status, count(*) as count
FROM public.bookings 
WHERE booking_reference LIKE 'BK-%';
