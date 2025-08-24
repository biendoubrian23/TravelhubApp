-- Mise à jour de la contrainte payment_method pour supporter mtn_momo
-- Exécuter ce script sur votre base de données Supabase

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

-- 2. Ajouter la nouvelle contrainte avec mtn_momo
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IN ('stripe', 'orange_money', 'mtn_momo', 'cash'));

-- 3. Optionnel: Mettre à jour la valeur par défaut
ALTER TABLE bookings ALTER COLUMN payment_method SET DEFAULT 'orange_money';

-- Vérification que la contrainte a été ajoutée
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND conname = 'bookings_payment_method_check';
