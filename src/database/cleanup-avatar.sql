-- Script pour nettoyer les avatars dans Supabase (OPTIONNEL)
-- Exécutez seulement si vous voulez supprimer complètement le bucket avatars

-- Supprimer tous les fichiers et le bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Supprimer les politiques (si elles existent)
DROP POLICY IF EXISTS "Public avatars viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;

-- La colonne avatar_url peut rester dans la table users au cas où vous la réactivez plus tard
-- ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url; -- Décommentez si vous voulez la supprimer

SELECT 'Nettoyage avatar terminé' as status;
