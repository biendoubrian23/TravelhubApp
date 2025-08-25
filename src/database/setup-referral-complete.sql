-- SCRIPT COMPLET POUR CONFIGURER LE SYSTÈME DE PARRAINAGE
-- Exécuter dans l'ordre dans l'interface SQL de Supabase

-- ==================================================
-- 1. MODIFIER LA TABLE USERS (exécuter séparément si les colonnes existent déjà)
-- ==================================================
-- Ajouter les colonnes de parrainage
ALTER TABLE users 
ADD COLUMN referral_code VARCHAR(20) UNIQUE,
ADD COLUMN referred_by_code VARCHAR(20),
ADD COLUMN total_referrals INTEGER DEFAULT 0,
ADD COLUMN total_referral_earnings INTEGER DEFAULT 0;

-- Ajouter des colonnes de base si elles n'existent pas
-- (Exécuter seulement si ces colonnes n'existent pas dans votre table users)
-- ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'client';
-- ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
-- ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- ==================================================
-- 2. CRÉER LA TABLE REFERRALS
-- ==================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' jusqu'à première réservation, puis 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL, -- Quand l'ami parrainé fait sa première réservation
  first_booking_id UUID REFERENCES bookings(id) NULL,
  
  UNIQUE(referrer_id, referred_id)
);

-- ==================================================
-- 3. CRÉER LA TABLE REFERRAL_REWARDS
-- ==================================================
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id) NOT NULL,
  referrer_id UUID REFERENCES users(id) NOT NULL, -- SEUL le parrain reçoit la récompense
  reward_amount INTEGER NOT NULL DEFAULT 500, -- Récompense UNIQUEMENT après première réservation
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP NULL,
  applied_to_booking_id UUID REFERENCES bookings(id) NULL,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '6 months'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================================================
-- 4. MODIFIER LA TABLE BOOKINGS (exécuter séparément si les colonnes existent déjà)
-- ==================================================
ALTER TABLE bookings 
ADD COLUMN original_price INTEGER,
ADD COLUMN applied_discount INTEGER DEFAULT 0,
ADD COLUMN discount_type VARCHAR(20) NULL,
ADD COLUMN referral_reward_id UUID REFERENCES referral_rewards(id) NULL;

-- ==================================================
-- 5. CRÉER LES INDEX POUR LES PERFORMANCES
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed ON referral_rewards(is_claimed);

-- ==================================================
-- 6. FONCTION POUR GÉNÉRER DES CODES UNIQUES
-- ==================================================
CREATE OR REPLACE FUNCTION generate_referral_code(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
BEGIN
    LOOP
        -- Générer code : 3 lettres du nom + 4 chiffres aléatoires + 3 lettres aléatoires
        code := UPPER(
            SUBSTR(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Za-z]', '', 'g'), 1, 3) || 
            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
            CHR(65 + FLOOR(RANDOM() * 26)::INT) ||
            CHR(65 + FLOOR(RANDOM() * 26)::INT) ||
            CHR(65 + FLOOR(RANDOM() * 26)::INT)
        );
        
        -- Si le nom est trop court, compléter avec des lettres aléatoires
        IF LENGTH(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Za-z]', '', 'g')) < 3 THEN
            code := UPPER(
                LPAD(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Za-z]', '', 'g'), 3, 'X') || 
                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
                CHR(65 + FLOOR(RANDOM() * 26)::INT) ||
                CHR(65 + FLOOR(RANDOM() * 26)::INT) ||
                CHR(65 + FLOOR(RANDOM() * 26)::INT)
            );
        END IF;
        
        -- Vérifier l'unicité
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
        
        attempt_count := attempt_count + 1;
        
        -- Éviter les boucles infinies
        IF NOT code_exists OR attempt_count > 100 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 7. TRIGGER POUR AUTO-GÉNÉRATION DES CODES
-- ==================================================
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Générer automatiquement un code de parrainage pour TOUS les utilisateurs clients
    IF NEW.referral_code IS NULL AND (NEW.user_type IS NULL OR NEW.user_type = 'client' OR NEW.role = 'client') THEN
        NEW.referral_code := generate_referral_code(NEW.full_name, NEW.id);
        
        -- S'assurer que le code a été généré
        IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
            NEW.referral_code := 'USER' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || 'REF';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_referral_code ON users;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_auto_referral_code
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_referral_code();

-- ==================================================
-- 8. MISE À JOUR DES UTILISATEURS EXISTANTS
-- ==================================================
-- Générer des codes pour TOUS les utilisateurs existants qui n'en ont pas
UPDATE users 
SET referral_code = generate_referral_code(full_name, id)
WHERE referral_code IS NULL 
  AND (user_type IS NULL OR user_type = 'client' OR role = 'client');

-- ==================================================
-- 9. VÉRIFICATION FINALE
-- ==================================================
-- Vérifier que tous les clients ont maintenant un code
SELECT 
  COUNT(*) as total_clients,
  COUNT(referral_code) as clients_avec_code,
  COUNT(*) - COUNT(referral_code) as clients_sans_code
FROM users 
WHERE user_type IS NULL OR user_type = 'client' OR role = 'client';

-- Afficher quelques codes générés
SELECT full_name, referral_code 
FROM users 
WHERE referral_code IS NOT NULL 
LIMIT 10;

-- ==================================================
-- TERMINÉ ! 
-- ==================================================
-- Tous les clients ont maintenant leur code de parrainage unique
-- Le système de parrainage est entièrement configuré
