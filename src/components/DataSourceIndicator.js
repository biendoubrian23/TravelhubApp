import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, BORDER_RADIUS } from '../constants'
import { testSupabaseConnection } from '../tests/quick-test'

const DataSourceIndicator = ({ visible = true, onPress }) => {
  const [isConnected, setIsConnected] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (!visible) return
    
    setIsLoading(true)
    try {
      const connected = await testSupabaseConnection()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible || isLoading) return null

  const getIndicatorStyle = () => {
    if (isConnected) {
      return {
        backgroundColor: COLORS.success + '15',
        borderColor: COLORS.success,
      }
    }
    return {
      backgroundColor: COLORS.warning + '15',
      borderColor: COLORS.warning,
    }
  }

  const getIconName = () => {
    if (isConnected) return 'cloud-done'
    return 'cloud-offline'
  }

  const getIconColor = () => {
    if (isConnected) return COLORS.success
    return COLORS.warning
  }

  const getMessage = () => {
    if (isConnected) {
      return 'Base de données connectée'
    }
    return 'Base de données déconnectée'
  }

  const getDescription = () => {
    if (isConnected) {
      return 'Les trajets sont récupérés depuis la base de données'
    }
    return 'Impossible de récupérer les trajets - Vérifiez la connexion'
  }

  return (
    <TouchableOpacity 
      style={[styles.container, getIndicatorStyle()]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={getIconColor()} 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getIconColor() }]}>
            {getMessage()}
          </Text>
          <Text style={styles.description}>
            {getDescription()}
          </Text>
        </View>
        {onPress && (
          <Ionicons 
            name="information-circle-outline" 
            size={16} 
            color={COLORS.text.secondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    margin: SPACING.sm,
    overflow: 'hidden',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  
  textContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  description: {
    fontSize: 10,
    color: COLORS.text.secondary,
    lineHeight: 14,
  },
})

export default DataSourceIndicator
