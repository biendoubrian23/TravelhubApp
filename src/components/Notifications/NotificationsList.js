import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import logger from '../../utils/logger';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Aujourd\'hui';
    if (diffDays === 2) return 'Hier';
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_reminder':
        return 'bus-outline';
      case 'payment_success':
        return 'checkmark-circle-outline';
      case 'payment_failed':
        return 'close-circle-outline';
      case 'cancellation':
        return 'trash-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type, isRead) => {
    if (isRead) return '#666';
    
    switch (type) {
      case 'booking_reminder':
        return '#2196F3';
      case 'payment_success':
        return '#4CAF50';
      case 'payment_failed':
        return '#F44336';
      case 'cancellation':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: notification.is_read ? '#f8f9fa' : '#fff' }
      ]}
      onPress={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(notification.type)}
              size={24}
              color={getNotificationColor(notification.type, notification.is_read)}
            />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={[
              styles.notificationTitle,
              { fontWeight: notification.is_read ? 'normal' : 'bold' }
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(notification.created_at)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(notification.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={[
          styles.notificationMessage,
          { color: notification.is_read ? '#666' : '#333' }
        ]}>
          {notification.message}
        </Text>

        {notification.bookings && (
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingReference}>
              Réf: {notification.bookings.booking_reference}
            </Text>
            {notification.bookings.trips && (
              <Text style={styles.tripInfo}>
                {notification.bookings.trips.departure_city} → {notification.bookings.trips.arrival_city}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {!notification.is_read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );
};

const NotificationsList = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async (showLoader = true) => {
    if (!user?.id) return;

    try {
      if (showLoader) setLoading(true);

      const result = await notificationService.getUserNotifications(user.id, {
        limit: 50
      });

      if (result.success) {
        setNotifications(result.notifications);
        logger.info('📱 Notifications chargées:', result.notifications.length);
      } else {
        logger.error('❌ Erreur chargement notifications:', result.error);
        Alert.alert('Erreur', 'Impossible de charger les notifications');
      }
    } catch (error) {
      logger.error('❌ Erreur loadNotifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await notificationService.getUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      logger.error('❌ Erreur loadUnreadCount:', error);
    }
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId, user.id);
      
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        logger.info('✅ Notification marquée comme lue');
      } else {
        Alert.alert('Erreur', 'Impossible de marquer comme lu');
      }
    } catch (error) {
      logger.error('❌ Erreur handleMarkAsRead:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead(user.id);
      
      if (result.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
      } else {
        Alert.alert('Erreur', 'Impossible de marquer toutes comme lues');
      }
    } catch (error) {
      logger.error('❌ Erreur handleMarkAllAsRead:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await notificationService.deleteNotification(notificationId, user.id);
              
              if (result.success) {
                const deletedNotification = notifications.find(n => n.id === notificationId);
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                
                if (deletedNotification && !deletedNotification.is_read) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
                
                logger.info('🗑️ Notification supprimée');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la notification');
              }
            } catch (error) {
              logger.error('❌ Erreur handleDelete:', error);
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(false);
    loadUnreadCount();
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Aucune notification</Text>
      <Text style={styles.emptySubtext}>
        Vous recevrez ici des rappels pour vos voyages
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196F3',
    borderRadius: 16,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
    marginBottom: 8,
  },
  bookingInfo: {
    marginLeft: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bookingReference: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  tripInfo: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsList;
