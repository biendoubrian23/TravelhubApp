import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store';
import { authService } from '../../services/supabase';

const DriverProfile = ({ navigation }) => {
  const { user, signOut } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Erreur de déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const profileSections = [
    {
      title: 'Disponibilité',
      items: [
        {
          icon: 'checkmark-circle-outline',
          title: 'Statut conducteur',
          subtitle: isAvailable ? 'Disponible pour les trajets' : 'Non disponible',
          type: 'switch',
          value: isAvailable,
          onToggle: setIsAvailable,
        },
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications push',
          subtitle: 'Recevoir les alertes de nouveaux trajets',
          type: 'switch',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ]
    },
    {
      title: 'Mes informations',
      items: [
        {
          icon: 'person-outline',
          title: 'Modifier mon profil',
          subtitle: 'Nom, téléphone, photo',
          type: 'navigation',
          onPress: () => navigation.navigate('EditDriverProfile'),
        },
        {
          icon: 'shield-outline',
          title: 'Sécurité',
          subtitle: 'Mot de passe, authentification',
          type: 'navigation',
          onPress: () => navigation.navigate('DriverSecurity'),
        },
      ]
    },
    {
      title: 'Documents',
      items: [
        {
          icon: 'card-outline',
          title: 'Permis de conduire',
          subtitle: 'Gérer mes documents',
          type: 'navigation',
          onPress: () => navigation.navigate('DriverDocuments'),
        },
        {
          icon: 'car-outline',
          title: 'Informations véhicule',
          subtitle: 'Carte grise, assurance',
          type: 'navigation',
          onPress: () => navigation.navigate('VehicleInfo'),
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Centre d\'aide',
          subtitle: 'Questions fréquentes',
          type: 'navigation',
          onPress: () => navigation.navigate('DriverHelp'),
        },
        {
          icon: 'mail-outline',
          title: 'Contacter le support',
          subtitle: 'Nous sommes là pour vous aider',
          type: 'navigation',
          onPress: () => navigation.navigate('ContactSupport'),
        },
      ]
    },
    {
      title: 'À propos',
      items: [
        {
          icon: 'information-circle-outline',
          title: 'Conditions d\'utilisation',
          subtitle: 'Termes et conditions',
          type: 'navigation',
          onPress: () => navigation.navigate('DriverTerms'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Politique de confidentialité',
          subtitle: 'Protection de vos données',
          type: 'navigation',
          onPress: () => navigation.navigate('DriverPrivacy'),
        },
      ]
    }
  ];

  const renderSectionItem = (item) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={styles.profileItem}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon} size={20} color="#3B82F6" />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        
        <View style={styles.itemRight}>
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {((user?.user_metadata?.nom || 'C')[0] + (user?.user_metadata?.prenom || 'D')[0]).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.user_metadata?.nom || 'Conducteur'} {user?.user_metadata?.prenom || ''}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>
                  {isAvailable ? 'Disponible' : 'Non disponible'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Sections */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSectionItem)}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: StatusBar.currentHeight + 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemRight: {
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default DriverProfile;
