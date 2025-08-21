import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const AboutScreen = ({ navigation }) => {
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildVersion = Application.nativeBuildVersion || '1';

  const teamMembers = [
    {
      name: 'Clark Brian',
      role: 'Fondateur & CEO',
      description: 'Visionnaire passionné par l\'amélioration du transport au Cameroun',
      avatar: null,
    },
    {
      name: 'L\'équipe TravelHub',
      role: 'Développeurs & Designers',
      description: 'Une équipe dédiée à créer la meilleure expérience de voyage',
      avatar: null,
    }
  ];

  const features = [
    {
      icon: 'search',
      title: 'Recherche intelligente',
      description: 'Trouvez les meilleurs trajets selon vos critères'
    },
    {
      icon: 'calendar',
      title: 'Réservation en temps réel',
      description: 'Réservez vos billets instantanément'
    },
    {
      icon: 'card',
      title: 'Paiements sécurisés',
      description: 'Payez en toute sécurité avec plusieurs options'
    },
    {
      icon: 'notifications',
      title: 'Notifications intelligentes',
      description: 'Restez informé de vos voyages en temps réel'
    },
    {
      icon: 'people',
      title: 'Support 24/7',
      description: 'Une équipe dédiée pour vous accompagner'
    },
    {
      icon: 'shield-checkmark',
      title: 'Voyage sécurisé',
      description: 'Partenaires agréés et vérifiés'
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://facebook.com/travelhubcm',
      color: '#1877F2'
    },
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://instagram.com/travelhubcm',
      color: '#E4405F'
    },
    {
      name: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://twitter.com/travelhubcm',
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://linkedin.com/company/travelhubcm',
      color: '#0077B5'
    }
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Découvrez TravelHub, l\'application qui révolutionne le transport au Cameroun ! Téléchargez-la maintenant et voyagez en toute simplicité. 🚌✨',
        url: 'https://travelhub.cm/download',
        title: 'TravelHub - Voyagez malin!'
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager l\'application');
    }
  };

  const handleRateApp = () => {
    // TODO: Remplacer par l'URL réelle de l'app store
    const appStoreUrl = 'https://play.google.com/store/apps/details?id=com.travelhub.app';
    Linking.openURL(appStoreUrl);
  };

  const openWebsite = () => {
    Linking.openURL('https://travelhub.cm');
  };

  const openTerms = () => {
    navigation.navigate('TermsConditions');
  };

  const openPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const openLicenses = () => {
    navigation.navigate('Licenses');
  };

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'Mise à jour disponible',
          'Une nouvelle version de l\'application est disponible. Voulez-vous la télécharger maintenant ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Mettre à jour', onPress: () => Updates.fetchUpdateAsync() }
          ]
        );
      } else {
        Alert.alert('À jour', 'Vous utilisez déjà la dernière version de l\'application.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier les mises à jour');
    }
  };

  const FeatureItem = ({ feature }) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </View>
  );

  const TeamMember = ({ member }) => (
    <View style={styles.teamMember}>
      <View style={styles.memberAvatar}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={30} color={COLORS.text.secondary} />
        )}
      </View>
      <View style={styles.memberContent}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
        <Text style={styles.memberDescription}>{member.description}</Text>
      </View>
    </View>
  );

  const SocialLink = ({ social }) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor: social.color + '20' }]}
      onPress={() => Linking.openURL(social.url)}
    >
      <Ionicons name={social.icon} size={24} color={social.color} />
      <Text style={[styles.socialText, { color: social.color }]}>{social.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Logo et infos app */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <View style={styles.appLogo}>
              <Ionicons name="bus" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>TravelHub</Text>
            <Text style={styles.appTagline}>Voyagez malin, voyagez avec nous</Text>
            <Text style={styles.appVersion}>Version {appVersion} ({buildVersion})</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRateApp}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.actionButtonText}>Noter l'app</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={checkForUpdates}>
              <Ionicons name="download" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Vérifier les mises à jour</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre mission</Text>
          <Text style={styles.missionText}>
            TravelHub révolutionne le transport au Cameroun en connectant les voyageurs aux meilleures compagnies de bus. 
            Notre mission est de rendre le voyage simple, sûr et accessible à tous, tout en soutenant le développement 
            du transport local.
          </Text>
        </View>

        {/* Fonctionnalités */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos fonctionnalités</Text>
          {features.map((feature, index) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </View>

        {/* Équipe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre équipe</Text>
          {teamMembers.map((member, index) => (
            <TeamMember key={index} member={member} />
          ))}
        </View>

        {/* Statistiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos chiffres</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Compagnies partenaires</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>200+</Text>
              <Text style={styles.statLabel}>Destinations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10k+</Text>
              <Text style={styles.statLabel}>Voyages réservés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>99%</Text>
              <Text style={styles.statLabel}>Satisfaction client</Text>
            </View>
          </View>
        </View>

        {/* Réseaux sociaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivez-nous</Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((social, index) => (
              <SocialLink key={index} social={social} />
            ))}
          </View>
        </View>

        {/* Liens légaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>
          
          <TouchableOpacity style={styles.legalItem} onPress={openTerms}>
            <Text style={styles.legalText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem} onPress={openPrivacy}>
            <Text style={styles.legalText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem} onPress={openLicenses}>
            <Text style={styles.legalText}>Licences open source</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalItem} onPress={openWebsite}>
            <Text style={styles.legalText}>Site web officiel</Text>
            <Ionicons name="open" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.section}>
          <Text style={styles.copyright}>
            © 2025 TravelHub. Tous droits réservés.{'\n'}
            Développé avec ❤️ au Cameroun
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  appInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  appTagline: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  appVersion: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  
  actionButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  missionText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
    textAlign: 'justify',
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  featureContent: {
    flex: 1,
  },
  
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  featureDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  
  memberContent: {
    flex: 1,
  },
  
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  memberRole: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  
  memberDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  socialButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  
  socialText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  
  legalText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  
  copyright: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AboutScreen;
