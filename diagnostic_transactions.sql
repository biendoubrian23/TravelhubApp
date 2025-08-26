-- 🔍 DIAGNOSTIC COMPLET : Vérification des transactions et obstacles
-- À exécuter dans Supabase SQL Editor pour identifier les problèmes

-- 1. VÉRIFIER LES TRIGGERS ACTIFS SUR balance_transactions
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'balance_transactions';

-- 2. VÉRIFIER LES POLITIQUES RLS
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

-- 3. VÉRIFIER SI LA VUE clean_balance_transactions EXISTE
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'clean_balance_transactions';

-- 4. COMPTER LES TRANSACTIONS DIRECTEMENT DANS LA TABLE (dernières 24h)
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_type = 'refund' THEN 1 END) as refunds,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_transactions
FROM public.balance_transactions;

-- 5. COMPARER AVEC LA VUE (si elle existe)
SELECT 
    COUNT(*) as vue_transactions,
    COUNT(CASE WHEN transaction_type = 'refund' THEN 1 END) as vue_refunds,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as vue_recent
FROM public.clean_balance_transactions;

-- 6. VOIR LES DERNIÈRES TRANSACTIONS CRÉÉES (directement dans la table)
SELECT 
    id,
    user_id,
    booking_id,
    transaction_type,
    amount,
    description,
    created_at
FROM public.balance_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. VOIR CE QUE RETOURNE LA VUE (si elle existe)
SELECT 
    id,
    user_id,
    booking_id,
    transaction_type,
    amount,
    description,
    created_at
FROM public.clean_balance_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. VÉRIFIER LES PERMISSIONS SUR LES TABLES
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('balance_transactions', 'clean_balance_transactions')
AND grantee IN ('authenticated', 'anon', 'service_role');

-- Message final
SELECT '🔍 Diagnostic terminé - Vérifiez les résultats ci-dessus' as message;
