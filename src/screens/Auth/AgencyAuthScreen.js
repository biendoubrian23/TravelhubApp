import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const AgencyAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleBackToSelection = () => {
    navigation.goBack();
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
  };

  const handleLoginPress = () => {
    navigation.navigate('AgencyLogin');
  };

  const handleSignupPress = () => {
    navigation.navigate('AgencySignup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToSelection}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="business" size={24} color="#FF8A00" />
          </View>
          <Text style={styles.logoText}>Espace Agence</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLogin ? 'Connexion Agence' : 'Créer un compte Agence'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin 
            ? 'Connectez-vous à votre espace de gestion'
            : 'Rejoignez TravelHub et développez votre activité'
          }
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isLogin ? (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleLoginPress}
            >
              <Text style={styles.primaryButtonText}>Se connecter</Text>
              <Ionicons name="log-in" size={20} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleSignupPress}
            >
              <Text style={styles.primaryButtonText}>Créer mon compte</Text>
              <Ionicons name="person-add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSwitchMode}
          >
            <Text style={styles.secondaryButtonText}>
              {isLogin 
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features for agencies */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Avantages pour les agences :</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color="#FF8A00" />
              <Text style={styles.featureText}>Gestion complète des trajets</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color="#FF8A00" />
              <Text style={styles.featureText}>Suivi des réservations clients</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={20} color="#FF8A00" />
              <Text style={styles.featureText}>Statistiques et analyses</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="card" size={20} color="#FF8A00" />
              <Text style={styles.featureText}>Gestion des paiements</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Besoin d'aide ? Contactez notre équipe
        </Text>
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="headset" size={16} color={COLORS.primary} />
          <Text style={styles.supportText}>Support Agences</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF8A00' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8A00',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF8A00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  featuresContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
  },
  supportText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AgencyAuthScreen;
