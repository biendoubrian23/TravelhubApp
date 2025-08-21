import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

const AgencyDashboardScreen = ({ navigation }) => {
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    totalBookings: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalPassengers: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // TODO: Charger les vraies données depuis l'API
    setStats({
      totalTrips: 45,
      activeTrips: 12,
      totalBookings: 234,
      todayRevenue: 125000,
      monthlyRevenue: 3450000,
      totalPassengers: 1250,
    });
  };

  const handleSignOut = () => {
    signOut();
  };

  const StatCard = ({ title, value, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.agencyLogo}>
            <Ionicons name="business" size={24} color="#FF8A00" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.agencyName}>
              {user?.user_metadata?.agencyName || 'Mon Agence'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Revenue Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenus</Text>
          <View style={styles.revenueContainer}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Aujourd'hui</Text>
              <Text style={styles.revenueValue}>
                {stats.todayRevenue.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Ce mois</Text>
              <Text style={styles.revenueValue}>
                {stats.monthlyRevenue.toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Trajets actifs"
              value={stats.activeTrips}
              subtitle="En cours"
              icon="bus"
              color="#34C759"
              onPress={() => navigation.navigate('AgencyTrips', { filter: 'active' })}
            />
            <StatCard
              title="Total trajets"
              value={stats.totalTrips}
              subtitle="Ce mois"
              icon="calendar"
              color="#007AFF"
              onPress={() => navigation.navigate('AgencyTrips')}
            />
            <StatCard
              title="Réservations"
              value={stats.totalBookings}
              subtitle="Total"
              icon="ticket"
              color="#FF9500"
              onPress={() => navigation.navigate('AgencyBookings')}
            />
            <StatCard
              title="Passagers"
              value={stats.totalPassengers}
              subtitle="Ce mois"
              icon="people"
              color="#AF52DE"
              onPress={() => navigation.navigate('AgencyPassengers')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsContainer}>
            <QuickActionCard
              title="Nouveau trajet"
              description="Créer un nouveau trajet"
              icon="add-circle"
              color="#34C759"
              onPress={() => navigation.navigate('CreateTrip')}
            />
            <QuickActionCard
              title="Gérer les trajets"
              description="Modifier ou supprimer des trajets"
              icon="settings"
              color="#007AFF"
              onPress={() => navigation.navigate('AgencyTrips')}
            />
            <QuickActionCard
              title="Réservations"
              description="Voir toutes les réservations"
              icon="list"
              color="#FF9500"
              onPress={() => navigation.navigate('AgencyBookings')}
            />
            <QuickActionCard
              title="Rapports"
              description="Analyses et statistiques"
              icon="analytics"
              color="#AF52DE"
              onPress={() => navigation.navigate('AgencyReports')}
            />
            <QuickActionCard
              title="Paramètres"
              description="Configuration de l'agence"
              icon="cog"
              color="#8E8E93"
              onPress={() => navigation.navigate('AgencySettings')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AgencyActivity')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#34C759' + '20' }]}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nouvelle réservation</Text>
                <Text style={styles.activityDescription}>
                  Jean Dupont - Yaoundé → Douala
                </Text>
                <Text style={styles.activityTime}>Il y a 2 minutes</Text>
              </View>
            </View>

            <View style={styles.activitySeparator} />

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#007AFF' + '20' }]}>
                <Ionicons name="bus" size={16} color="#007AFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Trajet publié</Text>
                <Text style={styles.activityDescription}>
                  Douala → Bafoussam - 15:30
                </Text>
                <Text style={styles.activityTime}>Il y a 1 heure</Text>
              </View>
            </View>

            <View style={styles.activitySeparator} />

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FF9500' + '20' }]}>
                <Ionicons name="wallet" size={16} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Paiement reçu</Text>
                <Text style={styles.activityDescription}>
                  +15,000 FCFA
                </Text>
                <Text style={styles.activityTime}>Il y a 3 heures</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agencyLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  agencyName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 2,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  revenueContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  revenueLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  revenueValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#34C759',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    minHeight: 120,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
    lineHeight: 20,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  activitySeparator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 44,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
});

export default AgencyDashboardScreen;
