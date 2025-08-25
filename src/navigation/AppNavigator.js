import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, Alert, Modal, Text, TouchableOpacity } from 'react-native';
// Import temporairement désactivé en raison de problèmes avec le module natif
// import deviceSecurityService from '../services/deviceSecurityService';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ResultsScreen from '../screens/Results/ResultsScreen';
import DetailsScreen from '../screens/Details/DetailsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import BookingsScreen from '../screens/Bookings/BookingsScreen';
import BookingDetailsScreen from '../screens/Bookings/BookingDetailsScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import SupabaseTestScreen from '../screens/SupabaseTestScreen';
import RealtimeTestScreen from '../screens/RealtimeTestScreenDiagnostic';
import RealDataTestScreen from '../screens/RealDataTestScreen';
import VipSeatDisplayScreen from '../screens/VipSeatDisplayScreen';
import SeatSelectionScreen from '../screens/SeatSelection/SeatSelectionScreen';
import RecapScreen from '../screens/Recap/RecapScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import PaymentSuccessScreen from '../screens/Payment/PaymentSuccessScreen';
import ReservationTestScreen from '../screens/ReservationTestScreen';
import DatabaseTestScreen from '../screens/DatabaseTestScreen';
import UserDataTestScreen from '../screens/UserDataTestScreen';

// New Auth Screens
import SplashScreen from '../screens/Auth/SplashScreen';

// Profile Screens
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import NotificationSettingsScreen from '../screens/Profile/NotificationSettingsScreen';
import HelpSupportScreen from '../screens/Profile/HelpSupportScreen';
import TermsConditionsScreen from '../screens/Profile/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/Profile/PrivacyPolicyScreen';
// Temporairement désactivés
// import AboutScreen from '../screens/Profile/AboutScreen';
import SecuritySettingsScreen from '../screens/Profile/SecuritySettingsScreen';
import TripHistoryScreen from '../screens/TripHistory/TripHistoryScreen';

// Referral Screens
import ReferralScreen from '../screens/Referral/ReferralScreen';

// Invoice Screens
import InvoicesScreen from '../screens/Invoices/InvoicesScreen';
import InvoicePreviewScreen from '../screens/Invoices/InvoicePreviewScreen';

// Store
import { useAuthStore } from '../store'
import { COLORS } from '../constants'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Tab Navigator pour les utilisateurs connectés (clients)
const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'ticket' : 'ticket-outline'
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen}
        options={{ tabBarLabel: 'Mes trajets' }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favoris' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Compte' }}
      />
    </Tab.Navigator>
  )
}

// Stack Navigator principal
const AppNavigator = () => {
  const { user, isLoading, isAuthenticated, initialize } = useAuthStore()
  const [hasInitialized, setHasInitialized] = React.useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initialisation de la session...')
        await initialize()
        console.log('✅ Initialisation de la session terminée')
        
        // NOTE: Authentification biométrique temporairement désactivée en raison de problèmes avec le module natif
        // Nous avons retiré la vérification d'authentification biométrique pour éviter les crashs
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la session:', error)
      } finally {
        setHasInitialized(true)
      }
    }
    init()
  }, [])

  // Écran de chargement minimal pendant l'initialisation
  if (isLoading || !hasInitialized || isAuthenticating) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.surface }]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        {isAuthenticating && (
          <Text style={styles.loadingText}>Vérification de l'identité...</Text>
        )}
      </View>
    )
  }
  
  // Si l'authentification a échoué, afficher un écran bloquant
  if (authFailed) {
    return (
      <View style={styles.authFailedContainer}>
        <Ionicons name="lock-closed" size={64} color={COLORS.primary} />
        <Text style={styles.authFailedTitle}>Authentification requise</Text>
        <Text style={styles.authFailedText}>
          Pour accéder à l'application, vous devez utiliser le système de sécurité de votre appareil.
        </Text>
        <TouchableOpacity
          style={styles.authRetryButton}
          onPress={async () => {
            setIsAuthenticating(true);
            const authResult = await deviceSecurityService.authenticate();
            setIsAuthenticating(false);
            if (authResult.success) {
              setAuthFailed(false);
            }
          }}
        >
          <Text style={styles.authRetryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('🔍 AppNavigator - État auth:', { 
    isAuthenticated, 
    hasUser: !!user,
    userEmail: user?.email 
  });

  // Thème de navigation forcé en mode clair
  const lightNavigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.text.primary,
      border: COLORS.border,
      notification: COLORS.accent,
    },
  };

  return (
    <NavigationContainer theme={lightNavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        {isAuthenticated && user ? (
          // Interface utilisateur connecté
          <>
            <Stack.Screen 
              name="ClientMain" 
              component={ClientTabNavigator}
              options={{ headerShown: false }}
            />
            
            {/* Booking Screens */}
            <Stack.Screen 
              name="BookingDetails" 
              component={BookingDetailsScreen}
              options={{
                title: 'Détails de la réservation',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />

            {/* Profile Screens */}
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{
                title: 'Modifier le profil',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{
                title: 'Notifications',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{
                title: 'Aide & Support',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="SecuritySettings" 
              component={SecuritySettingsScreen}
              options={{
                title: 'Sécurité',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="TripHistory" 
              component={TripHistoryScreen}
              options={{
                title: 'Historique des voyages',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />

            {/* Invoice Screen */}
            <Stack.Screen 
              name="Invoices" 
              component={InvoicesScreen}
              options={{
                title: 'Mes Factures',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="InvoicePreview" 
              component={InvoicePreviewScreen}
              options={{
                title: 'Aperçu Facture',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />

            {/* Referral Screen */}
            <Stack.Screen 
              name="Referral" 
              component={ReferralScreen}
              options={{
                title: 'Parrainage',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />

            {/* Legal Screens */}
            <Stack.Screen 
              name="TermsConditions" 
              component={TermsConditionsScreen}
              options={{
                title: 'Conditions d\'utilisation',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{
                title: 'Politique de confidentialité',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />
          </>
        ) : (
          // Interface utilisateur non connecté
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ animationEnabled: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
            />
          </>
        )}
        
        {/* Écrans accessibles dans tous les cas */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="SeatSelection" 
          component={SeatSelectionScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="Recap" 
          component={RecapScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="Payment" 
          component={PaymentScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="PaymentSuccess" 
          component={PaymentSuccessScreen}
          options={{
            presentation: 'card',
            animationTypeForReplace: 'push',
            gestureEnabled: false, // Empêcher le retour par geste
          }}
        />

        {/* Test Screens */}
        <Stack.Screen 
          name="RealtimeTest" 
          component={RealtimeTestScreen}
          options={{
            title: '🧪 Test Realtime',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="RealDataTest" 
          component={RealDataTestScreen}
          options={{
            title: '🗄️ Test Données Réelles',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="DatabaseTest" 
          component={DatabaseTestScreen}
          options={{
            title: '🗄️ Test Base de Données',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="VipSeatDisplay" 
          component={VipSeatDisplayScreen}
          options={{
            title: '🚌 Plan Sièges VIP',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="ReservationTest" 
          component={ReservationTestScreen}
          options={{
            title: '🧪 Test Réservations',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
        <Stack.Screen 
          name="UserDataTest" 
          component={UserDataTestScreen}
          options={{
            title: '👤 Test Données Utilisateur',
            presentation: 'card',
            animationTypeForReplace: 'push',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.text.secondary,
    fontSize: 14
  },
  authFailedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20
  },
  authFailedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 20,
    marginBottom: 10
  },
  authFailedText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 30
  },
  authRetryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10
  },
  authRetryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
})

export default AppNavigator
