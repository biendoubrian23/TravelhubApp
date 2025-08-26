-- 🚨 SOLUTION TEMPORAIRE : Contourner les filtres qui cachent les transactions
-- À exécuter dans Supabase SQL Editor

-- 1. DÉSACTIVER TEMPORAIREMENT LA VUE (si elle cause des problèmes)
-- DROP VIEW IF EXISTS public.clean_balance_transactions;

-- 2. VÉRIFIER QUE LES NOUVELLES TRANSACTIONS SONT BIEN CRÉÉES
SELECT 
    'Nouvelles transactions remboursement (dernières 2 heures)' as info,
    COUNT(*) as count
FROM public.balance_transactions 
WHERE transaction_type = 'refund' 
AND created_at > NOW() - INTERVAL '2 hours';

-- 3. VOIR LES DÉTAILS DES DERNIÈRES TRANSACTIONS
SELECT 
    'Détails des 5 dernières transactions' as info;
    
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    description,
    created_at
FROM public.balance_transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. SI AUCUNE TRANSACTION N'APPARAÎT, VÉRIFIER LES TRIGGERS ACTIFS
SELECT 
    'Triggers qui pourraient bloquer' as info;
    
SELECT 
    trigger_name, 
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'balance_transactions'
AND trigger_name LIKE '%cleanup%';

-- 5. TESTER LA CRÉATION MANUELLE D'UNE TRANSACTION
-- INSERT INTO public.balance_transactions (
--     user_id, 
--     booking_id, 
--     transaction_type, 
--     amount, 
--     description
-- ) VALUES (
--     (SELECT auth.uid()), 
--     'test-booking-123', 
--     'refund', 
--     1000, 
--     'Test transaction - should appear'
-- );

SELECT 'Diagnostic terminé - Vérifiez les résultats' as message;
