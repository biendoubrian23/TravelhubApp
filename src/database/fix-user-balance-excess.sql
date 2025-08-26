-- Script pour corriger les soldes utilisateurs affectés par des remboursements en double
-- Exécuter dans Supabase SQL Editor

-- ÉTAPE 1: Identifier les transactions en double de la dernière semaine
WITH duplicate_refunds AS (
  SELECT 
    user_id,
    booking_id,
    amount,
    created_at,
    LAG(amount) OVER (PARTITION BY user_id, booking_id ORDER BY created_at) as prev_amount,
    LAG(created_at) OVER (PARTITION BY user_id, booking_id ORDER BY created_at) as prev_created_at,
    COUNT(*) OVER (PARTITION BY user_id, booking_id) as refund_count
  FROM balance_transactions
  WHERE 
    transaction_type = 'refund'
    AND created_at >= NOW() - INTERVAL '7 days'
),
duplicates_to_fix AS (
  SELECT 
    user_id,
    SUM(amount) as excess_amount, -- Montant total à retirer du solde
    COUNT(*) as duplicate_count
  FROM duplicate_refunds
  WHERE refund_count > 1  -- Uniquement où il y a plus d'une transaction pour la même réservation
  GROUP BY user_id
)

-- ÉTAPE 2: Afficher les utilisateurs affectés et leur solde excessif
SELECT
  dtf.user_id,
  u.balance as current_balance,
  dtf.excess_amount,
  dtf.duplicate_count,
  u.balance - dtf.excess_amount/2 as corrected_balance
FROM 
  duplicates_to_fix dtf
JOIN 
  users u ON dtf.user_id = u.id;

-- ÉTAPE 3: Corriger les soldes (décommenter pour appliquer)
/*
UPDATE users
SET balance = users.balance - dtf.excess_amount/2  -- On divise par 2 car on veut supprimer le montant en trop
FROM duplicates_to_fix dtf
WHERE users.id = dtf.user_id;
*/

-- ÉTAPE 4: Marquer les transactions en double comme "corrigées" (optionnel)
/*
WITH duplicate_marks AS (
  SELECT
    t1.id,
    'Doublon corrigé le ' || NOW()::text as corrected_mark
  FROM balance_transactions t1
  JOIN balance_transactions t2 ON (
    t1.user_id = t2.user_id AND
    t1.booking_id = t2.booking_id AND
    t1.transaction_type = t2.transaction_type AND
    t1.amount = t2.amount AND
    t1.transaction_type = 'refund' AND
    t1.created_at > t2.created_at AND
    t1.created_at - t2.created_at < INTERVAL '30 minutes'
  )
  WHERE t1.created_at >= NOW() - INTERVAL '7 days'
)
UPDATE balance_transactions
SET description = balance_transactions.description || ' - ' || dm.corrected_mark
FROM duplicate_marks dm
WHERE balance_transactions.id = dm.id;
*/

-- ÉTAPE BONUS: Audit des changements
/*
INSERT INTO balance_transactions (
  user_id, 
  transaction_type,
  amount,
  description
)
SELECT
  user_id,
  'adjustment',
  -excess_amount/2,
  'Correction automatique pour doublon de remboursement'
FROM duplicates_to_fix;
*/
