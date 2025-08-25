/**
 * Service Avatar désactivé - TravelHub
 * Version temporaire avec message d'attente
 */

class AvatarServiceDisabled {
  /**
   * Méthode désactivée - affiche juste un message
   */
  async changeAvatar(userId, currentAvatarUrl = null) {
    return {
      success: false,
      error: 'Cette fonctionnalité sera disponible prochainement'
    };
  }

  /**
   * Toutes les autres méthodes désactivées
   */
  async pickImageFromGallery() {
    throw new Error('Fonctionnalité temporairement désactivée');
  }

  async uploadAvatar(userId, imageUri) {
    throw new Error('Fonctionnalité temporairement désactivée');
  }

  async updateUserAvatar(userId, avatarUrl) {
    throw new Error('Fonctionnalité temporairement désactivée');
  }
}

export default new AvatarServiceDisabled();
