import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import logger from '../../utils/logger';

const NotificationBadge = ({ navigation, size = 24, color = '#666' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const result = await notificationService.getUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      logger.error('❌ Erreur loadUnreadCount badge:', error);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    
    // Recharger le compte toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Recharger quand l'écran de notifications est focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      loadUnreadCount();
    });

    return unsubscribe;
  }, [navigation]);

  const handlePress = () => {
    navigation?.navigate('Notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
