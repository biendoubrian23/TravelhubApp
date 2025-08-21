import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// iOS Design System Colors
const COLORS = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  purple: '#AF52DE',
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
  },
  border: '#E5E5E7',
  separator: '#C6C6C8',
};

const AgencyActivityScreen = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    // TODO: Charger les vraies données depuis l'API
    const mockActivities = [
      {
        id: '1',
        type: 'booking',
        title: 'Nouvelle réservation',
        description: 'Jean Dupont - Yaoundé → Douala',
        details: 'Référence: TH001234 - 36,000 FCFA',
        timestamp: '2025-08-04T14:30:00Z',
        icon: 'checkmark-circle',
        iconColor: '#4CAF50',
        user: 'Jean Dupont',
        amount: 36000,
      },
      {
        id: '2',
        type: 'trip',
        title: 'Trajet publié',
        description: 'Douala → Bafoussam - 15:30',
        details: 'Bus VIP - 50 places disponibles',
        timestamp: '2025-08-04T11:15:00Z',
        icon: 'bus',
        iconColor: '#2196F3',
        tripId: 'TR001',
      },
      {
        id: '3',
        type: 'payment',
        title: 'Paiement reçu',
        description: '+15,000 FCFA',
        details: 'Marie Kamdem - Orange Money',
        timestamp: '2025-08-04T09:45:00Z',
        icon: 'wallet',
        iconColor: '#FF9800',
        user: 'Marie Kamdem',
        amount: 15000,
      },
      {
        id: '4',
        type: 'cancellation',
        title: 'Réservation annulée',
        description: 'Paul Nkomo - Yaoundé → Ngaoundéré',
        details: 'Remboursement automatique en cours',
        timestamp: '2025-08-04T08:20:00Z',
        icon: 'close-circle',
        iconColor: '#F44336',
        user: 'Paul Nkomo',
        amount: -50000,
      },
      {
        id: '5',
        type: 'booking',
        title: 'Nouvelle réservation',
        description: 'Alice Mbala - Bamenda → Yaoundé',
        details: 'Référence: TH001233 - 15,000 FCFA',
        timestamp: '2025-08-03T18:10:00Z',
        icon: 'checkmark-circle',
        iconColor: '#4CAF50',
        user: 'Alice Mbala',
        amount: 15000,
      },
      {
        id: '6',
        type: 'trip',
        title: 'Trajet modifié',
        description: 'Yaoundé → Douala - 08:00',
        details: 'Horaire mis à jour',
        timestamp: '2025-08-03T16:30:00Z',
        icon: 'pencil',
        iconColor: '#9C27B0',
        tripId: 'TR002',
      },
      {
        id: '7',
        type: 'payment',
        title: 'Paiement reçu',
        description: '+12,000 FCFA',
        details: 'Étienne Fouda - Mobile Money',
        timestamp: '2025-08-03T14:25:00Z',
        icon: 'wallet',
        iconColor: '#FF9800',
        user: 'Étienne Fouda',
        amount: 12000,
      },
      {
        id: '8',
        type: 'booking',
        title: 'Réservation confirmée',
        description: 'Sarah Ndjock - Douala → Bafoussam',
        details: 'Paiement validé automatiquement',
        timestamp: '2025-08-03T12:15:00Z',
        icon: 'checkmark-circle',
        iconColor: '#4CAF50',
        user: 'Sarah Ndjock',
        amount: 12000,
      },
    ];
    setActivities(mockActivities);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } else {
      return activityTime.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const handleActivityPress = (activity) => {
    switch (activity.type) {
      case 'booking':
        // Navigation vers les détails de la réservation
        navigation.navigate('AgencyBookings');
        break;
      case 'trip':
        // Navigation vers les détails du trajet
        navigation.navigate('AgencyTrips');
        break;
      case 'payment':
        // Navigation vers les rapports financiers
        navigation.navigate('AgencyReports');
        break;
      case 'cancellation':
        // Navigation vers les réservations annulées
        navigation.navigate('AgencyBookings', { filter: 'cancelled' });
        break;
      default:
        break;
    }
  };

  const ActivityItem = ({ activity }) => (
    <TouchableOpacity 
      style={styles.activityItem}
      onPress={() => handleActivityPress(activity)}
    >
      <View style={[styles.activityIcon, { backgroundColor: activity.iconColor + '20' }]}>
        <Ionicons name={activity.icon} size={20} color={activity.iconColor} />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
        </View>
        
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityDetails}>{activity.details}</Text>
        
        {activity.amount && (
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountText,
              { color: activity.amount > 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString()} FCFA
            </Text>
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
    </TouchableOpacity>
  );

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Aujourd\'hui';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Hier';
      } else {
        dateKey = date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activité récente</Text>
        <TouchableOpacity 
          onPress={() => {/* TODO: Filtres */}}
          style={styles.filterButton}
        >
          <Ionicons name="funnel" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="trending-up" size={20} color="#4CAF50" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>+127,000</Text>
            <Text style={styles.summaryLabel}>FCFA aujourd'hui</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="ticket" size={20} color="#2196F3" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>8</Text>
            <Text style={styles.summaryLabel}>Nouvelles réservations</Text>
          </View>
        </View>
      </View>

      {/* Activities List */}
      <ScrollView
        style={styles.activitiesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </View>
        ))}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 2,
    fontWeight: '400',
  },
  activitiesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
    paddingHorizontal: 4,
    letterSpacing: -0.4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  activityTime: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  activityDescription: {
    fontSize: 15,
    color: COLORS.text.primary,
    marginBottom: 4,
    fontWeight: '400',
  },
  activityDetails: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  amountContainer: {
    marginTop: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AgencyActivityScreen;
