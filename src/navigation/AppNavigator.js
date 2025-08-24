import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

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
// Temporairement désactivés
// import AboutScreen from '../screens/Profile/AboutScreen';
// import SecuritySettingsScreen from '../screens/Profile/SecuritySettingsScreen';
import TripHistoryScreen from '../screens/TripHistory/TripHistoryScreen';

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

  useEffect(() => {
    initialize()
  }, [])

  // Écran de chargement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  // Détermine la route initiale : Splash si pas authentifié, sinon ClientMain
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
        initialRouteName={isAuthenticated ? 'ClientMain' : 'Splash'}
      >
        {!isAuthenticated ? (
          // Flux d'authentification (clients uniquement)
          <>
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
            />
            {/* Permettre l'accès à la recherche sans connexion */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
            />
            <Stack.Screen 
              name="Results" 
              component={ResultsScreen}
            />
            <Stack.Screen 
              name="Details" 
              component={DetailsScreen}
            />
          </>
        ) : (
          // Interface client uniquement
          <>
            <Stack.Screen 
              name="ClientMain" 
              component={ClientTabNavigator}
              options={{ headerShown: false }}
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
              name="TripHistory" 
              component={TripHistoryScreen}
              options={{
                title: 'Historique des voyages',
                presentation: 'card',
                animationTypeForReplace: 'push',
              }}
            />

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
          </>
        )}
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
})

export default AppNavigator
