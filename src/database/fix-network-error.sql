-- Solution rapide pour corriger l'erreur Network request failed
-- Exécutez dans Supabase SQL Editor

-- 1. Supprimer et recréer le bucket (au cas où il y aurait un problème)
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- 2. Recréer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880,
  '{"image/jpeg","image/jpg","image/png"}'
);

-- 3. Créer les politiques essentielles
CREATE POLICY "Avatars publics" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Upload avatar utilisateur" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Vérifier la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5. Activer RLS sur storage.objects si pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
