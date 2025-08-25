import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button, Input } from '../../components'
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants'
import { useAuthStore } from '../../store'
import { isValidEmail } from '../../utils/helpers'
import { supabase } from '../../services/supabase'
import Toast from 'react-native-toast-message'

const LoginScreen = ({ navigation, route }) => {
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('') // Message d'erreur général
  
  // Pré-remplir l'email si on arrive depuis la page d'inscription
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email)
    }
  }, [route.params?.email])

  const validateForm = () => {
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide'
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    setErrors(newErrors)
    
    // Si des erreurs sont présentes, afficher un toast
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      Toast.show({
        type: 'error',
        text1: 'Formulaire incomplet',
        text2: firstError,
        visibilityTime: 3000,
        position: 'top',
      });
      return false;
    }
    
    return true;
  }

  // Fonction pour effacer les erreurs quand l'utilisateur tape
  const clearErrors = () => {
    if (loginError) {
      setLoginError('')
      // Masquer le toast d'erreur si nécessaire
      Toast.hide()
    }
    if (Object.keys(errors).length > 0) setErrors({})
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    setLoginError('') // Reset previous errors
    
    try {
      const result = await signIn(email.trim().toLowerCase(), password)
      const { data, error } = result || {}
      
      if (error) {
        // Log simple pour le débogage
        console.log('Tentative de connexion échouée:', error.message)
        
        let errorMessage = '';
        
        // Messages d'erreur simplifiés et clairs
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect. Veuillez vérifier vos informations.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Votre compte n\'est pas encore confirmé. Vérifiez votre email ou cliquez ci-dessous pour renvoyer l\'email de confirmation.';
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          errorMessage = 'Trop de tentatives de connexion. Attendez quelques minutes avant de réessayer.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Problème de connexion internet. Vérifiez votre réseau et réessayez.';
        } else {
          errorMessage = 'Erreur de connexion. Veuillez réessayer plus tard.';
        }
        
        // Mettre à jour l'état d'erreur
        setLoginError(errorMessage)
        
        // Afficher également un toast pour plus de visibilité
        Toast.show({
          type: 'error',
          text1: 'Échec de connexion',
          text2: errorMessage,
          visibilityTime: 4000,
          position: 'top',
        });
      } else if (data && data.user) {
        // Connexion réussie, afficher un Toast
        Toast.show({
          type: 'success',
          text1: 'Connexion réussie',
          text2: `Bienvenue ${data.user.email}`,
          visibilityTime: 3000,
          position: 'top',
        });
        setLoginError('') // Clear any previous errors
      }
    } catch (error) {
      // Log pour les erreurs systèmes inattendues seulement
      console.log('Erreur système de connexion:', error.message)
      const errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      setLoginError(errorMessage);
      
      // Afficher un toast pour l'erreur
      Toast.show({
        type: 'error',
        text1: 'Erreur système',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
      });
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour renvoyer l'email de confirmation
  const handleResendConfirmation = async () => {
    if (!email || !isValidEmail(email)) {
      const errorMessage = 'Veuillez entrer une adresse email valide pour renvoyer l\'email de confirmation.';
      setLoginError(errorMessage);
      
      // Afficher un toast pour plus de visibilité
      Toast.show({
        type: 'error',
        text1: 'Format d\'email invalide',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
      });
      
      return;
    }
    
    setLoading(true)
    setLoginError('')
    
    try {
      // Utilisation de l'API Supabase pour renvoyer l'email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      })
      
      if (error) {
        const errorMessage = error.message || 'Impossible de renvoyer l\'email de confirmation.';
        setLoginError(errorMessage);
        
        // Afficher un toast pour l'erreur
        Toast.show({
          type: 'error',
          text1: 'Échec d\'envoi',
          text2: errorMessage,
          visibilityTime: 4000,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Email envoyé',
          text2: 'Vérifiez votre boîte de réception et vos spams.',
          visibilityTime: 4000,
          position: 'top',
        });
        setLoginError('')
      }
    } catch (error) {
      console.error('Resend confirmation error:', error)
      const errorMessage = 'Une erreur est survenue lors de l\'envoi de l\'email.';
      setLoginError(errorMessage);
      
      // Afficher un toast pour l'erreur
      Toast.show({
        type: 'error',
        text1: 'Échec d\'envoi',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
      });
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour gérer le mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError('Veuillez entrer votre adresse email ci-dessus pour réinitialiser votre mot de passe.')
      return
    }

    if (!isValidEmail(email)) {
      const errorMessage = 'Veuillez entrer une adresse email valide.';
      setLoginError(errorMessage);
      
      // Afficher un toast pour plus de visibilité
      Toast.show({
        type: 'error',
        text1: 'Format d\'email invalide',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
      });
      
      return;
    }

    setLoading(true)
    setLoginError('')
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'myapp://reset-password',
      })
      
      if (error) {
        const errorMessage = error.message || 'Impossible d\'envoyer l\'email de réinitialisation.';
        setLoginError(errorMessage);
        
        // Afficher un toast pour l'erreur
        Toast.show({
          type: 'error',
          text1: 'Échec de réinitialisation',
          text2: errorMessage,
          visibilityTime: 4000,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Email envoyé',
          text2: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
          visibilityTime: 4000,
          position: 'top',
        });
        setLoginError('')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      const errorMessage = 'Une erreur est survenue lors de l\'envoi de l\'email.';
      setLoginError(errorMessage);
      
      // Afficher un toast pour l'erreur
      Toast.show({
        type: 'error',
        text1: 'Erreur de réinitialisation',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
      });
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // TODO: Implémenter la connexion Google
    Toast.show({
      type: 'info',
      text1: 'Bientôt disponible',
      text2: 'La connexion Google sera disponible dans une prochaine mise à jour.',
      visibilityTime: 3000,
      position: 'top',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour réserver vos trajets
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                clearErrors()
              }}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <View style={styles.passwordContainer}>
              <Input
                label="Mot de passe"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  clearErrors()
                }}
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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            {/* Message d'erreur général */}
            {loginError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{loginError}</Text>
                {loginError.includes('pas encore confirmé') && (
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleResendConfirmation}
                  >
                    <Text style={styles.resendButtonText}>Renvoyer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              size="large"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <Button
              title="Continuer avec Google"
              onPress={handleGoogleLogin}
              variant="outline"
              style={styles.googleButton}
              size="large"
            />

            {/* Test Button - DEV ONLY */}
            <Button
              title="🧪 Connexion Rapide (clarjybrian@outlook.fr)"
              onPress={() => {
                setEmail('clarjybrian@outlook.fr')
                setPassword('TravelHub2025!')
                setTimeout(() => handleLogin(), 100)
              }}
              variant="outline"
              style={[styles.googleButton, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
              size="large"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Pas encore de compte ?{' '}
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
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

  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  form: {
    marginBottom: SPACING.xl,
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

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },

  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
    fontWeight: '500',
  },

  resendButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },

  resendButtonText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },

  loginButton: {
    marginBottom: SPACING.lg,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginHorizontal: SPACING.md,
  },

  googleButton: {
    marginBottom: SPACING.lg,
  },

  footer: {
    alignItems: 'center',
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

export default LoginScreen
