-- Script pour vérifier la structure de la table bookings
-- Exécuter dans Supabase SQL Editor

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Si certaines colonnes manquent pour le système de parrainage, ajoutez-les :

-- ALTER TABLE bookings ADD COLUMN original_price INTEGER;
-- ALTER TABLE bookings ADD COLUMN applied_discount INTEGER DEFAULT 0;
-- ALTER TABLE bookings ADD COLUMN discount_type VARCHAR(20) NULL;
-- ALTER TABLE bookings ADD COLUMN referral_reward_id UUID REFERENCES referral_rewards(id) NULL;
