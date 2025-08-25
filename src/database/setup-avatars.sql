-- Script SQL pour ajouter la colonne avatar_url à la table users
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne avatar_url si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Colonne avatar_url ajoutée à la table users';
    ELSE
        RAISE NOTICE 'Colonne avatar_url existe déjà dans la table users';
    END IF;
END $$;

-- 2. Créer le bucket avatars s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
    'avatars',
    'avatars', 
    true,
    ARRAY['image/jpeg', 'image/jpg', 'image/png'],
    5242880 -- 5MB en bytes
)
ON CONFLICT (id) DO NOTHING;

-- 3. Politique de sécurité pour permettre l'upload d'avatars
-- Permettre aux utilisateurs authentifiés d'uploader leurs propres avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Politique pour permettre aux utilisateurs de voir leurs propres avatars
CREATE POLICY "Users can view their own avatars" ON storage.objects
FOR SELECT USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Politique pour permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Politique pour permettre la lecture publique des avatars (pour l'affichage)
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 7. Mettre à jour la colonne updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger si la table users a une colonne updated_at
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger de mise à jour automatique créé pour la table users';
    END IF;
END $$;

-- 8. Commentaires pour documentation
COMMENT ON COLUMN users.avatar_url IS 'URL de l''avatar de l''utilisateur stocké dans Supabase Storage';

-- Afficher un message de confirmation
SELECT 'Configuration des avatars terminée avec succès!' as message;
