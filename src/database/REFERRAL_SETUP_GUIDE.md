# Guide d'Implémentation du Système de Parrainage TravelHub

## Étape 1 : Modifications de la Base de Données

### 1. Modifier la table `users`
```sql
ALTER TABLE users 
ADD COLUMN referral_code VARCHAR(20) UNIQUE,
ADD COLUMN referred_by_code VARCHAR(20),
ADD COLUMN total_referrals INTEGER DEFAULT 0,
ADD COLUMN total_referral_earnings INTEGER DEFAULT 0;
```

### 2. Créer la table `referrals`
```sql
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
```

### 3. Créer la table `referral_rewards`
```sql
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
```

### 4. Modifier la table `bookings`
```sql
ALTER TABLE bookings 
ADD COLUMN original_price INTEGER,
ADD COLUMN applied_discount INTEGER DEFAULT 0,
ADD COLUMN discount_type VARCHAR(20) NULL,
ADD COLUMN referral_reward_id UUID REFERENCES referral_rewards(id) NULL;
```

### 5. Créer des index pour les performances
```sql
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_rewards_claimed ON referral_rewards(is_claimed);
```

## Étape 2 : Fonctions de Génération de Codes

### Fonction PostgreSQL pour générer des codes uniques
```sql
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
```

### Trigger pour auto-génération (OBLIGATOIRE pour tous les clients)
```sql
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Générer automatiquement un code de parrainage pour TOUS les utilisateurs clients
    IF NEW.referral_code IS NULL AND (NEW.user_type IS NULL OR NEW.user_type = 'client') THEN
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
```

## Étape 3 : Mise à jour des utilisateurs existants

```sql
-- Générer des codes pour TOUS les utilisateurs existants qui n'en ont pas
UPDATE users 
SET referral_code = generate_referral_code(full_name, id)
WHERE referral_code IS NULL 
  AND (user_type IS NULL OR user_type = 'client');

-- Vérifier que tous les clients ont maintenant un code
SELECT 
  COUNT(*) as total_clients,
  COUNT(referral_code) as clients_avec_code,
  COUNT(*) - COUNT(referral_code) as clients_sans_code
FROM users 
WHERE user_type IS NULL OR user_type = 'client';
```

## Instructions d'exécution

1. Connectez-vous à votre base de données Supabase
2. Exécutez les commandes SQL dans l'ordre donné
3. Vérifiez que toutes les tables et fonctions ont été créées
4. Testez la génération automatique de codes en créant un utilisateur test

## Vérification

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('referrals', 'referral_rewards');

-- Vérifier les nouvelles colonnes
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE '%referral%';
```
