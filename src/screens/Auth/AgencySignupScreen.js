import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { COLORS } from '../../constants';

const AgencySignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    // Informations utilisateur
    email: '',
    password: '',
    confirmPassword: '',
    
    // Informations agence (selon la BD)
    name: '',
    phone: '',
    description: '',
    address: '',
    license_number: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { signUp } = useAuthStore();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { email, password, confirmPassword } = formData;
    
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const { name, phone, address, license_number } = formData;
    
    if (!name || !phone || !address || !license_number) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSignup = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { data, error } = await signUp(
        formData.email, 
        formData.password, 
        {
          firstName: '',
          lastName: '',
          phone: formData.phone,
          role: 'agency',
          // Données spécifiques à l'agence
          agencyName: formData.name,
          agencyDescription: formData.description,
          agencyAddress: formData.address,
          agencyLicense: formData.license_number,
        }
      );
      
      if (error) {
        Alert.alert('Erreur d\'inscription', error.message);
      } else {
        Alert.alert(
          'Inscription réussie !',
          'Votre compte agence a été créé. Vous pouvez maintenant vous connecter.',
          [
            {
              text: 'Se connecter',
              onPress: () => navigation.navigate('AgencyLogin')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations de connexion</Text>
      <Text style={styles.stepSubtitle}>Créez vos identifiants de connexion</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email professionnel *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="contact@votre-agence.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mot de passe *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            placeholder="Minimum 6 caractères"
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirmer le mot de passe *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            placeholder="Confirmer votre mot de passe"
            secureTextEntry={!showConfirmPassword}
            autoComplete="password"
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={handleNextStep}
      >
        <Text style={styles.primaryButtonText}>Continuer</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations de l'agence</Text>
      <Text style={styles.stepSubtitle}>Renseignez les détails de votre agence</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom de l'agence *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="business" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Ex: Transport Express Cameroun"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Téléphone *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            placeholder="Ex: +237 6XX XXX XXX"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse complète *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(value) => updateFormData('address', value)}
            placeholder="Adresse complète de votre agence"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de licence *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="document-text" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.input}
            value={formData.license_number}
            onChangeText={(value) => updateFormData('license_number', value)}
            placeholder="Numéro de licence de transport"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description (optionnel)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Décrivez votre agence et vos services"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handlePrevStep}
        >
          <Ionicons name="arrow-back" size={20} color="#FF8A00" />
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryButton, styles.flexButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.primaryButtonText}>Création...</Text>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Créer mon compte</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => currentStep === 1 ? navigation.goBack() : handlePrevStep()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="business" size={24} color="#FF8A00" />
            </View>
            <Text style={styles.logoText}>Inscription Agence</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]} />
            <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]} />
          </View>
          <Text style={styles.progressText}>Étape {currentStep} sur 2</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 ? renderStep1() : renderStep2()}

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AgencyLogin')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    backgroundColor: COLORS.border,
    marginRight: 4,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#FF8A00',
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordToggle: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#FF8A00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF8A00',
  },
  secondaryButtonText: {
    color: '#FF8A00',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  flexButton: {
    flex: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    color: '#FF8A00',
    fontWeight: '500',
  },
});

export default AgencySignupScreen;
