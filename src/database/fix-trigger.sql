-- Correction du trigger pour créer automatiquement les profils utilisateurs

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recréer la fonction avec une meilleure gestion d'erreurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role public.user_role;
BEGIN
    -- Extraire le rôle des métadonnées, avec une valeur par défaut
    BEGIN
        user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role);
    EXCEPTION WHEN OTHERS THEN
        user_role := 'client'::public.user_role;
    END;

    -- Insérer le nouvel utilisateur dans la table users
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        user_role,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne pas empêcher la création de l'utilisateur
        RAISE LOG 'Erreur lors de la création du profil utilisateur: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test manuel du trigger (optionnel - vous pouvez commenter ces lignes)
-- INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
-- VALUES (gen_random_uuid(), 'test-trigger@example.com', '{"full_name": "Test Trigger", "role": "client"}', NOW(), NOW());

-- Vérifier que les permissions RLS sont correctes
-- Politique pour permettre l'insertion lors de l'inscription
DROP POLICY IF EXISTS "Utilisateurs peuvent être créés lors de l'inscription" ON public.users;
CREATE POLICY "Utilisateurs peuvent être créés lors de l'inscription" ON public.users
    FOR INSERT WITH CHECK (true);

-- Afficher les utilisateurs existants pour vérification
SELECT 'Utilisateurs actuels:' as info;
SELECT id, email, full_name, role, created_at FROM public.users ORDER BY created_at DESC LIMIT 5;

COMMIT;
