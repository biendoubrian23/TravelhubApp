-- ÉTAPE 4: Créer les politiques pour la table users
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Créer les nouvelles politiques
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);
