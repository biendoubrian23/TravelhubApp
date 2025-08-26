import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');

const SpecialOfferCard = ({ offer, onPress, style }) => {
  // Utilise des dégradés bleu-violet qui fusionnent parfaitement
  const blueVioletGradients = [COLORS.primary, '#5B21B6', '#7C3AED']; // Bleu vers violet profond
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={blueVioletGradients}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={offer.icon} size={24} color="white" />
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.description}>{offer.description}</Text>
        
        {offer.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{offer.badge}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    width: screenWidth * 0.28, // Réduit encore un peu
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 10, // Ajoute une marge en bas pour éviter les coupures
  },
  gradient: {
    padding: 16,
    minHeight: 120, // Assure une hauteur suffisante
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16, // Améliore l'espacement
  },
  description: {
    fontSize: 10,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12, // Améliore l'espacement
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default SpecialOfferCard;
