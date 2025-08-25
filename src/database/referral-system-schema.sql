-- ==============================================
-- SYSTÈME DE PARRAINAGE TRAVELHUB
-- ==============================================

-- 1. Modifier la table users pour ajouter les champs de parrainage
ALTER TABLE users 
ADD COLUMN referral_code VARCHAR(20) UNIQUE,
ADD COLUMN referred_by_code VARCHAR(20),
ADD COLUMN total_referrals INTEGER DEFAULT 0,
ADD COLUMN total_referral_earnings INTEGER DEFAULT 0; -- En FCFA

-- 2. Créer la table des parrainages
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) NOT NULL,     -- Celui qui parraine
  referred_id UUID REFERENCES users(id) NOT NULL,     -- Celui qui est parrainé
  referral_code VARCHAR(20) NOT NULL,                 -- Code utilisé
  status VARCHAR(20) DEFAULT 'pending',               -- 'pending', 'completed', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,                        -- Quand le premier voyage a été fait
  first_booking_id UUID REFERENCES bookings(id) NULL, -- Premier voyage du parrainé
  
  UNIQUE(referrer_id, referred_id),  -- Éviter les doublons
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_referred (referred_id),
  INDEX idx_referrals_code (referral_code)
);

-- 3. Créer la table des récompenses de parrainage
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) NOT NULL,
  referrer_id UUID REFERENCES users(id) NOT NULL,    -- Qui reçoit la récompense
  reward_amount INTEGER NOT NULL DEFAULT 500,        -- 500 FCFA
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP NULL,
  applied_to_booking_id UUID REFERENCES bookings(id) NULL, -- Réservation où la réduction a été appliquée
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '6 months'), -- Expire après 6 mois
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_rewards_referrer (referrer_id),
  INDEX idx_rewards_claimed (is_claimed),
  INDEX idx_rewards_expires (expires_at)
);

-- 4. Modifier la table bookings pour les réductions
ALTER TABLE bookings 
ADD COLUMN original_price INTEGER,                   -- Prix original avant réduction
ADD COLUMN applied_discount INTEGER DEFAULT 0,      -- Montant de la réduction appliquée
ADD COLUMN discount_type VARCHAR(20) NULL,          -- 'referral', 'promo', etc.
ADD COLUMN referral_reward_id UUID REFERENCES referral_rewards(id) NULL; -- Lien vers la récompense utilisée

-- 5. Créer une fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code basé sur le nom et l'ID
        code := UPPER(
            SUBSTR(REGEXP_REPLACE(user_name, '[^A-Za-z]', '', 'g'), 1, 3) || 
            SUBSTR(REPLACE(user_id::TEXT, '-', ''), 1, 4) ||
            SUBSTR(MD5(RANDOM()::TEXT), 1, 3)
        );
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
        
        -- Si le code n'existe pas, on le retourne
        IF NOT code_exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour générer automatiquement un code de parrainage à la création d'un utilisateur
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Générer un code de parrainage uniquement si il n'en a pas déjà un
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code(NEW.full_name, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_referral_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- 7. Créer des vues pour faciliter les requêtes

-- Vue pour les statistiques de parrainage d'un utilisateur
CREATE VIEW user_referral_stats AS
SELECT 
    u.id,
    u.referral_code,
    u.total_referrals,
    u.total_referral_earnings,
    COUNT(r.id) as active_referrals,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
    COALESCE(SUM(CASE WHEN rw.is_claimed = false AND rw.expires_at > NOW() THEN rw.reward_amount ELSE 0 END), 0) as available_rewards
FROM users u
LEFT JOIN referrals r ON u.id = r.referrer_id
LEFT JOIN referral_rewards rw ON u.id = rw.referrer_id
GROUP BY u.id, u.referral_code, u.total_referrals, u.total_referral_earnings;

-- Vue pour l'historique des récompenses
CREATE VIEW referral_rewards_history AS
SELECT 
    rw.*,
    r.referred_id,
    u_referred.full_name as referred_name,
    u_referred.email as referred_email,
    r.created_at as referral_date,
    r.completed_at as referral_completed_date
FROM referral_rewards rw
JOIN referrals r ON rw.referral_id = r.id
JOIN users u_referred ON r.referred_id = u_referred.id;

-- 8. Insérer des données de test (optionnel)
-- Vous pouvez commenter cette section en production
/*
-- Mettre à jour les utilisateurs existants avec des codes de parrainage
UPDATE users 
SET referral_code = generate_referral_code(full_name, id)
WHERE referral_code IS NULL;
*/
