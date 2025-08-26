-- 🔄 TRIGGER SPÉCIALISÉ UNIQUEMENT POUR REMPLIR LA BD
-- Ce trigger s'active SEULEMENT quand booking_status passe à 'cancelled'
-- Il crée UNIQUEMENT la transaction dans balance_transactions
-- Il ne touche PAS au solde utilisateur (géré par le JavaScript)

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_refund_on_cancellation ON bookings;
DROP FUNCTION IF EXISTS handle_refund_on_cancellation();

-- 2. Créer la fonction qui REMPLIT UNIQUEMENT LA BD
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
        
        RAISE NOTICE 'TRIGGER BD: Enregistrement transaction pour booking % (user %)', NEW.id, NEW.user_id;
        
        -- Calculer les montants
        booking_price := NEW.total_price_fcfa;
        calculated_fee_amount := booking_price * (cancellation_fee_percent / 100);
        calculated_refund_amount := booking_price - calculated_fee_amount;
        
        RAISE NOTICE 'CALCULS BD: prix=%, frais=%, remboursement=%', booking_price, calculated_fee_amount, calculated_refund_amount;
        
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
            
            RAISE NOTICE 'INSERTION BD: Création transaction dans balance_transactions';
            
            -- UNIQUEMENT CRÉER LA TRANSACTION - PAS DE MISE À JOUR DU SOLDE
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
            
            RAISE NOTICE 'TRANSACTION BD CRÉÉE: % FCFA pour user % (SOLDE NON MODIFIÉ)', calculated_refund_amount, NEW.user_id;
            
            -- ❌ PAS DE MISE À JOUR DU SOLDE - C'EST LE JAVASCRIPT QUI S'EN CHARGE
            -- UPDATE users SET balance = COALESCE(balance, 0) + calculated_refund_amount WHERE id = NEW.user_id;
            
        ELSE
            RAISE NOTICE 'TRANSACTION BD DÉJÀ EXISTANTE: Pas de doublon créé';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger AFTER UPDATE
CREATE TRIGGER trigger_refund_on_cancellation
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_refund_on_cancellation();

-- 4. Message de confirmation
SELECT '✅ TRIGGER BD UNIQUEMENT CRÉÉ - Remplit seulement balance_transactions' AS message;

-- 5. Instructions
SELECT 'FONCTIONNEMENT:
1. JavaScript annule la réservation ET met à jour le solde
2. Trigger PostgreSQL ajoute UNIQUEMENT la transaction dans balance_transactions
3. L historique s affiche avec les nouvelles transactions
4. Pas de doublon de mise à jour du solde' AS instructions;
