-- Script pour corriger la fonction de traitement de paiement avec solde
-- en adaptant la colonne seat_numbers à seat_number

-- D'abord supprimer la fonction existante
DROP FUNCTION IF EXISTS process_payment_with_balance(UUID,UUID,INTEGER[],DECIMAL,VARCHAR);

-- Recréer la fonction process_payment_with_balance
CREATE OR REPLACE FUNCTION process_payment_with_balance(
    p_user_id UUID,
    p_trip_id UUID,
    p_seat_number INTEGER[], -- Changé de p_seat_numbers à p_seat_number
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
    
    -- Générer une référence de réservation unique
    booking_ref := 'BK-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    
    -- Créer la réservation
    INSERT INTO public.bookings (
        user_id, 
        trip_id, 
        seat_number, -- Corrigé: seat_number au singulier
        total_price_fcfa, -- Corrigé: total_price_fcfa est le nom correct
        payment_method,
        booking_reference,
        payment_status,
        booking_status, -- Ajout du statut de réservation
        passenger_name, -- Ajout d'une valeur par défaut
        passenger_phone -- Ajout d'une valeur par défaut
    ) VALUES (
        p_user_id,
        p_trip_id,
        p_seat_number, -- Le nom du paramètre correspond maintenant au nom de la colonne
        p_total_price,
        p_payment_method,
        booking_ref,
        CASE WHEN balance_sufficient THEN 'paid'::payment_status ELSE 'pending'::payment_status END, -- Cast explicite vers le type enum
        'confirmed'::booking_status, -- Cast explicite vers le type enum
        'Réservation via solde', -- Valeur par défaut pour passenger_name
        '+237000000000' -- Valeur par défaut pour passenger_phone
    ) RETURNING id INTO new_booking_id;
    
    -- Si on utilise du solde, débiter et enregistrer la transaction
    IF amount_from_balance > 0 THEN
        UPDATE public.users 
        SET balance = balance - amount_from_balance
        WHERE id = p_user_id;
        
        INSERT INTO public.balance_transactions (user_id, booking_id, transaction_type, amount, description)
        VALUES (
            p_user_id,
            new_booking_id,
            'payment',
            -amount_from_balance,
            'Paiement par solde utilisateur'
        );
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        new_booking_id,
        amount_from_balance,
        amount_to_pay,
        balance_sufficient;
END;
$$ LANGUAGE plpgsql;
