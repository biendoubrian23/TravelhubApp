import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, useColorScheme } from 'react-native'
import { PaperProvider, MD3LightTheme } from 'react-native-paper'
import Toast from 'react-native-toast-message'

// Navigation
import AppNavigator from './src/navigation/AppNavigator'

// Constants
import { COLORS } from './src/constants'

// Services
import avatarService from './src/services/avatarServiceSimple'

// Thème personnalisé en mode clair uniquement
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    surface: COLORS.surface || '#FFFFFF',
    surfaceVariant: '#F5F5F5',
  },
}

export default function App() {
  // Initialiser les services au démarrage
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialiser le bucket avatars
        await avatarService.initializeBucket();
        console.log('✅ Services d\'avatar initialisés');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <PaperProvider theme={lightTheme}>
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor={COLORS.background} />
        <AppNavigator />
        <Toast />
      </View>
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
