-- 🔥 SUPPRESSION DÉFINITIVE DU TRIGGER PROBLÉMATIQUE
-- Ce trigger cause des doublons car il s'exécute en parallèle du service JavaScript

-- 1. Supprimer le trigger de remboursement automatique
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON bookings;

-- 2. Supprimer la fonction associée
DROP FUNCTION IF EXISTS handle_booking_cancellation();

-- 3. Vérifier que le trigger a bien été supprimé
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'bookings' 
AND trigger_name LIKE '%cancellation%';

-- 4. Message de confirmation
SELECT '✅ TRIGGER SUPPRIMÉ DÉFINITIVEMENT - Le service JavaScript gère maintenant tout' AS message;

-- EXPLICATION:
-- Le trigger PostgreSQL ajoutait automatiquement des transactions dans balance_transactions
-- quand une réservation était annulée, mais le service JavaScript fait déjà ce travail.
-- Résultat: double remboursement et historique incohérent.
-- 
-- Solution: Laisser UNIQUEMENT le service JavaScript gérer les remboursements.
