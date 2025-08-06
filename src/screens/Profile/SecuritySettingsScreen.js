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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
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

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  useEffect(() => {
    checkBiometricSupport();
    loadSecuritySettings();
    loadSecurityLogs();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
    
    if (compatible && enrolled) {
      // Charger l'état de la biométrie depuis le stockage sécurisé
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      setBiometricEnabled(enabled === 'true');
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const twoFactor = await SecureStore.getItemAsync('two_factor_enabled');
      const autoLock = await SecureStore.getItemAsync('auto_lock_enabled');
      const lockTime = await SecureStore.getItemAsync('auto_lock_time');
      
      setTwoFactorEnabled(twoFactor === 'true');
      setAutoLockEnabled(autoLock === 'true');
      setAutoLockTime(lockTime ? parseInt(lockTime) : 5);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de sécurité:', error);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const attempts = await SecureStore.getItemAsync('failed_login_attempts');
      const lastLogin = await SecureStore.getItemAsync('last_login_time');
      
      setLoginAttempts(attempts ? parseInt(attempts) : 0);
      setLastLoginTime(lastLogin ? new Date(lastLogin) : null);
    } catch (error) {
      console.error('Erreur lors du chargement des logs de sécurité:', error);
    }
  };

  const toggleBiometric = async (enabled) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Non disponible',
        'La biométrie n\'est pas disponible sur cet appareil ou aucune empreinte/face n\'est configurée.'
      );
      return;
    }

    if (enabled) {
      // Demander l'authentification biométrique
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmer avec votre empreinte ou visage',
        disableDeviceFallback: true,
      });

      if (result.success) {
        setBiometricEnabled(true);
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        Alert.alert('Succès', 'L\'authentification biométrique a été activée');
      } else {
        Alert.alert('Échec', 'Impossible de configurer l\'authentification biométrique');
      }
    } else {
      setBiometricEnabled(false);
      await SecureStore.setItemAsync('biometric_enabled', 'false');
      Alert.alert('Désactivé', 'L\'authentification biométrique a été désactivée');
    }
  };

  const toggleTwoFactor = async (enabled) => {
    if (enabled) {
      Alert.alert(
        'Activer 2FA',
        'Vous recevrez un code de vérification par SMS à chaque connexion. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: async () => {
              setTwoFactorEnabled(true);
              await SecureStore.setItemAsync('two_factor_enabled', 'true');
              // TODO: Configurer 2FA côté serveur
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Désactiver 2FA',
        'Votre compte sera moins sécurisé. Êtes-vous sûr ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Désactiver',
            style: 'destructive',
            onPress: async () => {
              setTwoFactorEnabled(false);
              await SecureStore.setItemAsync('two_factor_enabled', 'false');
            }
          }
        ]
      );
    }
  };

  const toggleAutoLock = async (enabled) => {
    setAutoLockEnabled(enabled);
    await SecureStore.setItemAsync('auto_lock_enabled', enabled.toString());
    
    if (enabled) {
      Alert.alert(
        'Verrouillage automatique activé',
        `L'application se verrouillera après ${autoLockTime} minutes d'inactivité`
      );
    }
  };

  const changeAutoLockTime = async (time) => {
    setAutoLockTime(time);
    await SecureStore.setItemAsync('auto_lock_time', time.toString());
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

  const clearSecurityLogs = async () => {
    Alert.alert(
      'Effacer l\'historique',
      'Voulez-vous effacer l\'historique de sécurité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('failed_login_attempts');
            await SecureStore.deleteItemAsync('last_login_time');
            setLoginAttempts(0);
            setLastLoginTime(null);
            Alert.alert('Succès', 'Historique de sécurité effacé');
          }
        }
      ]
    );
  };

  const logoutAllDevices = () => {
    Alert.alert(
      'Déconnexion partout',
      'Cela vous déconnectera de tous vos appareils. Vous devrez vous reconnecter. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: () => {
            // TODO: Implémenter la déconnexion de tous les appareils
            Alert.alert('Succès', 'Déconnecté de tous les appareils');
          }
        }
      ]
    );
  };

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
            title="Authentification biométrique"
            description={biometricAvailable ? "Utiliser l'empreinte ou reconnaissance faciale" : "Non disponible sur cet appareil"}
            value={biometricEnabled}
            onToggle={toggleBiometric}
            icon="finger-print"
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

        {/* Historique de sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique de sécurité</Text>
          
          <View style={styles.securityLog}>
            <View style={styles.logItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>Dernière connexion</Text>
                <Text style={styles.logText}>
                  {lastLoginTime ? lastLoginTime.toLocaleString('fr-FR') : 'Jamais connecté'}
                </Text>
              </View>
            </View>

            <View style={styles.logItem}>
              <Ionicons name="warning" size={20} color={loginAttempts > 0 ? COLORS.error : COLORS.success} />
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>Tentatives de connexion échouées</Text>
                <Text style={[styles.logText, loginAttempts > 0 && { color: COLORS.error }]}>
                  {loginAttempts} tentative(s)
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={clearSecurityLogs}>
              <Text style={styles.clearButtonText}>Effacer l'historique</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions de sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions de sécurité</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={logoutAllDevices}>
            <Ionicons name="phone-portrait" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
              Se déconnecter de tous les appareils
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Conseils de sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils de sécurité</Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipItem}>• Utilisez un mot de passe unique et complexe</Text>
            <Text style={styles.tipItem}>• Activez l'authentification à deux facteurs</Text>
            <Text style={styles.tipItem}>• Ne partagez jamais vos informations de connexion</Text>
            <Text style={styles.tipItem}>• Vérifiez régulièrement votre historique de connexion</Text>
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
  
  securityLog: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  logContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  
  logTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  logText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  clearButton: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  
  clearButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.sm,
  },
  
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  
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
