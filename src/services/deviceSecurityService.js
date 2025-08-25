import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const LAST_AUTH_KEY = 'last_authentication';
const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes en millisecondes

// Service pour gérer la sécurité de l'appareil
const deviceSecurityService = {
  /**
   * Vérifie si l'authentification biométrique est disponible et activée
   */
  async isBiometricAvailableAndEnabled() {
    try {
      // Vérifier si l'appareil supporte la biométrie
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.log('Authentification biométrique non supportée');
        return false;
      }

      // Vérifier si l'utilisateur a configuré la biométrie
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('Aucune méthode biométrique configurée');
        return false;
      }

      // Vérifier si l'utilisateur a activé la biométrie dans l'app
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Erreur lors de la vérification biométrique:', error);
      return false;
    }
  },

  /**
   * Vérifie si une réauthentification est nécessaire
   */
  async isReauthenticationNeeded() {
    try {
      const biometricEnabled = await this.isBiometricAvailableAndEnabled();
      if (!biometricEnabled) return false;

      const lastAuthTimestamp = await SecureStore.getItemAsync(LAST_AUTH_KEY);
      if (!lastAuthTimestamp) return true;

      const now = Date.now();
      const lastAuth = parseInt(lastAuthTimestamp);
      
      // Demander une réauthentification si plus de X minutes se sont écoulées
      return now - lastAuth > AUTH_TIMEOUT;
    } catch (error) {
      console.error('Erreur lors de la vérification de réauthentification:', error);
      return true; // Par sécurité, demander l'authentification en cas d'erreur
    }
  },

  /**
   * Effectue l'authentification avec la sécurité de l'appareil
   */
  async authenticate() {
    try {
      // Vérifier si l'authentification est nécessaire
      if (!await this.isBiometricAvailableAndEnabled()) {
        return { success: true, skipAuth: true };
      }
      
      // Déterminer le type d'authentification disponible pour personnaliser le message
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let promptMessage = 'Veuillez vous authentifier pour continuer';
      
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        promptMessage = 'Utilisez votre empreinte digitale pour continuer';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        promptMessage = 'Utilisez Face ID pour continuer';
      }

      // Demander l'authentification
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Utiliser le code d\'accès',
        disableDeviceFallback: false, // Permettre le fallback vers code PIN/motif
        cancelLabel: 'Annuler',
      });

      if (result.success) {
        // Mettre à jour l'horodatage de la dernière authentification
        await SecureStore.setItemAsync(LAST_AUTH_KEY, Date.now().toString());
      }

      return result;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return { success: false, error };
    }
  },

  /**
   * Marquer comme authentifié sans authentification (pour les actions explicites)
   */
  async markAuthenticated() {
    await SecureStore.setItemAsync(LAST_AUTH_KEY, Date.now().toString());
  },
};

export default deviceSecurityService;
