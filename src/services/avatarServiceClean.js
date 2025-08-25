/**
 * Service Avatar simplifié pour TravelHub
 * Version sans auto-création de bucket pour éviter les erreurs RLS
 */

import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

class AvatarServiceSimple {
  constructor() {
    this.bucketName = 'avatars';
  }

  /**
   * Sélectionner une image depuis la galerie
   */
  async pickImageFromGallery() {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission d\'accès à la galerie refusée');
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Revenir à l'ancienne syntaxe qui marchait
        allowsEditing: true,
        aspect: [1, 1], // Carré
        quality: 0.8,
        base64: false,
      });

      return result;
    } catch (error) {
      console.error('Erreur sélection image:', error);
      throw error;
    }
  }

  /**
   * Télécharger l'avatar vers Supabase Storage
   */
  async uploadAvatar(userId, imageUri) {
    try {
      console.log('🔄 Début upload pour:', userId);
      console.log('📁 URI image:', imageUri);
      
      // Vérifier l'URI d'abord
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('URI d\'image invalide');
      }

      // Convertir l'image en blob avec une méthode plus robuste
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Impossible de lire l'image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob créé, taille:', blob.size, 'type:', blob.type);

      // Nom du fichier avec timestamp
      const timestamp = Date.now();
      const fileName = `${userId}/avatar_${timestamp}.jpg`;
      console.log('📝 Nom fichier:', fileName);

      // Upload vers Supabase Storage avec gestion d'erreur améliorée
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.error('❌ Erreur upload Supabase:', error);
        
        // Messages d'erreur spécifiques
        if (error.message.includes('not found') || error.message.includes('bucket')) {
          throw new Error('Le bucket de stockage n\'existe pas. Veuillez configurer Supabase.');
        }
        
        if (error.message.includes('Network')) {
          throw new Error('Problème de connexion. Vérifiez votre réseau et réessayez.');
        }
        
        if (error.message.includes('policy')) {
          throw new Error('Permissions insuffisantes. Configurez les politiques Supabase.');
        }
        
        throw new Error(`Erreur d'upload: ${error.message}`);
      }

      console.log('✅ Upload réussi:', data);

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('🔗 URL publique:', urlData.publicUrl);

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
   * Mettre à jour l'avatar utilisateur dans la base de données
   */
  async updateUserAvatar(userId, avatarUrl) {
    try {
      // Vérification de sécurité côté app
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        throw new Error('Non autorisé à modifier cet utilisateur');
      }

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
      const result = await this.pickImageFromGallery();
      
      if (result.cancelled) {
        return { success: false, error: 'Sélection annulée' };
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: false, error: 'Aucune image sélectionnée' };
      }

      const selectedImage = result.assets[0];

      // 2. Upload la nouvelle image
      const uploadResult = await this.uploadAvatar(userId, selectedImage.uri);

      // 3. Mettre à jour la base de données
      await this.updateUserAvatar(userId, uploadResult.publicUrl);

      return {
        success: true,
        avatarUrl: uploadResult.publicUrl,
        message: 'Photo de profil mise à jour avec succès !',
      };
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de l\'avatar'
      };
    }
  }
}

export default new AvatarServiceSimple();
