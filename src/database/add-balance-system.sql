-- ============================================================================
-- AJOUT DU SYSTÈME DE SOLDE UTILISATEUR ET FRAIS D'ANNULATION
-- ============================================================================

-- 1. Ajouter la colonne balance à la table users/profiles
ALTER TABLE public.users 
ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;

-- Si vous utilisez la table profiles au lieu de users
-- ALTER TABLE public.profiles 
-- ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;

-- 2. Ajouter les colonnes pour les remboursements dans la table bookings
ALTER TABLE public.bookings 
ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN cancellation_fee DECIMAL(10,2) DEFAULT NULL;

-- 3. Créer une table pour les paramètres globaux de l'application
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Insérer le paramètre pour les frais d'annulation (par défaut 30%)
INSERT INTO public.app_settings (setting_key, setting_value, description) 
VALUES ('cancellation_fee_percent', '30', 'Pourcentage de frais d''annulation appliqué lors d''un remboursement')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- 5. Créer une table pour l'historique des transactions de solde
CREATE TABLE IF NOT EXISTS public.balance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('refund', 'payment', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Fonction pour gérer les remboursements automatiques
CREATE OR REPLACE FUNCTION handle_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    cancellation_fee_percent DECIMAL;
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
        
        -- Créditer le solde de l'utilisateur
        UPDATE public.users 
        SET balance = balance + refund_amount
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

-- 7. Créer le trigger pour les annulations
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings;
CREATE TRIGGER trigger_booking_cancellation
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_cancellation();

-- 8. Fonction pour traiter les paiements avec solde
CREATE OR REPLACE FUNCTION process_payment_with_balance(
    p_user_id UUID,
    p_trip_id UUID,
    p_seat_numbers INTEGER[],
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
    
    -- Créer la réservation
    INSERT INTO public.bookings (
        user_id, 
        trip_id, 
        seat_numbers, 
        total_price_fcfa, 
        payment_method,
        status,
        payment_status
    ) VALUES (
        p_user_id,
        p_trip_id,
        p_seat_numbers,
        p_total_price,
        p_payment_method,
        'confirmed',
        CASE WHEN balance_sufficient THEN 'paid' ELSE 'pending' END
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

-- 9. Politique RLS pour les nouvelles tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut UNIQUEMENT LIRE les paramètres de l'app
-- (modification réservée pour la gestion super admin future)
CREATE POLICY "Everyone can read app settings" ON public.app_settings
    FOR SELECT USING (true);

-- Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view their own transactions" ON public.balance_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 10. Vue pour faciliter les requêtes de solde avec historique
CREATE OR REPLACE VIEW user_balance_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    u.balance as current_balance,
    COALESCE(refunds.total_refunds, 0) as total_refunds,
    COALESCE(payments.total_payments, 0) as total_payments,
    COALESCE(transactions.transaction_count, 0) as transaction_count
FROM public.users u
LEFT JOIN (
    SELECT 
        user_id, 
        SUM(amount) as total_refunds 
    FROM public.balance_transactions 
    WHERE transaction_type = 'refund' 
    GROUP BY user_id
) refunds ON u.id = refunds.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        SUM(ABS(amount)) as total_payments 
    FROM public.balance_transactions 
    WHERE transaction_type = 'payment' 
    GROUP BY user_id
) payments ON u.id = payments.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        COUNT(*) as transaction_count 
    FROM public.balance_transactions 
    GROUP BY user_id
) transactions ON u.id = transactions.user_id;

-- 11. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON public.balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_booking_id ON public.balance_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_users_balance ON public.users(balance);

COMMENT ON TABLE public.balance_transactions IS 'Historique des transactions de solde utilisateur';
COMMENT ON TABLE public.app_settings IS 'Paramètres globaux de l''application (lecture seule pour les utilisateurs)';
COMMENT ON COLUMN public.users.balance IS 'Solde actuel de l''utilisateur en FCFA';
COMMENT ON COLUMN public.bookings.refund_amount IS 'Montant remboursé après annulation';
COMMENT ON COLUMN public.bookings.cancellation_fee IS 'Frais d''annulation retenus';
