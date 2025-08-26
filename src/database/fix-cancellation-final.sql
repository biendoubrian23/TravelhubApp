-- Script de correction final pour annulation avec solde
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes fonctions et triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings;
DROP FUNCTION IF EXISTS public.handle_booking_cancellation();

-- 2. Créer la fonction de gestion des annulations simplifiée
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    cancellation_fee_percent DECIMAL DEFAULT 30;
    calc_refund_amount DECIMAL;
    calc_fee_amount DECIMAL;
    booking_price DECIMAL;
BEGIN
    -- Seulement si le statut passe à 'cancelled'
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
        
        RAISE NOTICE 'Début traitement annulation pour booking_id: %', NEW.id;
        RAISE NOTICE 'User ID: %, Total price: %', NEW.user_id, NEW.total_price_fcfa;
        
        -- Calculer les montants
        booking_price := NEW.total_price_fcfa;
        calc_fee_amount := booking_price * (cancellation_fee_percent / 100);
        calc_refund_amount := booking_price - calc_fee_amount;
        
        RAISE NOTICE 'Calculs: price=%, fee=%, refund=%', booking_price, calc_fee_amount, calc_refund_amount;
        
        -- Mettre à jour la réservation avec les montants
        UPDATE public.bookings 
        SET 
            refund_amount = calc_refund_amount,
            cancellation_fee = calc_fee_amount
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Réservation mise à jour avec montants de remboursement';
        
        -- Créer/mettre à jour l'entrée dans la table users pour le solde
        INSERT INTO public.users (id, email, balance)
        VALUES (NEW.user_id, 'temp@travelhub.cm', calc_refund_amount)
        ON CONFLICT (id) 
        DO UPDATE SET balance = COALESCE(users.balance, 0) + calc_refund_amount;
        
        RAISE NOTICE 'Solde mis à jour: % FCFA pour user %', calc_refund_amount, NEW.user_id;
        
        -- Enregistrer la transaction dans l'historique
        INSERT INTO public.balance_transactions (user_id, booking_id, transaction_type, amount, description)
        VALUES (
            NEW.user_id, 
            NEW.id, 
            'refund', 
            calc_refund_amount,
            CONCAT('Remboursement après annulation - Frais: ', calc_fee_amount::TEXT, ' FCFA')
        );
        
        RAISE NOTICE 'Transaction enregistrée dans historique';
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger
CREATE TRIGGER trigger_booking_cancellation
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_cancellation();

-- Message de confirmation
SELECT 'Trigger de remboursement configuré avec gestion automatique des utilisateurs' AS message;
