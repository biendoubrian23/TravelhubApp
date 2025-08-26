-- 🧪 VÉRIFICATION DES COLONNES POUR PAIEMENT MIXTE
-- Script pour vérifier si la table bookings peut stocker les infos de paiement mixte

-- 1. Vérifier la structure actuelle de la table bookings
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name LIKE '%payment%'
ORDER BY ordinal_position;

-- 2. Vérifier si les colonnes de paiement mixte existent
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN (
    'mixed_payment_balance_amount',
    'mixed_payment_mobile_amount', 
    'mixed_payment_mobile_provider',
    'mixed_payment_phone'
);

-- 3. Si les colonnes n'existent pas, voici les commandes pour les ajouter :
/*
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mixed_payment_balance_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mixed_payment_mobile_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mixed_payment_mobile_provider TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mixed_payment_phone TEXT;
*/

-- 4. Test d'insertion de paiement mixte (remplacez les valeurs par des vraies)
/*
INSERT INTO bookings (
    trip_id, user_id, seat_number, passenger_name, passenger_phone,
    total_price_fcfa, booking_reference, booking_status, payment_status,
    payment_method, mixed_payment_balance_amount, mixed_payment_mobile_amount,
    mixed_payment_mobile_provider, mixed_payment_phone
) VALUES (
    'TRIP_ID_TEST',
    'USER_ID_TEST', 
    'A1',
    'Test Mixte',
    '+237600000000',
    50000,
    'TH-TEST-MIXTE',
    'confirmed',
    'pending',
    'mixed',
    30000,
    20000,
    'orange_money',
    '+237612345678'
);
*/

-- Message
SELECT '🧪 Vérification colonnes paiement mixte terminée' AS message;
