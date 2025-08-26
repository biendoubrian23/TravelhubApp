-- 🧪 TEST SIMPLE D'INSERTION DANS balance_transactions
-- Copiez-collez dans Supabase SQL Editor

-- 1. Voir la structure de la table
\d balance_transactions;

-- 2. Test d'insertion simple (MODIFIEZ VOTRE_USER_ID)
INSERT INTO balance_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
) VALUES (
    'METTEZ_VOTRE_USER_ID_ICI',  -- IMPORTANT: Remplacez par votre vrai user_id
    'refund',
    1500,
    'Test manuel insertion remboursement'
);

-- 3. Vérifier que ça a marché
SELECT * FROM balance_transactions 
WHERE description = 'Test manuel insertion remboursement'
ORDER BY created_at DESC;
