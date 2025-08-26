-- 🧪 TEST D'INSERTION DIRECTE DANS balance_transactions
-- Script pour vérifier si on peut insérer des transactions de remboursement

-- 1. D'abord, vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'balance_transactions'
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS qui pourraient bloquer l'insertion
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

-- 3. Test d'insertion simple (REMPLACEZ VOTRE_USER_ID par votre vrai ID)
-- Décommentez et modifiez cette ligne :
/*
INSERT INTO balance_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
) VALUES (
    'VOTRE_USER_ID',  -- Remplacez par votre vrai user_id
    'refund',
    1000,
    'Test insertion manuelle'
);
*/

-- 4. Vérifier si l'insertion a fonctionné
-- Décommentez après avoir fait l'insertion :
/*
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    description,
    created_at
FROM balance_transactions 
WHERE description LIKE '%Test insertion%'
ORDER BY created_at DESC;
*/

-- 5. Vérifier s'il y a des contraintes qui pourraient bloquer
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'balance_transactions'::regclass;

-- 6. Vérifier s'il y a des triggers sur balance_transactions
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'balance_transactions';

-- Message
SELECT '🧪 Tests préparés - Modifiez le script avec votre user_id et testez' AS message;
