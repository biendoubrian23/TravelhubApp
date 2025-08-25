-- ÉTAPE 2: Ajouter la colonne avatar_url
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
