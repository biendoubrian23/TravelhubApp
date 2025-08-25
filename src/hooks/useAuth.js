import { useAuthStore } from '../store';

/**
 * Hook personnalisé pour l'authentification
 * Fournit un accès simplifié aux fonctionnalités d'authentification
 */
export const useAuth = () => {
  const authStore = useAuthStore();
  
  return {
    // État d'authentification
    user: authStore.user,
    isLoading: authStore.isLoading,
    isAuthenticated: authStore.isAuthenticated,
    
    // Actions d'authentification
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
    setUser: authStore.setUser,
    
    // Actions supplémentaires si elles existent
    updateProfile: authStore.updateProfile,
    updatePassword: authStore.updatePassword,
    deleteAccount: authStore.deleteAccount,
  };
};
