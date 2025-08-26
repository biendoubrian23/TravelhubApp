-- Script pour corriger les politiques RLS pour le système de solde
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les politiques existantes sur balance_transactions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'balance_transactions';

-- 2. Supprimer les anciennes politiques restrictives si elles existent
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.balance_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.balance_transactions;

-- 3. Créer des politiques plus permissives pour les transactions de solde
-- Politique pour SELECT (lecture)
CREATE POLICY "Allow users to view their own balance transactions" 
ON public.balance_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour INSERT (création) - Plus permissive pour le trigger
CREATE POLICY "Allow balance transactions creation" 
ON public.balance_transactions FOR INSERT 
WITH CHECK (true); -- Permet toute insertion (nécessaire pour le trigger)

-- 4. S'assurer que RLS est activé
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Donner les permissions nécessaires au rôle postgres
GRANT ALL ON public.balance_transactions TO postgres;
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.bookings TO postgres;

-- 6. Message de confirmation
SELECT 'Politiques RLS mises à jour pour permettre les transactions de remboursement' AS message;

-- 7. Tester la politique en listant les politiques actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('balance_transactions', 'users', 'bookings');
