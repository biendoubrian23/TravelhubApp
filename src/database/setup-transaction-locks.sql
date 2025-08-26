-- Script pour ajouter la table de verrous de transactions
-- Exécuter ce script dans Supabase SQL Editor

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

-- Fonction pour nettoyer les verrous expirés
CREATE OR REPLACE FUNCTION cleanup_expired_transaction_locks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.transaction_locks
  WHERE expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le déclencheur pour le nettoyage automatique
DROP TRIGGER IF EXISTS trigger_cleanup_expired_transaction_locks ON public.balance_transactions;
CREATE TRIGGER trigger_cleanup_expired_transaction_locks
AFTER INSERT ON public.balance_transactions
EXECUTE FUNCTION cleanup_expired_transaction_locks();

-- Supprimer les verrous expirés existants
DELETE FROM public.transaction_locks
WHERE expires_at < NOW();

-- Commentaire sur la table
COMMENT ON TABLE public.transaction_locks IS 'Verrous pour éviter les transactions en double';
