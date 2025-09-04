import { supabase } from './supabaseClient';
import logger from '../utils/logger';

/**
 * Service de gestion des notifications
 */
export const notificationService = {
  /**
   * Récupérer toutes les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Résultat avec notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        unreadOnly = false,
        type = null 
      } = options;

      let query = supabase
        .from('notifications')
        .select(`
          *,
          bookings (
            booking_reference,
            trip_id,
            seat_number,
            trips (
              departure_city,
              arrival_city,
              departure_time
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Erreur lors de la récupération des notifications:', error);
        return { success: false, error: error.message };
      }

      logger.info('📱 Notifications récupérées:', data?.length || 0);
      return { success: true, notifications: data || [] };

    } catch (error) {
      logger.error('❌ Erreur service notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marquer une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select();

      if (error) {
        logger.error('❌ Erreur lors du marquage comme lu:', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ Notification marquée comme lue:', notificationId);
      return { success: true, notification: data?.[0] };

    } catch (error) {
      logger.error('❌ Erreur service markAsRead:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) {
        logger.error('❌ Erreur lors du marquage global:', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ Toutes les notifications marquées comme lues:', data?.length || 0);
      return { success: true, count: data?.length || 0 };

    } catch (error) {
      logger.error('❌ Erreur service markAllAsRead:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer une notification
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('❌ Erreur lors de la suppression:', error);
        return { success: false, error: error.message };
      }

      logger.info('🗑️ Notification supprimée:', notificationId);
      return { success: true };

    } catch (error) {
      logger.error('❌ Erreur service deleteNotification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Créer une notification manuelle
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async createNotification(notificationData) {
    try {
      const {
        userId,
        bookingId = null,
        type = 'general',
        title,
        message,
        scheduledFor = null
      } = notificationData;

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          booking_id: bookingId,
          type: type,
          title: title,
          message: message,
          scheduled_for: scheduledFor
        })
        .select();

      if (error) {
        logger.error('❌ Erreur lors de la création:', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ Notification créée:', data?.[0]?.id);
      return { success: true, notification: data?.[0] };

    } catch (error) {
      logger.error('❌ Erreur service createNotification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer le nombre de notifications non lues
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat avec le nombre
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        logger.error('❌ Erreur lors du comptage:', error);
        return { success: false, error: error.message };
      }

      logger.info('📊 Notifications non lues:', count);
      return { success: true, count: count || 0 };

    } catch (error) {
      logger.error('❌ Erreur service getUnreadCount:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Traiter les notifications programmées (à exécuter périodiquement)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async processScheduledNotifications() {
    try {
      // Récupérer les notifications à envoyer
      const { data: pendingNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .is('sent_at', null)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        logger.error('❌ Erreur lors de la récupération des notifications programmées:', error);
        return { success: false, error: error.message };
      }

      if (!pendingNotifications || pendingNotifications.length === 0) {
        return { success: true, processed: 0 };
      }

      // Marquer les notifications comme envoyées
      const notificationIds = pendingNotifications.map(n => n.id);
      
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (updateError) {
        logger.error('❌ Erreur lors de la mise à jour des notifications:', updateError);
        return { success: false, error: updateError.message };
      }

      logger.info('📱 Notifications traitées:', pendingNotifications.length);
      return { 
        success: true, 
        processed: pendingNotifications.length,
        notifications: pendingNotifications
      };

    } catch (error) {
      logger.error('❌ Erreur service processScheduledNotifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Créer une notification de rappel pour une réservation
   * @param {Object} bookingData - Données de la réservation
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async createBookingReminder(bookingData) {
    try {
      const { bookingId, userId, tripData, bookingReference } = bookingData;
      
      // Calculer le moment du rappel (24h avant le départ)
      const departureTime = new Date(tripData.departure_time);
      const reminderTime = new Date(departureTime.getTime() - (24 * 60 * 60 * 1000));
      
      // Ne créer la notification que si le rappel est dans le futur
      if (reminderTime <= new Date()) {
        logger.info('⏰ Rappel dans le passé, notification non créée');
        return { success: true, skipped: true };
      }

      const title = 'Rappel de voyage';
      const message = `Votre voyage de ${tripData.departure_city} à ${tripData.arrival_city} est prévu demain à ${new Date(tripData.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Référence: ${bookingReference}`;

      return await this.createNotification({
        userId,
        bookingId,
        type: 'booking_reminder',
        title,
        message,
        scheduledFor: reminderTime.toISOString()
      });

    } catch (error) {
      logger.error('❌ Erreur service createBookingReminder:', error);
      return { success: false, error: error.message };
    }
  }
};

export default notificationService;
