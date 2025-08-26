-- Script pour désactiver temporairement le trigger de remboursement automatique
-- PROBLÈME: Le trigger ajoute automatiquement le remboursement en plus du service JavaScript
-- SOLUTION: Désactiver temporairement pour tester

-- 1. Désactiver le trigger
DROP TRIGGER IF EXISTS trigger_booking_cancellation ON public.bookings;

-- Message de confirmation
SELECT 'Trigger de remboursement automatique DÉSACTIVÉ pour test' AS message;

-- Pour réactiver plus tard:
-- CREATE TRIGGER trigger_booking_cancellation
--     BEFORE UPDATE ON public.bookings
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_booking_cancellation();
