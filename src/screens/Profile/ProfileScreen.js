import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import BalanceCard, { BalanceDisplay } from '../../components/BalanceCard';
// import avatarService from '../../services/avatarService';
// import avatarService from '../../services/avatarServiceClean';
import avatarService from '../../services/avatarServiceDisabled';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const balanceCardRef = useRef(null);
  const [userStats, setUserStats] = useState({
    totalBookings: 0,        // Nombre de réservations
    referralsCount: 0,       // Nombre de parrainés (dynamique)
    userCity: 'Douala',      // Ville de l'utilisateur
    memberSince: '',
  });
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    loadUserStats();
  }, [user]); // Recharger quand l'utilisateur change

  // Rafraîchir le solde quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      if (balanceCardRef.current) {
        balanceCardRef.current.refresh();
      }
    }, [])
  );

  const loadUserStats = async () => {
    try {
      let totalBookings = 0;
      let userCity = 'Douala'; // Valeur par défaut
      let fullName = '';
      let referralsCount = 0; // Initialisation du compte de parrainages
      
      if (user?.id) {
        // 1. Charger le nombre de réservations depuis la base de données
        const { supabase } = await import('../../services/supabaseClient');
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', user.id);
          
        if (!bookingsError && bookings) {
          totalBookings = bookings.length;
          console.log(`📊 Utilisateur a ${totalBookings} réservations`);
        }
        
        // 1.1. Charger le nombre de parrainages depuis la base de données
        const { data: referrals, error: referralsError } = await supabase
          .from('referrals')
          .select('id')
          .eq('referrer_id', user.id); // L'utilisateur est le parrain
          
        if (!referralsError && referrals) {
          referralsCount = referrals.length;
          console.log(`👥 Utilisateur a ${referralsCount} parrainages`);
        } else if (referralsError) {
          console.error('Erreur lors du chargement des parrainages:', referralsError);
        }
        
        // 2. Récupérer les informations utilisateur (nom et ville)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, ville')
          .eq('id', user.id)
          .single();
          
        if (!userError && userData) {
          // Récupérer le nom complet
          if (userData.full_name) {
            fullName = userData.full_name;
            console.log(`👤 Nom depuis table users: ${fullName}`);
          }
          
          // Récupérer la ville
          if (userData.ville) {
            userCity = userData.ville;
            console.log(`🏙️ Ville depuis table users: ${userCity}`);
          }
        }
        
        // 3. Fallbacks si les données ne sont pas dans la table users
        if (!fullName) {
          // Essayer depuis les métadonnées Auth
          if (user.user_metadata?.full_name) {
            fullName = user.user_metadata.full_name;
            console.log(`👤 Nom depuis métadonnées Auth: ${fullName}`);
          } else if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
            fullName = `${user.user_metadata.firstName} ${user.user_metadata.lastName}`;
            console.log(`👤 Nom construit depuis firstName/lastName: ${fullName}`);
          } else {
            // Utiliser la partie avant @ de l'email comme nom par défaut
            fullName = user?.email?.split('@')[0] || 'Utilisateur';
            console.log(`👤 Nom par défaut depuis email: ${fullName}`);
          }
        }
        
        if (!userData?.ville) {
          // Fallback : essayer depuis les métadonnées Auth pour la ville
          if (user.user_metadata?.ville) {
            userCity = user.user_metadata.ville;
            console.log(`🏙️ Ville depuis métadonnées Auth: ${userCity}`);
          } else {
            console.log(`🏙️ Aucune ville trouvée, utilisation de la valeur par défaut: ${userCity}`);
          }
        }
      }
      
      // Mettre à jour les états
      setUserProfile({
        fullName,
        email: user?.email || '',
      });
      
      setUserStats({
        totalBookings,
        referralsCount, // Utilisation du nombre réel de parrainages récupéré de la base de données
        userCity,
        memberSince: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2025',
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques utilisateur:', error);
      // Valeurs par défaut en cas d'erreur
      setUserProfile({
        fullName: user?.email?.split('@')[0] || 'Utilisateur',
        email: user?.email || '',
      });
      setUserStats({
        totalBookings: 0,
        referralsCount: 2,
        userCity: 'Douala',
        memberSince: '2025',
      });
    }
  };

  // Fonction pour recharger les statistiques (utile après une nouvelle réservation)
  const refreshUserStats = () => {
    loadUserStats();
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

  const [avatarLoading, setAvatarLoading] = useState(false); // Gardé pour éviter les erreurs, mais non utilisé

  const pickProfileImage = async () => {
    // Fonctionnalité désactivée temporairement
    Alert.alert(
      'Photo de profil',
      'Cette fonctionnalité sera disponible prochainement. Restez connecté pour les futures mises à jour !',
      [{ text: 'Compris', style: 'default' }]
    );
  };

  const referFriend = async () => {
    // Naviguer vers l'écran de parrainage au lieu de partager directement
    navigation.navigate('Referral');
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
          <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer} disabled={avatarLoading}>
            {/* Afficher l'avatar depuis la BD ou les métadonnées */}
            {user?.user_metadata?.avatar_url ? (
              <Image 
                source={{ uri: user.user_metadata.avatar_url }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={30} color={COLORS.text.secondary} />
              </View>
            )}
            
            {/* Overlay avec icône ou loader */}
            <View style={styles.cameraOverlay}>
              {avatarLoading ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Ionicons name="camera" size={16} color={COLORS.surface} />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile.fullName || 'Utilisateur'}
            </Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
            <Text style={styles.memberSince}>Membre depuis {userStats.memberSince}</Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <StatItem 
            label="Réservations" 
            value={userStats.totalBookings} 
            icon="calendar" 
          />
          <StatItem 
            label="Parrainés" 
            value={userStats.referralsCount} 
            icon="people" 
          />
          <StatItem 
            label="Ville" 
            value={userStats.userCity} 
            icon="location" 
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Solde utilisateur */}
        <BalanceCard 
          ref={balanceCardRef}
          style={{ marginHorizontal: SPACING.md, marginVertical: SPACING.sm }}
        />

        {/* Compte */}
        <MenuSection title="Mon compte">
          <MenuItem
            icon="people"
            title="Parrainer des amis"
            subtitle="Invitez vos proches et gagnez des avantages"
            onPress={referFriend}
            color={COLORS.primary}
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
        </MenuSection>

        {/* Voyage */}
        <MenuSection title="Mes voyages">
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
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité sera disponible prochainement')}
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
            onPress={() => Alert.alert('À propos', 'TravelHub v1.0.0\nTransport de voyageurs au Cameroun')}
          />
          
          <MenuItem
            icon="star"
            title="Noter l'application"
            subtitle="Votre avis compte pour nous"
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.travelhub.app')}
            color={COLORS.warning}
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
