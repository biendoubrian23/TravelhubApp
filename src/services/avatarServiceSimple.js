import { Alert } from 'react-native';
import { supabase } from './supabaseClient';

class AvatarServiceSimple {
  constructor() {
    this.bucketName = 'avatars';
  }

  /**
   * Version simplifiée sans expo-image-picker pour éviter les erreurs
   * Utilise une approche basique pour le moment
   */
  async changeAvatarSimple(userId) {
    try {
      Alert.alert(
        'Photo de profil',
        'Fonctionnalité en cours de développement.\n\nPour le moment, vous pouvez :\n\n1. Prendre une photo\n2. L\'envoyer par email à support@travelhub.cm\n3. Nous la mettrons à jour manuellement',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Contacter le support', 
            onPress: () => {
              // Optionnel : ouvrir l'app email
              console.log('Contacter le support pour changer l\'avatar');
            }
          }
        ]
      );
      
      return {
        success: false,
        message: 'Fonctionnalité temporairement indisponible'
      };
      
    } catch (error) {
      console.error('Erreur service avatar simple:', error);
      return {
        success: false,
        error: 'Erreur lors de la gestion de l\'avatar'
      };
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
        console.log('ℹ️ Bucket avatars n\'existe pas encore - sera créé via SQL');
      } else {
        console.log('✅ Bucket avatars trouvé');
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du bucket:', error);
      return false;
    }
  }
}

export default new AvatarServiceSimple();
