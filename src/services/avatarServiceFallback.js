/**
 * Service Avatar avec fallback simple
 * Version de secours si expo-image-picker pose problème
 */

import { supabase } from './supabase';

class AvatarServiceFallback {
  constructor() {
    this.bucketName = 'avatars';
  }

  /**
   * Sélectionner une image - version fallback
   */
  async pickImageFromGallery() {
    try {
      // Pour le moment, retournons une image par défaut
      // L'utilisateur pourra toujours changer l'avatar via le web
      return {
        uri: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Avatar',
        cancelled: false
      };
    } catch (error) {
      console.log('Fallback: utilisation avatar par défaut');
      return {
        uri: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Avatar',
        cancelled: false
      };
    }
  }

  /**
   * Mettre à jour l'avatar utilisateur - version simplifiée
   */
  async updateUserAvatar(userId, imageUri = null) {
    try {
      const avatarUrl = imageUri || 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Avatar';

      // Mettre à jour dans la table users
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (dbError) {
        console.error('Erreur mise à jour BDD:', dbError);
        throw dbError;
      }

      return {
        success: true,
        avatarUrl: avatarUrl,
        message: 'Avatar mis à jour (mode fallback)'
      };

    } catch (error) {
      console.error('Erreur updateUserAvatar:', error);
      throw error;
    }
  }
}

export default new AvatarServiceFallback();
