-- Script pour nettoyer les transactions de remboursement en double et configurer la protection contre les duplications
-- Exécuter dans Supabase SQL Editor

-- PARTIE 1: CONFIGURATION DU SYSTÈME DE VERROUS DE TRANSACTION

-- Créer la table des verrous de transaction (pour empêcher les doublons)
CREATE TABLE IF NOT EXISTS public.transaction_locks (
    id TEXT PRIMARY KEY, -- ID de transaction unique (userId-bookingId-timestamp)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, booking_id, amount) -- Contrainte unique pour éviter les doublons
);

-- Ajouter les indices pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_transaction_locks_user_id ON public.transaction_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_locks_booking_id ON public.transaction_locks(booking_id);
CREATE INDEX IF NOT EXISTS idx_transaction_locks_expires_at ON public.transaction_locks(expires_at);

-- Ajouter une politique RLS pour que seuls les utilisateurs puissent voir leurs propres verrous
ALTER TABLE public.transaction_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transaction locks" ON public.transaction_locks;
CREATE POLICY "Users can view own transaction locks" ON public.transaction_locks
    FOR SELECT USING (auth.uid() = user_id);

-- Ajouter la référence à la table des transactions
ALTER TABLE public.balance_transactions 
ADD COLUMN IF NOT EXISTS transaction_lock_id TEXT REFERENCES public.transaction_locks(id);

-- PARTIE 2: IDENTIFICATION ET NETTOYAGE DES DOUBLONS EXISTANTS

-- 1 & 2. Identifier et afficher les transactions en double
WITH duplicate_transactions AS (
  SELECT 
    bt1.id as id_to_keep,
    bt2.id as id_to_delete,
    bt1.user_id,
    bt1.amount,
    bt1.created_at as first_created,
    bt2.created_at as duplicate_created,
    bt1.description as first_description,
    bt2.description as duplicate_description
  FROM balance_transactions bt1
  JOIN balance_transactions bt2 ON (
    bt1.user_id = bt2.user_id 
    AND bt1.transaction_type = bt2.transaction_type
    AND bt1.amount = bt2.amount
    AND bt1.transaction_type = 'refund'
    AND bt1.id < bt2.id  -- Garder la première transaction
    AND bt2.created_at - bt1.created_at < INTERVAL '30 minutes'
  )
  WHERE bt1.created_at >= NOW() - INTERVAL '1 day'
)
SELECT 
  'DOUBLONS TROUVÉS' as status,
  user_id,
  amount,
  first_created,
  duplicate_created,
  first_description,
  duplicate_description
FROM duplicate_transactions;

-- 3. Supprimer les transactions en double (EXÉCUTEZ CETTE REQUÊTE SÉPARÉMENT)
WITH duplicate_transactions AS (
  SELECT 
    bt1.id as id_to_keep,
    bt2.id as id_to_delete,
    bt1.user_id,
    bt1.amount
  FROM balance_transactions bt1
  JOIN balance_transactions bt2 ON (
    bt1.user_id = bt2.user_id 
    AND bt1.transaction_type = bt2.transaction_type
    AND bt1.amount = bt2.amount
    AND bt1.transaction_type = 'refund'
    AND bt1.id < bt2.id
    AND bt2.created_at - bt1.created_at < INTERVAL '30 minutes'
  )
  WHERE bt1.created_at >= NOW() - INTERVAL '1 day'
)
DELETE FROM balance_transactions 
WHERE id IN (
  SELECT id_to_delete 
  FROM duplicate_transactions
);

-- 4. Corriger le solde des utilisateurs affectés (EXÉCUTEZ CETTE REQUÊTE SÉPARÉMENT)
WITH duplicate_transactions AS (
  SELECT 
    bt1.id as id_to_keep,
    bt2.id as id_to_delete,
    bt1.user_id,
    bt1.amount
  FROM balance_transactions bt1
  JOIN balance_transactions bt2 ON (
    bt1.user_id = bt2.user_id 
    AND bt1.transaction_type = bt2.transaction_type
    AND bt1.amount = bt2.amount
    AND bt1.transaction_type = 'refund'
    AND bt1.id < bt2.id
    AND bt2.created_at - bt1.created_at < INTERVAL '30 minutes'
  )
  WHERE bt1.created_at >= NOW() - INTERVAL '1 day'
),
affected_users AS (
  SELECT DISTINCT user_id, amount
  FROM duplicate_transactions
)
UPDATE users 
SET balance = balance - au.amount
FROM affected_users au
WHERE users.id = au.user_id;

-- PARTIE 3: VÉRIFICATION ET SURVEILLANCE

-- 5. Vérifier les transactions récentes par utilisateur
SELECT 
  user_id,
  transaction_type,
  amount,
  description,
  created_at,
  COUNT(*) OVER (PARTITION BY user_id, transaction_type, amount) as count_similar
FROM balance_transactions 
WHERE 
  transaction_type = 'refund' 
  AND created_at >= NOW() - INTERVAL '1 day'
ORDER BY user_id, created_at DESC;
