-- 🔧 SCRIPT COMPLET DE RÉPARATION SUPABASE AVATARS
-- Copiez-collez TOUT ce script dans Supabase SQL Editor et exécutez-le en une fois

-- 1. Nettoyer et recréer le bucket avatars
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- 2. Recréer le bucket avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  '{"image/jpeg","image/jpg","image/png"}'
);

-- 3. Activer RLS sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques au cas où
DROP POLICY IF EXISTS "Public avatars viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;

-- 5. Créer les politiques Storage (lecture publique)
CREATE POLICY "Public avatars viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 6. Politique d'upload (utilisateurs authentifiés seulement)
CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Politique de mise à jour
CREATE POLICY "Users update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 8. Politique de suppression
CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 9. Ajouter la colonne avatar_url à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 10. Activer RLS sur la table users si pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 11. Supprimer anciennes politiques users
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;

-- 12. Politique pour lire son propre profil
CREATE POLICY "Users read own profile" ON public.users
FOR SELECT USING (auth.uid() = id OR true); -- Permettre lecture publique pour les profils

-- 13. Politique pour modifier son propre profil
CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 14. Vérification finale - Afficher la configuration
SELECT 'Configuration terminée avec succès!' as status;

-- 15. Vérifier que le bucket existe
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE name = 'avatars';
