import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import Toast from 'react-native-toast-message'

// Navigation
import AppNavigator from './src/navigation/AppNavigator'

// Constants
import { COLORS } from './src/constants'

export default function App() {
  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
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
