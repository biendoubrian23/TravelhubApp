import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';

const { width, height } = Dimensions.get('window');

const UserTypeSelectionScreen = ({ navigation }) => {
  const handleClientSelection = () => {
    navigation.navigate('Login', { userType: 'client' });
  };

  const handleAgencySelection = () => {
    navigation.navigate('AgencyAuth');
  };

  const UserTypeCard = ({ 
    icon, 
    title, 
    subtitle, 
    features, 
    onPress, 
    gradientColors,
    iconColor 
  }) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
        </View>
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.bulletPoint, { backgroundColor: iconColor }]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={18} color={iconColor} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="bus" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>TravelHub</Text>
        </View>
        
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>
          Choisissez votre profil pour commencer votre expérience
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <UserTypeCard
          icon="person"
          title="Je suis un Client"
          subtitle="Réservez vos voyages en toute simplicité"
          features={[
            "Recherche de trajets",
            "Réservation en ligne",
            "Paiement sécurisé",
            "Historique des voyages"
          ]}
          gradientColors={['#E3F2FD', '#BBDEFB']}
          iconColor={COLORS.primary}
          onPress={handleClientSelection}
        />

        <UserTypeCard
          icon="business"
          title="Je suis une Agence"
          subtitle="Gérez vos services de transport"
          features={[
            "Gestion des trajets",
            "Suivi des réservations", 
            "Analyse des performances",
            "Interface de gestion"
          ]}
          gradientColors={['#FFF3E0', '#FFE0B2']}
          iconColor="#FF8A00"
          onPress={handleAgencySelection}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.linkText}>conditions d'utilisation</Text>
          {' '}et notre{' '}
          <Text style={styles.linkText}>politique de confidentialité</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  cardContainer: {
    marginBottom: 0,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    minHeight: 200,
    maxHeight: 220,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  featuresContainer: {
    marginBottom: 12,
    flex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 20,
  },
  bulletPoint: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default UserTypeSelectionScreen;
