/**
 * Script de nettoyage des réservations groupées
 * Ce script supprime les réservations locales non synchronisées 
 * et force le rechargement depuis Supabase uniquement
 */

import logger from './logger';

export const cleanupGroupedBookings = async (user, bookingsStore) => {
  if (!user?.id) {
    logger.warn('Utilisateur non connecté - pas de nettoyage nécessaire');
    return;
  }

  if (!bookingsStore) {
    logger.warn('Store des réservations non fourni');
    return;
  }

  try {
    logger.info('🧹 Début du nettoyage des réservations groupées...');
    
    // Vider complètement le store local
    bookingsStore.setState({
      bookings: [],
      isLoading: true
    });
    
    logger.info('🗑️ Store local vidé - rechargement depuis BD...');
    
    // Recharger uniquement depuis Supabase
    await bookingsStore.loadBookings(user);
    
    logger.info('✅ Nettoyage terminé - seules les réservations individuelles de Supabase sont affichées');
    
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage:', error);
  }
};

export default cleanupGroupedBookings;
