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
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const { data, error } = await signIn(email.trim().toLowerCase(), password)
      
      if (error) {
        console.log('Auth error message:', error.message)
        
        // Gestion détaillée des erreurs d'authentification
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Échec de connexion', 
            'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants et réessayer.',
            [{ text: 'OK', style: 'default' }]
          )
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email non confirmé', 
            'Votre compte n\'a pas encore été confirmé. Veuillez vérifier votre boîte mail (y compris les spams) et cliquer sur le lien de confirmation.',
            [
              { 
                text: 'Renvoyer l\'email', 
                onPress: () => handleResendConfirmation(),
                style: 'default'
              },
              { text: 'OK', style: 'cancel' }
            ]
          )
        } else if (error.message.includes('rate limit')) {
          Alert.alert(
            'Trop de tentatives', 
            'Vous avez effectué trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.',
            [{ text: 'OK', style: 'default' }]
          )
        } else if (error.message.includes('network')) {
          Alert.alert(
            'Problème de réseau', 
            'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.',
            [{ text: 'OK', style: 'default' }]
          )
        } else {
          Alert.alert(
            'Erreur de connexion', 
            error.message || 'Une erreur inattendue est survenue lors de la connexion. Veuillez réessayer plus tard.',
            [{ text: 'OK', style: 'default' }]
          )
        }
      } else if (data && data.user) {
        // Connexion réussie, afficher un Toast
        Toast.show({
          type: 'success',
          text1: 'Connexion réussie',
          text2: `Bienvenue ${data.user.email}`,
          visibilityTime: 3000,
          position: 'top',
        });
      }
    } catch (error) {
      Alert.alert(
        'Erreur système', 
        'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.',
        [{ text: 'OK', style: 'default' }]
      )
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour renvoyer l'email de confirmation
  const handleResendConfirmation = async () => {
    if (!email || !isValidEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide')
      return
    }
    
    setLoading(true)
    try {
      // Utilisation de l'API Supabase pour renvoyer l'email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase()
      })
      
      if (error) {
        Alert.alert('Erreur', error.message || 'Impossible de renvoyer l\'email de confirmation')
      } else {
        Alert.alert(
          'Email envoyé',
          'Un nouvel email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et vos spams.'
        )
      }
    } catch (error) {
      console.error('Resend confirmation error:', error)
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour gérer le mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Email requis', 
        'Veuillez entrer votre adresse email ci-dessus pour réinitialiser votre mot de passe.'
      )
      return
    }

    if (!isValidEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'myapp://reset-password',
      })
      
      if (error) {
        Alert.alert(
          'Erreur', 
          error.message || 'Impossible d\'envoyer l\'email de réinitialisation'
        )
      } else {
        Alert.alert(
          'Email envoyé',
          'Un email de réinitialisation de mot de passe a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et vos spams.'
        )
      }
    } catch (error) {
      console.error('Password reset error:', error)
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // TODO: Implémenter la connexion Google
    Alert.alert('Info', 'Connexion Google bientôt disponible')
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
              onChangeText={setEmail}
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
                onChangeText={setPassword}
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
              title="🧪 Connexion Rapide (clarkybrian@outlook.fr)"
              onPress={() => {
                setEmail('clarkybrian@outlook.fr')
                setPassword('123456')
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
