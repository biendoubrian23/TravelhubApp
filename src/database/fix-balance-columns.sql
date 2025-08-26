-- Script pour corriger les noms de colonnes dans le système de solde
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings;

-- 2. Supprimer la fonction existante
DROP FUNCTION IF EXISTS public.handle_booking_cancellation();

-- 3. Recréer la fonction avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    cancellation_fee_percent DECIMAL DEFAULT 30;
    refund_amount DECIMAL;
    fee_amount DECIMAL;
    booking_price DECIMAL;
BEGIN
    -- Seulement si le statut passe à 'cancelled'
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
        -- Récupérer le pourcentage de frais d'annulation
        SELECT CAST(setting_value AS DECIMAL) INTO cancellation_fee_percent
        FROM public.app_settings 
        WHERE setting_key = 'cancellation_fee_percent';
        
        -- Si pas de paramètre trouvé, utiliser 30% par défaut
        IF cancellation_fee_percent IS NULL THEN
            cancellation_fee_percent := 30;
        END IF;
        
        -- Calculer les montants
        booking_price := NEW.total_price_fcfa;
        fee_amount := booking_price * (cancellation_fee_percent / 100);
        refund_amount := booking_price - fee_amount;
        
        -- Mettre à jour la réservation avec les montants
        UPDATE public.bookings 
        SET 
            refund_amount = refund_amount,
            cancellation_fee = fee_amount
        WHERE id = NEW.id;
        
        -- Vérifier si l'utilisateur existe dans la table users
        -- Si non, l'ajouter avec un solde de 0
        INSERT INTO public.users (id, balance)
        VALUES (NEW.user_id, 0)
        ON CONFLICT (id) DO NOTHING;
        
        -- Créditer le solde de l'utilisateur
        UPDATE public.users 
        SET balance = COALESCE(balance, 0) + refund_amount
        WHERE id = NEW.user_id;
        
        -- Enregistrer la transaction dans l'historique
        INSERT INTO public.balance_transactions (user_id, booking_id, transaction_type, amount, description)
        VALUES (
            NEW.user_id, 
            NEW.id, 
            'refund', 
            refund_amount,
            CONCAT('Remboursement après annulation - Frais: ', fee_amount::TEXT, ' FCFA')
        );
        
        RAISE NOTICE 'Remboursement traité: % FCFA crédités sur le solde', refund_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer le trigger
CREATE TRIGGER trigger_booking_cancellation
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_cancellation();

-- 5. Mettre à jour la fonction de paiement avec solde aussi
CREATE OR REPLACE FUNCTION public.create_booking_with_balance(
    p_user_id UUID,
    p_trip_id UUID,
    p_seat_numbers INTEGER[],
    p_total_price INTEGER,
    p_payment_method VARCHAR(20) DEFAULT 'orange_money'
)
RETURNS JSON AS $$
DECLARE
    user_balance INTEGER DEFAULT 0;
    amount_from_balance INTEGER DEFAULT 0;
    amount_to_pay INTEGER DEFAULT 0;
    balance_sufficient BOOLEAN DEFAULT FALSE;
    new_booking_id UUID;
    booking_reference VARCHAR(20);
BEGIN
    -- Générer une référence unique
    booking_reference := 'TH' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Vérifier si l'utilisateur existe et récupérer son solde
    INSERT INTO public.users (id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (id) DO NOTHING;
    
    SELECT COALESCE(balance, 0) INTO user_balance
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
    
    -- Créer la réservation avec le bon nom de colonne
    INSERT INTO public.bookings (
        user_id, 
        trip_id, 
        total_price_fcfa, 
        payment_method,
        booking_status,
        payment_status,
        booking_reference
    ) VALUES (
        p_user_id,
        p_trip_id,
        p_total_price,
        p_payment_method,
        'confirmed',
        CASE WHEN balance_sufficient THEN 'paid' ELSE 'pending' END,
        booking_reference
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
    
    -- Retourner les informations
    RETURN JSON_BUILD_OBJECT(
        'booking_id', new_booking_id,
        'booking_reference', booking_reference,
        'amount_from_balance', amount_from_balance,
        'amount_to_pay', amount_to_pay,
        'balance_sufficient', balance_sufficient,
        'payment_status', CASE WHEN balance_sufficient THEN 'paid' ELSE 'pending' END
    );
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Fonctions de solde mises à jour avec les bons noms de colonnes' AS message;
