-- Configuration Supabase pour TravelHub
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket avatars s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB
  '{"image/jpeg","image/jpg","image/png"}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. Politique pour permettre aux utilisateurs authentifiés de voir tous les avatars
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Politique pour permettre aux utilisateurs de télécharger leurs propres avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Politique pour permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Politique pour permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. S'assurer que la colonne avatar_url existe dans la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 8. Politique pour permettre aux utilisateurs de voir les profils publics
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

-- 9. Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- 10. Fonction pour nettoyer les anciens avatars lors de la mise à jour
CREATE OR REPLACE FUNCTION public.delete_old_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'avatar_url change et que l'ancien était un fichier Supabase Storage
  IF OLD.avatar_url IS NOT NULL 
     AND OLD.avatar_url != NEW.avatar_url 
     AND OLD.avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN
    
    -- Extraire le chemin du fichier depuis l'URL
    DECLARE
      file_path TEXT;
    BEGIN
      file_path := substring(OLD.avatar_url from '/avatars/(.*)');
      IF file_path IS NOT NULL THEN
        -- Supprimer l'ancien fichier (sera exécuté de manière asynchrone)
        PERFORM storage.delete_object('avatars', file_path);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger pour appeler la fonction de nettoyage
DROP TRIGGER IF EXISTS trigger_delete_old_avatar ON public.users;
CREATE TRIGGER trigger_delete_old_avatar
  BEFORE UPDATE OF avatar_url ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_old_avatar();

-- Vérification finale
SELECT 'Configuration des avatars terminée avec succès!' as status;
