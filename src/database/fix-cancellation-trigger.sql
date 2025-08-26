-- Script de correction simple pour fixer les erreurs de colonnes
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes fonctions et triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings;
DROP FUNCTION IF EXISTS public.handle_booking_cancellation();

-- 2. Créer la fonction de gestion des annulations avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    cancellation_fee_percent DECIMAL DEFAULT 30;
    calculated_refund_amount DECIMAL;
    calculated_fee_amount DECIMAL;
    booking_price DECIMAL;
BEGIN
    -- Seulement si le statut passe à 'cancelled'
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
        
        RAISE NOTICE 'Début traitement annulation pour booking_id: %', NEW.id;
        RAISE NOTICE 'User ID: %, Total price: %', NEW.user_id, NEW.total_price_fcfa;
        
        -- Calculer les montants en utilisant la bonne colonne
        booking_price := NEW.total_price_fcfa;
        calculated_fee_amount := booking_price * (cancellation_fee_percent / 100);
        calculated_refund_amount := booking_price - calculated_fee_amount;
        
        RAISE NOTICE 'Calculs: price=%, fee=%, refund=%', booking_price, calculated_fee_amount, calculated_refund_amount;
        
        -- Mettre à jour la réservation avec les montants
        UPDATE public.bookings 
        SET 
            refund_amount = calculated_refund_amount,
            cancellation_fee = calculated_fee_amount
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Réservation mise à jour avec montants de remboursement';
        
        -- Vérifier si l'utilisateur existe déjà dans la table users
        -- S'il n'existe pas, on le crée avec les valeurs minimales requises
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
            RAISE NOTICE 'Utilisateur non trouvé dans table users, création avec valeurs par défaut';
            
            -- Créer l'utilisateur avec les champs obligatoires
            INSERT INTO public.users (id, email, full_name, balance)
            VALUES (
                NEW.user_id, 
                'temp@travelhub.cm', 
                'Utilisateur TravelHub',
                calculated_refund_amount
            );
            
            RAISE NOTICE 'Utilisateur créé avec solde initial de % FCFA', calculated_refund_amount;
        ELSE
            RAISE NOTICE 'Utilisateur trouvé dans table users';
            -- Créditer le solde de l'utilisateur existant
            UPDATE public.users 
            SET balance = COALESCE(balance, 0) + calculated_refund_amount
            WHERE id = NEW.user_id;
            
            RAISE NOTICE 'Solde crédité de % FCFA pour user %', calculated_refund_amount, NEW.user_id;
        END IF;
        
        -- Enregistrer la transaction dans l'historique
        INSERT INTO public.balance_transactions (user_id, booking_id, transaction_type, amount, description)
        VALUES (
            NEW.user_id, 
            NEW.id, 
            'refund', 
            calculated_refund_amount,
            CONCAT('Remboursement après annulation - Frais: ', calculated_fee_amount::TEXT, ' FCFA')
        );
        
        RAISE NOTICE 'Transaction enregistrée dans historique';
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger AFTER au lieu de BEFORE
CREATE TRIGGER trigger_booking_cancellation
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_booking_cancellation();

-- Message de confirmation
SELECT 'Trigger de remboursement configuré avec succès' AS message;
