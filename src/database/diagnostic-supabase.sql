-- Script de diagnostic Supabase
-- Exécutez ceci pour vérifier la configuration

-- 1. Vérifier que le bucket avatars existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'avatars';

-- 2. Vérifier les politiques storage
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Vérifier la colonne avatar_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';

-- 4. Vérifier les politiques users
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
