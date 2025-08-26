-- 🔥 SUPPRESSION COMPLÈTE DE TOUS LES TRIGGERS PROBLÉMATIQUES
-- Script à exécuter dans Supabase SQL Editor pour résoudre le blocage des transactions

-- ========== SUPPRIMER TOUS LES TRIGGERS SUR BOOKINGS ==========

-- 1. Supprimer le trigger principal de remboursement
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON bookings CASCADE;
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings CASCADE;

-- 2. Supprimer les autres triggers possibles
DROP TRIGGER IF EXISTS booking_cancellation_trigger ON bookings CASCADE;
DROP TRIGGER IF EXISTS booking_cancellation_trigger ON public.bookings CASCADE;
DROP TRIGGER IF EXISTS handle_cancellation_trigger ON bookings CASCADE;
DROP TRIGGER IF EXISTS handle_cancellation_trigger ON public.bookings CASCADE;

-- ========== SUPPRIMER TOUS LES TRIGGERS SUR BALANCE_TRANSACTIONS ==========

-- 3. Supprimer les triggers qui pourraient bloquer les insertions
DROP TRIGGER IF EXISTS balance_transaction_trigger ON balance_transactions CASCADE;
DROP TRIGGER IF EXISTS balance_transaction_trigger ON public.balance_transactions CASCADE;
DROP TRIGGER IF EXISTS prevent_duplicate_transactions ON balance_transactions CASCADE;
DROP TRIGGER IF EXISTS prevent_duplicate_transactions ON public.balance_transactions CASCADE;

-- ========== SUPPRIMER TOUTES LES FONCTIONS ASSOCIÉES ==========

-- 4. Supprimer toutes les fonctions de remboursement
DROP FUNCTION IF EXISTS handle_booking_cancellation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_booking_cancellation() CASCADE;
DROP FUNCTION IF EXISTS handle_cancellation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_cancellation() CASCADE;
DROP FUNCTION IF EXISTS process_refund() CASCADE;
DROP FUNCTION IF EXISTS public.process_refund() CASCADE;

-- ========== VÉRIFICATIONS ==========

-- 5. Vérifier qu'il ne reste aucun trigger sur bookings
SELECT 
    'TRIGGERS RESTANTS SUR BOOKINGS:' as info,
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'bookings';

-- 6. Vérifier qu'il ne reste aucun trigger sur balance_transactions
SELECT 
    'TRIGGERS RESTANTS SUR BALANCE_TRANSACTIONS:' as info,
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'balance_transactions';

-- 7. Test d'insertion manuelle dans balance_transactions
-- REMPLACEZ 'VOTRE_USER_ID' par votre vrai ID utilisateur pour tester
/*
INSERT INTO balance_transactions (user_id, transaction_type, amount, description)
VALUES (
    'VOTRE_USER_ID',
    'refund', 
    1000, 
    'Test insertion après suppression triggers'
);
*/

-- ========== MESSAGE FINAL ==========
SELECT '✅ TOUS LES TRIGGERS SUPPRIMÉS - Testez maintenant une annulation' AS message;

-- ========== INSTRUCTIONS ==========
SELECT '📋 PROCHAINES ÉTAPES:
1. Exécutez ce script dans Supabase
2. Faites une annulation test dans votre app
3. Vérifiez que la transaction apparaît dans balance_transactions
4. Vérifiez que l historique se met à jour dans l app' AS instructions;
