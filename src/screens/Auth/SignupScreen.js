import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Input } from '../../components'
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants'
import { useAuthStore } from '../../store'
import { isValidEmail, isValidPhone } from '../../utils/helpers'
import { supabase } from '../../services/supabase'
import Toast from 'react-native-toast-message'

const SignupScreen = ({ navigation }) => {
  const { signUp } = useAuthStore()
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '+237', // Préremplir avec le code pays du Cameroun
    ville: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    // Validation du nom - pas de lignes vides, caractères valides uniquement
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.nom.trim())) {
      newErrors.nom = 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    } else if (formData.nom.trim().split('\n').length > 1) {
      newErrors.nom = 'Le nom ne peut pas contenir de retours à la ligne'
    }

    // Validation du prénom - même règles que le nom
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis'
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.prenom.trim())) {
      newErrors.prenom = 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    } else if (formData.prenom.trim().split('\n').length > 1) {
      newErrors.prenom = 'Le prénom ne peut pas contenir de retours à la ligne'
    }

    // Validation de l'email - format strict
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = 'Format d\'email invalide'
    } else if (formData.email.trim().split('\n').length > 1) {
      newErrors.email = 'L\'email ne peut pas contenir de retours à la ligne'
    }

    // Validation du téléphone - format camerounais
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est requis'
    } else if (!formData.telephone.startsWith('+237')) {
      newErrors.telephone = 'Le numéro doit commencer par +237'
    } else if (formData.telephone.length !== 13) { // +237 + 9 chiffres
      newErrors.telephone = 'Le numéro doit contenir 9 chiffres après +237'
    } else if (!/^\+237[6-9][0-9]{8}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format invalide. Exemple: +237699123456'
    }

    // Validation de la ville
    if (!formData.ville.trim()) {
      newErrors.ville = 'La ville est requise'
    } else if (formData.ville.trim().length < 2) {
      newErrors.ville = 'La ville doit contenir au moins 2 caractères'
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.ville.trim())) {
      newErrors.ville = 'La ville ne peut contenir que des lettres, espaces, tirets et apostrophes'
    } else if (formData.ville.trim().split('\n').length > 1) {
      newErrors.ville = 'La ville ne peut pas contenir de retours à la ligne'
    }

    // Validation du mot de passe - sécurité renforcée
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    }

    // Validation de la confirmation du mot de passe
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const userDataToSend = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        telephone: formData.telephone.trim(),
        ville: formData.ville.trim() || null,
        full_name: `${formData.prenom.trim()} ${formData.nom.trim()}`
      };
      
      console.log('🔍 Données du formulaire à envoyer:', userDataToSend);
      
      const { data, error } = await signUp(
        formData.email.trim().toLowerCase(),
        formData.password,
        userDataToSend
      )
      
      if (error) {
        console.log('Signup error:', error.message)
        
        // Gestion détaillée des erreurs d'inscription
        if (error.message.includes('User already registered')) {
          Alert.alert(
            'Email déjà utilisé',
            'Un compte existe déjà avec cet email. Voulez-vous vous connecter ?',
            [
              { 
                text: 'Se connecter', 
                onPress: () => {
                  try {
                    navigation.navigate('Login', { email: formData.email.trim().toLowerCase() })
                  } catch (navError) {
                    console.warn('Navigation error:', navError)
                    navigation.navigate('Login')
                  }
                },
                style: 'default'
              },
              { 
                text: 'Mot de passe oublié', 
                onPress: () => handleForgotPassword(),
                style: 'default'
              },
              { text: 'Annuler', style: 'cancel' }
            ]
          )
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setErrors(prev => ({
            ...prev,
            password: 'Le mot de passe doit contenir au moins 6 caractères'
          }))
        } else if (error.message.includes('invalid email')) {
          setErrors(prev => ({
            ...prev,
            email: 'Format d\'email invalide'
          }))
        } else if (error.message.includes('rate limit')) {
          Alert.alert(
            'Trop de tentatives',
            'Vous avez effectué trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
            [{ text: 'OK', style: 'default' }]
          )
        } else {
          Alert.alert(
            'Erreur d\'inscription',
            error.message || 'Une erreur inattendue est survenue lors de l\'inscription.',
            [{ text: 'OK', style: 'default' }]
          )
        }
      } else {
        // Succès - utilisateur créé
        Toast.show({
          type: 'success',
          text1: 'Inscription réussie !',
          text2: 'Un email de confirmation vous a été envoyé',
          visibilityTime: 3000,
          position: 'top',
        });
        
        Alert.alert(
          'Inscription réussie', 
          'Votre compte a été créé avec succès. Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception et confirmer votre compte pour vous connecter.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Si l'utilisateur est déjà connecté après signup, pas besoin de naviguer
                if (data.user && data.session) {
                  console.log('Utilisateur connecté automatiquement après inscription')
                  // Ne pas naviguer, l'AppNavigator gérera automatiquement
                } else {
                  try {
                    navigation.navigate('Login', { email: formData.email.trim().toLowerCase() })
                  } catch (navError) {
                    console.warn('Navigation error:', navError)
                    navigation.navigate('Login')
                  }
                }
              }
            }
          ]
        )
      }
    } catch (error) {
      console.error('Signup error:', error)
      Alert.alert(
        'Erreur système', 
        'Une erreur est survenue lors de l\'inscription. Veuillez réessayer plus tard.',
        [{ text: 'OK', style: 'default' }]
      )
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour gérer la saisie du téléphone avec validation du préfixe
  const handlePhoneChange = (text) => {
    // S'assurer que le texte commence toujours par +237
    if (!text.startsWith('+237')) {
      text = '+237' + text.replace(/^\+?237?/, '');
    }
    
    // Limiter à 13 caractères (+237 + 9 chiffres)
    if (text.length > 13) {
      text = text.substring(0, 13);
    }
    
    // Ne permettre que les chiffres après +237
    const phoneNumber = text.substring(4); // Enlever +237
    const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    setFormData(prev => ({
      ...prev,
      telephone: '+237' + cleanPhoneNumber
    }));
    
    // Effacer l'erreur si le format devient valide
    if (text.length === 13 && /^\+237[6-9][0-9]{8}$/.test(text)) {
      setErrors(prev => ({ ...prev, telephone: '' }));
    }
  }

  // Fonction pour valider les champs texte (nom, prénom, ville)
  const handleTextFieldChange = (field, text) => {
    // Empêcher les retours à la ligne
    const cleanText = text.replace(/\n/g, '');
    
    setFormData(prev => ({
      ...prev,
      [field]: cleanText
    }));
    
    // Effacer l'erreur si le champ devient valide
    if (cleanText.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(cleanText.trim())) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }

  const handleForgotPassword = async () => {
    const email = formData.email.trim().toLowerCase()
    if (!email || !isValidEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide')
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      })
      
      if (error) {
        Alert.alert('Erreur', error.message || 'Impossible d\'envoyer l\'email de réinitialisation')
      } else {
        Alert.alert(
          'Email envoyé',
          'Un email de réinitialisation de mot de passe a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.'
        )
        try {
          navigation.navigate('Login')
        } catch (navError) {
          console.warn('Navigation error:', navError)
        }
      }
    } catch (error) {
      console.error('Password reset error:', error)
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field, value) => {
    // Appliquer les validations spécifiques selon le champ
    if (field === 'telephone') {
      handlePhoneChange(value);
    } else if (['nom', 'prenom', 'ville'].includes(field)) {
      handleTextFieldChange(field, value);
    } else {
      // Pour email et password, validation standard
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Text style={styles.title}>Inscription</Text>
                <Text style={styles.subtitle}>
                  Créez votre compte voyageur TravelHub
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <Input
                  label="Nom"
                  value={formData.nom}
                  onChangeText={(value) => updateFormData('nom', value)}
                  placeholder="Votre nom"
                  error={errors.nom}
                  style={[styles.nameInput, { marginRight: SPACING.sm }]}
                  autoCapitalize="words"
                  maxLength={50}
                />
                <Input
                  label="Prénom"
                  value={formData.prenom}
                  onChangeText={(value) => updateFormData('prenom', value)}
                  placeholder="Votre prénom"
                  error={errors.prenom}
                  style={styles.nameInput}
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />

              <Input
                label="Téléphone"
                value={formData.telephone}
                onChangeText={(value) => updateFormData('telephone', value)}
                placeholder="+237 699 123 456"
                keyboardType="numeric"
                maxLength={13}
                error={errors.telephone}
                helperText="Format: +237 suivi de 9 chiffres"
              />

              <Input
                label="Ville"
                value={formData.ville}
                onChangeText={(value) => updateFormData('ville', value)}
                placeholder="Ex: Douala, Yaoundé, Bafoussam..."
                autoCapitalize="words"
                maxLength={50}
                error={errors.ville}
                helperText="Votre ville de résidence"
              />

              <View style={styles.passwordContainer}>
                <Input
                  label="Mot de passe"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Minimum 8 caractères"
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <Input
                  label="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirmez votre mot de passe"
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <Button
                title="Créer mon compte"
                onPress={handleSignup}
                loading={loading}
                style={styles.signupButton}
                size="large"
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Déjà un compte ?{' '}
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Se connecter</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardAvoid: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },

  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },

  roleContainer: {
    marginBottom: SPACING.lg,
  },

  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  roleOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  roleOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },

  roleOptionTextSelected: {
    color: COLORS.text.white,
  },

  form: {
    marginBottom: SPACING.xl,
  },

  nameRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  nameInput: {
    flex: 1,
  },

  passwordContainer: {
    position: 'relative',
  },

  passwordToggle: {
    position: 'absolute',
    right: SPACING.md,
    top: 38,
    padding: SPACING.xs,
  },

  signupButton: {
    marginTop: SPACING.md,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },

  footerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
})

export default SignupScreen
