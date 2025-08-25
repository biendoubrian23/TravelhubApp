import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabaseClient';
import { Alert } from 'react-native';

class AvatarService {
  constructor() {
    this.bucketName = 'avatars';
  }

  /**
   * Demande les permissions pour accéder à la galerie
   */
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de votre permission pour accéder à votre galerie de photos.'
      );
      return false;
    }
    return true;
  }

  /**
   * Ouvre la galerie pour sélectionner une image
   */
  async pickImageFromGallery() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Ratio carré pour l'avatar
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) return null;

      return result.assets[0];
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      return null;
    }
  }

  /**
   * Redimensionne et compresse l'image
   */
  async processImage(imageUri, size = 300) {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: size, height: size } }, // Redimensionner en carré
        ],
        {
          compress: 0.8, // Compression à 80%
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );

      return manipulatedImage;
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      throw new Error('Impossible de traiter l\'image');
    }
  }

  /**
   * Upload l'image vers Supabase Storage
   */
  async uploadAvatar(userId, imageUri) {
    try {
      // 1. Traiter l'image (redimensionner + compresser)
      const processedImage = await this.processImage(imageUri);

      // 2. Créer le nom du fichier
      const timestamp = Date.now();
      const fileName = `${userId}/avatar_${timestamp}.jpg`;

      // 3. Convertir l'image en blob pour l'upload
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();

      // 4. Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true, // Remplacer si existe déjà
          contentType: 'image/jpeg'
        });

      if (error) {
        console.error('Erreur upload Supabase:', error);
        throw new Error(`Erreur d'upload: ${error.message}`);
      }

      // 5. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Supprime l'ancien avatar de l'utilisateur
   */
  async deleteOldAvatar(oldAvatarUrl) {
    try {
      if (!oldAvatarUrl) return;

      // Extraire le chemin du fichier depuis l'URL
      const urlParts = oldAvatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error && error.message !== 'The resource was not found') {
        console.error('Erreur lors de la suppression:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ancien avatar:', error);
    }
  }

  /**
   * Met à jour l'avatar de l'utilisateur dans la base de données
   */
  async updateUserAvatar(userId, avatarUrl) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Erreur mise à jour BD:', error);
        throw new Error(`Erreur de mise à jour: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      throw error;
    }
  }

  /**
   * Processus complet de changement d'avatar
   */
  async changeAvatar(userId, currentAvatarUrl = null) {
    try {
      // 1. Sélectionner l'image
      const selectedImage = await this.pickImageFromGallery();
      if (!selectedImage) return null;

      // 2. Upload la nouvelle image
      const uploadResult = await this.uploadAvatar(userId, selectedImage.uri);

      // 3. Mettre à jour la base de données
      await this.updateUserAvatar(userId, uploadResult.publicUrl);

      // 4. Supprimer l'ancien avatar (si existe)
      if (currentAvatarUrl) {
        await this.deleteOldAvatar(currentAvatarUrl);
      }

      return {
        success: true,
        avatarUrl: uploadResult.publicUrl,
        message: 'Photo de profil mise à jour avec succès !',
      };
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la photo',
      };
    }
  }

  /**
   * Initialise le bucket avatars si nécessaire
   */
  async initializeBucket() {
    try {
      // Vérifier si le bucket existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Erreur lors de la vérification des buckets:', listError);
        return false;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        // Créer le bucket
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
          fileSizeLimit: 5242880, // 5MB
        });

        if (createError) {
          console.error('Erreur lors de la création du bucket:', createError);
          return false;
        }

        console.log('✅ Bucket avatars créé avec succès');
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du bucket:', error);
      return false;
    }
  }
}

export default new AvatarService();
