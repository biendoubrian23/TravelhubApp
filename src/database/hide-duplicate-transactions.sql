-- Script pour masquer les transactions en double dans l'interface utilisateur
-- Exécuter dans Supabase SQL Editor

-- ÉTAPE 1: Créer une vue pour les transactions uniques
CREATE OR REPLACE VIEW public.clean_balance_transactions AS
WITH duplicate_detection AS (
  SELECT
    id,
    user_id,
    booking_id,
    transaction_type,
    amount,
    description,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, booking_id, transaction_type, amount
      ORDER BY created_at
    ) as occurrence
  FROM balance_transactions
  WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  id,
  user_id,
  booking_id,
  transaction_type,
  amount,
  description,
  created_at
FROM duplicate_detection
WHERE 
  -- Conserver uniquement la première occurrence des doublons récents
  (transaction_type = 'refund' AND occurrence = 1)
  -- Garder toutes les autres transactions normalement
  OR transaction_type != 'refund'
UNION ALL
-- Ajouter les transactions plus anciennes sans filtre
SELECT
  id,
  user_id,
  booking_id,
  transaction_type,
  amount,
  description,
  created_at
FROM balance_transactions
WHERE created_at < NOW() - INTERVAL '30 days';

-- ÉTAPE 2: Ajouter les droits d'accès pour la vue
ALTER VIEW public.clean_balance_transactions OWNER TO postgres;
GRANT ALL ON public.clean_balance_transactions TO postgres;
GRANT SELECT ON public.clean_balance_transactions TO authenticated;
GRANT SELECT ON public.clean_balance_transactions TO service_role;

-- ÉTAPE 3: Modifier le service de balance pour utiliser cette vue
-- Note: cette requête est à adapter dans le code JavaScript balanceService.js
/*
async getBalanceTransactions(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('clean_balance_transactions')  // Utiliser la vue au lieu de la table
      .select(`
        *,
        booking_id,
        bookings(booking_reference, total_price_fcfa)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Erreur lors de la récupération des transactions:', error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erreur service transactions:', error)
    return { data: [], error }
  }
}
*/
