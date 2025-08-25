# Guide de Configuration Supabase pour les Avatars

## Problème résolu
L'erreur `syntax error at or near "NOT"` est due au fait que PostgreSQL ne supporte pas `IF NOT EXISTS` avec `CREATE POLICY`.

## Solution : Exécuter les scripts étape par étape

### 📋 Instructions pour Supabase Dashboard

1. **Aller dans Supabase Dashboard** → Votre projet → **SQL Editor**

2. **Exécuter les scripts dans cet ordre :**

#### ÉTAPE 1: Créer le bucket avatars
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880,
  '{"image/jpeg","image/jpg","image/png"}'
)
ON CONFLICT (id) DO NOTHING;
```

#### ÉTAPE 2: Ajouter la colonne avatar_url
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

#### ÉTAPE 3: Créer les politiques Storage
```sql
-- Permettre à tous de voir les avatars
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permettre aux utilisateurs d'uploader leur avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de modifier leur avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre aux utilisateurs de supprimer leur avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### ÉTAPE 4: Créer les politiques pour la table users
⚠️ **Si vous obtenez l'erreur "policy already exists", exécutez d'abord ceci :**
```sql
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
```

**Puis exécutez :**
```sql
-- Permettre la lecture des profils publics
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

-- Permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);
```

### ✅ Vérification
Après avoir exécuté tous les scripts :
```sql
SELECT 'Configuration terminée!' as status;
```

## 📱 Test dans l'application
Une fois ces scripts exécutés :
1. Redémarrez votre application React Native
2. Connectez-vous avec un utilisateur
3. Allez dans le profil
4. Cliquez sur l'avatar pour sélectionner une image depuis la galerie

L'upload d'avatar devrait maintenant fonctionner sans erreur !
