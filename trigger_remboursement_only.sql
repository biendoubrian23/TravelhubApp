-- 🔄 TRIGGER SPÉCIALISÉ POUR LES REMBOURSEMENTS UNIQUEMENT
-- Ce trigger s'active SEULEMENT quand booking_status passe à 'cancelled'
-- Il crée la transaction de remboursement dans balance_transactions

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_refund_on_cancellation ON bookings;
DROP FUNCTION IF EXISTS handle_refund_on_cancellation();

-- 2. Créer la fonction spécialisée pour les remboursements
CREATE OR REPLACE FUNCTION handle_refund_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    cancellation_fee_percent DECIMAL DEFAULT 30;
    calculated_refund_amount DECIMAL;
    calculated_fee_amount DECIMAL;
    booking_price DECIMAL;
    refund_description TEXT;
BEGIN
    -- Seulement si le statut passe à 'cancelled' ET qu'il n'était pas déjà cancelled
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
        
        RAISE NOTICE 'TRIGGER REMBOURSEMENT: booking_id % annulé par user %', NEW.id, NEW.user_id;
        
        -- Calculer les montants
        booking_price := NEW.total_price_fcfa;
        calculated_fee_amount := booking_price * (cancellation_fee_percent / 100);
        calculated_refund_amount := booking_price - calculated_fee_amount;
        
        RAISE NOTICE 'CALCULS: prix=%, frais=%, remboursement=%', booking_price, calculated_fee_amount, calculated_refund_amount;
        
        -- Mettre à jour la réservation avec les montants
        UPDATE bookings 
        SET 
            refund_amount = calculated_refund_amount,
            cancellation_fee = calculated_fee_amount
        WHERE id = NEW.id;
        
        -- Créer une description détaillée
        refund_description := CONCAT(
            'Remboursement après annulation - ',
            'Frais: ', calculated_fee_amount::TEXT, ' FCFA (',
            cancellation_fee_percent::TEXT, '%)'
        );
        
        -- Vérifier si une transaction de remboursement existe déjà pour cette réservation
        IF NOT EXISTS (
            SELECT 1 FROM balance_transactions 
            WHERE booking_id = NEW.id 
            AND transaction_type = 'refund'
            AND user_id = NEW.user_id
        ) THEN
            
            RAISE NOTICE 'CRÉATION TRANSACTION: Ajout dans balance_transactions';
            
            -- Créer la transaction de remboursement
            INSERT INTO balance_transactions (
                user_id, 
                booking_id, 
                transaction_type, 
                amount, 
                description,
                created_at
            ) VALUES (
                NEW.user_id, 
                NEW.id, 
                'refund', 
                calculated_refund_amount,
                refund_description,
                NOW()
            );
            
            RAISE NOTICE 'TRANSACTION CRÉÉE: % FCFA pour user %', calculated_refund_amount, NEW.user_id;
            
            -- Mettre à jour le solde utilisateur
            UPDATE users 
            SET balance = COALESCE(balance, 0) + calculated_refund_amount
            WHERE id = NEW.user_id;
            
            RAISE NOTICE 'SOLDE MIS À JOUR: +% FCFA pour user %', calculated_refund_amount, NEW.user_id;
            
        ELSE
            RAISE NOTICE 'TRANSACTION DÉJÀ EXISTANTE: Pas de doublon créé';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger AFTER UPDATE pour éviter les conflits
CREATE TRIGGER trigger_refund_on_cancellation
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_refund_on_cancellation();

-- 4. Vérification : s'assurer que le trigger est créé
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_refund_on_cancellation';

-- 5. Message de confirmation
SELECT '✅ TRIGGER DE REMBOURSEMENT CRÉÉ - Testez une annulation maintenant' AS message;

-- 6. Instructions
SELECT 'INSTRUCTIONS:
1. Faites une annulation test dans votre app
2. Vérifiez que la transaction apparaît dans balance_transactions
3. Vérifiez que votre solde se met à jour
4. Vérifiez que l historique s affiche dans l app' AS instructions;
