-- Script simplifié pour créer seulement la colonne avatar_url
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne avatar_url si elle n'existe pas
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Créer une vue simple pour les tests
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  nom,
  prenom,
  full_name,
  telephone,
  ville,
  avatar_url,
  created_at,
  updated_at
FROM public.users;

-- 3. Message de confirmation
SELECT 'Configuration de base terminée - La colonne avatar_url a été ajoutée' as status;
