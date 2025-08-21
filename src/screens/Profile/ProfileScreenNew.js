import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    favoriteDestination: '',
    memberSince: '',
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    // TODO: Charger les statistiques depuis l'API
    setUserStats({
      totalTrips: 12,
      totalDistance: 2450, // km
      favoriteDestination: 'Douala',
      memberSince: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2025',
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const pickProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        await updateProfile({ profileImage: result.assets[0].uri });
        Alert.alert('Succès', 'Photo de profil mise à jour');
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
      }
    }
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Découvrez TravelHub, l\'app qui révolutionne le transport au Cameroun ! 🚌✨ Téléchargez-la maintenant.',
        url: 'https://travelhub.cm/download',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const callSupport = () => {
    Linking.openURL('tel:+237600000000');
  };

  const sendEmail = () => {
    Linking.openURL('mailto:support@travelhub.cm?subject=Support TravelHub');
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=237600000000&text=Bonjour, j\'ai besoin d\'aide avec TravelHub');
  };

  const MenuSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, rightElement, color = COLORS.text.primary, backgroundColor }) => (
    <TouchableOpacity 
      style={[styles.menuItem, backgroundColor && { backgroundColor }]} 
      onPress={onPress}
    >
      <View style={[styles.menuIcon, backgroundColor && { backgroundColor: backgroundColor + '40' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      
      {rightElement || <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />}
    </TouchableOpacity>
  );

  const StatItem = ({ label, value, icon }) => (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec photo de profil */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer}>
            {user?.user_metadata?.profileImage ? (
              <Image 
                source={{ uri: user.user_metadata.profileImage }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={30} color={COLORS.text.secondary} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.firstName && user?.user_metadata?.lastName 
                ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                : user?.email?.split('@')[0] || 'Utilisateur'
              }
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>Membre depuis {userStats.memberSince}</Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <StatItem 
            label="Voyages" 
            value={userStats.totalTrips} 
            icon="bus" 
          />
          <StatItem 
            label="Kilomètres" 
            value={`${userStats.totalDistance}km`} 
            icon="speedometer" 
          />
          <StatItem 
            label="Destination favorite" 
            value={userStats.favoriteDestination} 
            icon="location" 
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Compte */}
        <MenuSection title="Mon compte">
          <MenuItem
            icon="person"
            title="Modifier le profil"
            subtitle="Informations personnelles, photo, contacts"
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <MenuItem
            icon="notifications"
            title="Notifications"
            subtitle="Gérer vos préférences de notification"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          
          <MenuItem
            icon="shield-checkmark"
            title="Sécurité"
            subtitle="Mot de passe, 2FA, biométrie"
            onPress={() => navigation.navigate('SecuritySettings')}
          />
          
          <MenuItem
            icon="card"
            title="Moyens de paiement"
            subtitle="Cartes, Mobile Money"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </MenuSection>

        {/* Voyage */}
        <MenuSection title="Mes voyages">
          <MenuItem
            icon="time"
            title="Historique des voyages"
            subtitle="Consultez vos trajets passés"
            onPress={() => navigation.navigate('TripHistory')}
          />
          
          <MenuItem
            icon="heart"
            title="Trajets favoris"
            subtitle="Vos destinations préférées"
            onPress={() => navigation.navigate('Favorites')}
          />
          
          <MenuItem
            icon="receipt"
            title="Factures et reçus"
            subtitle="Téléchargez vos justificatifs"
            onPress={() => navigation.navigate('Invoices')}
          />
        </MenuSection>

        {/* Application */}
        <MenuSection title="Application">
          <MenuItem
            icon="language"
            title="Langue"
            subtitle="Français"
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          
          <MenuItem
            icon="moon"
            title="Thème"
            subtitle="Clair, Sombre, Automatique"
            onPress={() => navigation.navigate('ThemeSettings')}
          />
          
          <MenuItem
            icon="download"
            title="Données hors ligne"
            subtitle="Gérer le cache et téléchargements"
            onPress={() => navigation.navigate('OfflineData')}
          />
        </MenuSection>

        {/* Support */}
        <MenuSection title="Aide & Support">
          <MenuItem
            icon="help-circle"
            title="Centre d'aide"
            subtitle="FAQ, guides, tutoriels"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          
          <MenuItem
            icon="call"
            title="Appeler le support"
            subtitle="+237 6XX XXX XXX"
            onPress={callSupport}
            color={COLORS.success}
          />
          
          <MenuItem
            icon="logo-whatsapp"
            title="WhatsApp"
            subtitle="Chat en direct avec notre équipe"
            onPress={openWhatsApp}
            color="#25D366"
          />
          
          <MenuItem
            icon="mail"
            title="Email"
            subtitle="support@travelhub.cm"
            onPress={sendEmail}
            color={COLORS.primary}
          />
        </MenuSection>

        {/* À propos */}
        <MenuSection title="À propos">
          <MenuItem
            icon="information-circle"
            title="À propos de TravelHub"
            subtitle="Version, équipe, mentions légales"
            onPress={() => navigation.navigate('About')}
          />
          
          <MenuItem
            icon="star"
            title="Noter l'application"
            subtitle="Votre avis compte pour nous"
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.travelhub.app')}
            color={COLORS.warning}
          />
          
          <MenuItem
            icon="share"
            title="Partager l'application"
            subtitle="Recommandez TravelHub à vos proches"
            onPress={shareApp}
            color={COLORS.primary}
          />
          
          <MenuItem
            icon="document-text"
            title="Conditions d'utilisation"
            subtitle="Nos termes et conditions"
            onPress={() => navigation.navigate('TermsConditions')}
          />
          
          <MenuItem
            icon="shield"
            title="Politique de confidentialité"
            subtitle="Protection de vos données"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </MenuSection>

        {/* Déconnexion */}
        <MenuSection title="">
          <MenuItem
            icon="log-out"
            title="Se déconnecter"
            subtitle="Déconnexion de votre compte"
            onPress={handleSignOut}
            color={COLORS.error}
            backgroundColor={COLORS.error + '10'}
          />
        </MenuSection>

        <View style={{ height: 50 }} />
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
    backgroundColor: COLORS.surface,
    paddingBottom: SPACING.md,
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  userInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  userEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  memberSince: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  menuContent: {
    flex: 1,
  },
  
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});

export default ProfileScreen;
