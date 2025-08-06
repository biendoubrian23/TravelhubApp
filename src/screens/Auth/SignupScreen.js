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
    telephone: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis'
    } else if (!isValidPhone(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

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
      const { data, error } = await signUp(
        formData.email.trim().toLowerCase(),
        formData.password,
        {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          telephone: formData.telephone.trim(),
          role: formData.role,
          full_name: `${formData.prenom.trim()} ${formData.nom.trim()}`
        }
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
                onPress: () => navigation.navigate('Login', { email: formData.email.trim().toLowerCase() }),
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
            { text: 'OK', onPress: () => navigation.navigate('Login', { email: formData.email.trim().toLowerCase() }) }
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
        navigation.navigate('Login')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
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
                  Créez votre compte TravelHub
                </Text>
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Type de compte</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'client' && styles.roleOptionSelected
                  ]}
                  onPress={() => updateFormData('role', 'client')}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={formData.role === 'client' ? COLORS.text.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'client' && styles.roleOptionTextSelected
                  ]}>
                    Voyageur
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'agence' && styles.roleOptionSelected
                  ]}
                  onPress={() => updateFormData('role', 'agence')}
                >
                  <Ionicons
                    name="business"
                    size={20}
                    color={formData.role === 'agence' ? COLORS.text.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'agence' && styles.roleOptionTextSelected
                  ]}>
                    Agence
                  </Text>
                </TouchableOpacity>
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
                />
                <Input
                  label="Prénom"
                  value={formData.prenom}
                  onChangeText={(value) => updateFormData('prenom', value)}
                  placeholder="Votre prénom"
                  error={errors.prenom}
                  style={styles.nameInput}
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
                placeholder="+237 XXX XXX XXX"
                keyboardType="phone-pad"
                error={errors.telephone}
              />

              <View style={styles.passwordContainer}>
                <Input
                  label="Mot de passe"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Votre mot de passe"
                  secureTextEntry={!showPassword}
                  error={errors.password}
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
