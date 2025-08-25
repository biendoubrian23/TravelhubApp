# Guide de Transition - Avatar Service

## 🛠️ **État actuel : Version simplifiée**

Pour éviter les erreurs avec `expo-image-picker`, j'ai temporairement mis en place une version simplifiée qui :

### ✅ **Fonctionne maintenant :**
- Affiche un message informatif à l'utilisateur
- Propose de contacter le support
- Évite les crashes de l'application
- Garde la structure pour l'implémentation future

### 🔄 **Pour rétablir la fonctionnalité complète :**

#### 1. **Vérifier que le prebuild a fonctionné**
```bash
npx expo run:android
# Ou
npx expo run:ios
```

#### 2. **Tester expo-image-picker dans l'app**
Si aucune erreur rouge n'apparaît, remplacer dans `ProfileScreen.js` :
```javascript
// Changer de :
import avatarService from '../../services/avatarServiceSimple';

// Vers :
import avatarService from '../../services/avatarService';
```

#### 3. **Rétablir la fonction complète**
Dans `ProfileScreen.js`, remplacer `pickProfileImage()` par la version complète :
```javascript
const pickProfileImage = async () => {
  try {
    setAvatarLoading(true);
    
    // Obtenir l'URL actuelle de l'avatar
    const currentAvatarUrl = user?.user_metadata?.avatar_url || null;
    
    // Utiliser le service d'avatar complet
    const result = await avatarService.changeAvatar(user.id, currentAvatarUrl);
    
    if (result.success) {
      // Mettre à jour le profil utilisateur localement
      await updateProfile({
        ...user.user_metadata,
        avatar_url: result.avatarUrl,
      });
      
      Alert.alert('Succès !', result.message, [{ text: 'OK' }]);
      loadUserStats();
    } else {
      Alert.alert('Erreur', result.error, [{ text: 'OK' }]);
    }
  } catch (error) {
    console.error('Erreur lors du changement d\'avatar:', error);
    Alert.alert('Erreur', 'Une erreur inattendue s\'est produite', [{ text: 'OK' }]);
  } finally {
    setAvatarLoading(false);
  }
};
```

#### 4. **Mettre à jour App.js**
```javascript
// Changer de :
import avatarService from './src/services/avatarServiceSimple'

// Vers :
import avatarService from './src/services/avatarService'
```

## 🎯 **Configuration Supabase requise**

Avant d'activer la fonctionnalité complète, exécuter dans l'éditeur SQL de Supabase :

```sql
-- 1. Ajouter la colonne avatar_url si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Créer le bucket avatars
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
    'avatars',
    'avatars', 
    true,
    ARRAY['image/jpeg', 'image/jpg', 'image/png'],
    5242880
)
ON CONFLICT (id) DO NOTHING;

-- 3. Policies de sécurité
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatars" ON storage.objects
FOR SELECT USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

## ✅ **Test de fonctionnement**

1. Aller dans "Mon compte"
2. Cliquer sur l'avatar
3. ✅ **Version actuelle** : Message informatif s'affiche
4. 🎯 **Version complète** : Galerie s'ouvre pour sélection

## 📝 **Notes importantes**

- Le `prebuild` a été effectué pour intégrer expo-image-picker
- Les permissions sont configurées dans `app.json`
- La structure du service complet est prête
- Il suffit de basculer les imports pour activer
