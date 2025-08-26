-- 🔍 DIAGNOSTIC COMPLET APRÈS SUPPRESSION DU TRIGGER
-- À exécuter après avoir supprimé le trigger problématique

-- 1. Vérifier qu'il n'y a plus de triggers sur bookings
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'bookings';

-- 2. Vérifier qu'il n'y a plus de triggers sur balance_transactions
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'balance_transactions';

-- 3. Vérifier les politiques RLS sur balance_transactions
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'balance_transactions';

-- 4. Tester l'insertion manuelle d'une transaction
-- (remplacez USER_ID_TEST par votre vrai ID utilisateur)
/*
INSERT INTO balance_transactions (user_id, transaction_type, amount, description)
VALUES (
    'USER_ID_TEST',
    'refund', 
    1000, 
    'Test après suppression trigger'
);
*/

-- 5. Voir les dernières transactions
SELECT 
    id,
    user_id,
    booking_id,
    transaction_type,
    amount,
    description,
    created_at
FROM balance_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Message final
SELECT '🔍 Diagnostic post-suppression terminé' as message;
