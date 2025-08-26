-- 🔍 SCRIPT COMPLET POUR VOIR TOUS LES REMBOURSEMENTS
-- À exécuter dans Supabase SQL Editor

-- 1. Voir tous les remboursements dans l'historique des transactions
SELECT 
    'TRANSACTIONS' as source,
    id,
    user_id,
    booking_id,
    transaction_type,
    amount,
    description,
    created_at
FROM balance_transactions 
WHERE transaction_type = 'refund'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Voir toutes les réservations annulées
SELECT 
    'RESERVATIONS' as source,
    id,
    booking_reference,
    user_id,
    booking_status,
    total_price_fcfa,
    refund_amount,
    cancellation_fee,
    created_at as reservation_date,
    updated_at as annulation_date
FROM bookings 
WHERE booking_status = 'cancelled'
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Croiser les données : réservations annulées avec leurs transactions
SELECT 
    b.booking_reference,
    b.total_price_fcfa,
    b.refund_amount as refund_in_booking,
    b.cancellation_fee,
    bt.amount as refund_in_transactions,
    bt.description,
    b.updated_at as annulation_date,
    bt.created_at as transaction_date
FROM bookings b
LEFT JOIN balance_transactions bt ON b.id = bt.booking_id AND bt.transaction_type = 'refund'
WHERE b.booking_status = 'cancelled'
ORDER BY b.updated_at DESC
LIMIT 10;

-- 4. Compter les remboursements par utilisateur
SELECT 
    user_id,
    COUNT(*) as nombre_remboursements,
    SUM(amount) as total_rembourse
FROM balance_transactions 
WHERE transaction_type = 'refund'
GROUP BY user_id
ORDER BY total_rembourse DESC;

-- Message final
SELECT '🔍 Analyse complète des remboursements terminée' as message;
