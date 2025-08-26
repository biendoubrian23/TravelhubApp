-- Script complet pour corriger la fonction de paiement avec solde

-- D'abord supprimer la fonction existante
DROP FUNCTION IF EXISTS process_payment_with_balance(UUID, UUID, INTEGER[], DECIMAL, VARCHAR);

-- Recréer la fonction process_payment_with_balance avec la structure correcte de la table bookings
CREATE OR REPLACE FUNCTION process_payment_with_balance(
    p_user_id UUID,
    p_trip_id UUID,
    p_seat_number INTEGER[], -- Le paramètre garde ce nom mais on utilise seat_numbers dans la table
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
        seat_numbers, -- Utiliser le nom correct de la colonne (pluriel)
        prix_total, -- Utiliser le bon nom de colonne
        payment_method,
        nombre_passagers,
        booking_reference,
        status,
        payment_status
    ) VALUES (
        p_user_id,
        p_trip_id,
        p_seat_number, -- Malgré le nom du paramètre, il contient bien un tableau d'entiers
        p_total_price,
        p_payment_method,
        array_length(p_seat_number, 1), -- Calculer le nombre de passagers à partir du tableau de sièges
        booking_ref,
        'confirmed',
        CASE WHEN balance_sufficient THEN 'paid' ELSE 'pending' END
    ) RETURNING id INTO new_booking_id;
    
    -- Si on utilise du solde, débiter et enregistrer la transaction
    IF amount_from_balance > 0 THEN
        UPDATE public.users 
        SET balance = balance - amount_from_balance
        WHERE id = p_user_id;
        
        INSERT INTO public.balance_transactions (
            user_id, 
            booking_id, 
            transaction_type, 
            amount, 
            description
        ) VALUES (
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
