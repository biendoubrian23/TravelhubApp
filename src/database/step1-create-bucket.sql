-- Script simplifié pour TravelHub - À exécuter en plusieurs étapes
-- Exécuter chaque section séparément dans l'éditeur SQL de Supabase

-- ÉTAPE 1: Créer le bucket avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880,
  '{"image/jpeg","image/jpg","image/png"}'
)
ON CONFLICT (id) DO NOTHING;
