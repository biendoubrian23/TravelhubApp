-- Script SQL pour créer un utilisateur client dans Supabase
-- Exécutez ceci dans l'éditeur SQL de votre tableau de bord Supabase

-- 1. Créer l'utilisateur dans auth.users (si votre schéma le permet)
-- Note: Cette partie pourrait nécessiter des privilèges admin
-- Généralement, il est recommandé d'utiliser l'API Supabase pour créer des utilisateurs

-- 2. Si vous avez une table de profils utilisateurs (users, profiles, etc.)
-- Adaptez selon votre schéma de base de données
INSERT INTO public.users (
  id,
  email,
  nom,
  prenom,
  telephone,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),  -- Génère un UUID aléatoire
  'clarjybrian@outlook.fr',
  'BRIAN',
  'CLARJY',
  '',  -- Téléphone vide pour l'instant
  'client',
  NOW(),
  NOW()
);

-- 3. Vérifier que l'utilisateur a été créé
SELECT * FROM public.users WHERE email = 'clarjybrian@outlook.fr';

-- 4. Si vous utilisez RLS (Row Level Security), assurez-vous que les politiques
-- permettent à l'utilisateur d'accéder à ses données

-- NOTES IMPORTANTES:
-- 1. Pour créer un utilisateur authentifiable, utilisez plutôt l'API Supabase
-- 2. Ce script ne crée que le profil, pas le compte d'authentification
-- 3. L'utilisateur devra s'inscrire normalement via l'application pour avoir un compte auth complet
-- 4. Ou utilisez le script JavaScript 'create-user.js' pour une création complète
