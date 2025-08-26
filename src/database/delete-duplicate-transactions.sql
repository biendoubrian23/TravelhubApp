-- Script simple pour supprimer PHYSIQUEMENT les transactions en double
-- ⚠️ ATTENTION: Exécutez ce script avec précaution, il va supprimer des données

-- 1. Identifier les transactions en double (même user_id, même booking_id, même montant, même type, créées le même jour)
CREATE TEMP TABLE temp_duplicate_transactions AS
SELECT 
  t2.id as duplicate_id
FROM 
  balance_transactions t1
JOIN 
  balance_transactions t2 ON (
    t1.user_id = t2.user_id AND
    t1.booking_id = t2.booking_id AND
    t1.transaction_type = t2.transaction_type AND
    t1.amount = t2.amount AND
    t1.transaction_type = 'refund' AND
    t1.id < t2.id AND
    DATE_TRUNC('day', t1.created_at) = DATE_TRUNC('day', t2.created_at)
  );

-- 2. Nombre de doublons à supprimer (exécutez seulement cette requête d'abord pour vérifier)
SELECT COUNT(*) FROM temp_duplicate_transactions;

-- 3. Supprimer les transactions en double
DELETE FROM balance_transactions
WHERE id IN (SELECT duplicate_id FROM temp_duplicate_transactions);

-- 4. Nettoyer la table temporaire
DROP TABLE temp_duplicate_transactions;
