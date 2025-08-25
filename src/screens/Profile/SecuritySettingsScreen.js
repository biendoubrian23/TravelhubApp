import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Modules natifs temporairement désactivés
// import * as LocalAuthentication from 'expo-local-authentication';
// import * as SecureStore from 'expo-secure-store';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { useAuthStore } from '../../store';

const SecuritySettingsScreen = ({ navigation }) => {
  const { user, updatePassword } = useAuthStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockTime, setAutoLockTime] = useState(5); // minutes
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // États liés à l'historique de sécurité supprimés

  useEffect(() => {
    // Fonctions temporairement désactivées en raison de problèmes avec les modules natifs
    // checkBiometricSupport();
    // loadSecuritySettings();
    // Fonction de chargement des logs de sécurité supprimée
    
    // Version simplifiée sans appels aux modules natifs
    setBiometricAvailable(false);
    setBiometricEnabled(false);
    console.log('⚠️ Authentification biométrique temporairement désactivée');
  }, []);

  const checkBiometricSupport = async () => {
    // Fonction simplifiée temporairement
    console.log('⚠️ Vérification biométrique désactivée');
    setBiometricAvailable(false);
  };

  const loadSecuritySettings = async () => {
    // Fonction simplifiée temporairement
    setTwoFactorEnabled(false);
    setAutoLockEnabled(false);
    setAutoLockTime(5);
    console.log('⚠️ Chargement des paramètres de sécurité désactivé');
  };

  // Fonction de chargement des logs de sécurité supprimée

  const toggleBiometric = async (enabled) => {
    // Fonction temporairement modifiée en raison de problèmes avec les modules natifs
    Alert.alert(
      'Fonctionnalité en maintenance',
      'L\'authentification biométrique est temporairement indisponible. Nous travaillons à résoudre ce problème.'
    );
    
    // Pour éviter tout problème, ne pas modifier l'état
    setBiometricEnabled(false);
  };

  const toggleTwoFactor = async (enabled) => {
    // Fonction temporairement modifiée en raison de problèmes avec les modules natifs
    Alert.alert(
      'Fonctionnalité en maintenance',
      'L\'authentification à deux facteurs est temporairement indisponible. Nous travaillons à résoudre ce problème.'
    );
    
    // Pour éviter tout problème, ne pas modifier l'état
    setTwoFactorEnabled(false);
  };

  const toggleAutoLock = async (enabled) => {
    // Fonction temporairement modifiée en raison de problèmes avec les modules natifs
    setAutoLockEnabled(enabled);
    
    if (enabled) {
      Alert.alert(
        'Fonctionnalité en maintenance',
        'Le verrouillage automatique est temporairement indisponible. Nous travaillons à résoudre ce problème.'
      );
      // Remettre le switch à off
      setAutoLockEnabled(false);
    }
  };

  const changeAutoLockTime = async (time) => {
    // Fonction temporairement modifiée en raison de problèmes avec les modules natifs
    setAutoLockTime(time);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès');
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel.');
    }
  };

  // Fonction d'effacement de l'historique de sécurité supprimée
  
  // Fonction de déconnexion de tous les appareils supprimée

  const SecurityItem = ({ title, description, value, onToggle, icon, type = 'switch' }) => (
    <View style={styles.securityItem}>
      <View style={styles.securityIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      
      <View style={styles.securityContent}>
        <Text style={styles.securityTitle}>{title}</Text>
        <Text style={styles.securityDescription}>{description}</Text>
      </View>
      
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
          thumbColor={value ? COLORS.primary : COLORS.text.secondary}
        />
      )}
      
      {type === 'button' && (
        <TouchableOpacity onPress={onToggle}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sécurité</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Authentification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentification</Text>
          
          <SecurityItem
            title="Sécurité de l'appareil"
            description={biometricAvailable ? "Utiliser le système de sécurité de l'appareil (empreinte, facial, code)" : "Aucun verrouillage d'écran configuré"}
            value={biometricEnabled}
            onToggle={toggleBiometric}
            icon="lock-closed"
          />
          
          <SecurityItem
            title="Authentification à deux facteurs"
            description="Code de vérification par SMS à chaque connexion"
            value={twoFactorEnabled}
            onToggle={toggleTwoFactor}
            icon="shield-checkmark"
          />
          
          <SecurityItem
            title="Verrouillage automatique"
            description={`Verrouiller après ${autoLockTime} minutes d'inactivité`}
            value={autoLockEnabled}
            onToggle={toggleAutoLock}
            icon="lock-closed"
          />
        </View>

        {/* Temps de verrouillage automatique */}
        {autoLockEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Délai de verrouillage</Text>
            <View style={styles.lockTimeContainer}>
              {[1, 5, 15, 30, 60].map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.lockTimeOption,
                    autoLockTime === time && styles.lockTimeSelected
                  ]}
                  onPress={() => changeAutoLockTime(time)}
                >
                  <Text style={[
                    styles.lockTimeText,
                    autoLockTime === time && styles.lockTimeTextSelected
                  ]}>
                    {time < 60 ? `${time}min` : `${time/60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Gestion du mot de passe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mot de passe</Text>
          
          <TouchableOpacity 
            style={styles.passwordButton}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Ionicons name="key" size={20} color={COLORS.primary} />
            <Text style={styles.passwordButtonText}>Changer le mot de passe</Text>
            <Ionicons 
              name={showChangePassword ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.input}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Saisissez votre mot de passe actuel"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Nouveau mot de passe (min. 8 caractères)"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirmez le nouveau mot de passe"
                  secureTextEntry
                />
              </View>

              <Button
                title="Changer le mot de passe"
                onPress={handleChangePassword}
              />
            </View>
          )}
        </View>

        {/* Section Historique de sécurité supprimée */}
        
        {/* Section Actions de sécurité supprimée */}

        {/* Conseils de sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils de sécurité</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipItem}>• Utilisez un mot de passe unique et complexe</Text>
            <Text style={styles.tipItem}>• Activez l'authentification à deux facteurs</Text>
            <Text style={styles.tipItem}>• Ne partagez jamais vos informations de connexion</Text>
            <Text style={styles.tipItem}>• Utilisez une connexion sécurisée pour vous connecter</Text>
            <Text style={styles.tipItem}>• Déconnectez-vous sur les appareils publics</Text>
          </View>
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  securityContent: {
    flex: 1,
  },
  
  securityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  securityDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  lockTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  
  lockTimeOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  
  lockTimeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  
  lockTimeText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  lockTimeTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.sm,
  },
  
  passwordButtonText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  
  passwordForm: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  
  inputGroup: {
    marginBottom: SPACING.md,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text.primary,
  },
  
  // Styles pour l'historique de sécurité supprimés
  
  // Styles pour les actions de sécurité supprimés
  
  tipsContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  
  tipItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
});

export default SecuritySettingsScreen;
