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

const PromotionCard = ({ 
  promotion, 
  onPress, 
  style,
  width = screenWidth * 0.65 // Réduit la largeur par défaut
}) => {
  // Utilise des dégradés bleu-violet qui fusionnent parfaitement
  const blueVioletGradients = [COLORS.primary, '#6366F1', '#8B5CF6']; // Bleu vers violet
  
  return (
    <TouchableOpacity 
      style={[styles.container, { width }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={blueVioletGradients}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{promotion.badge}</Text>
          </View>
          <Ionicons name={promotion.icon} size={32} color="white" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{promotion.title}</Text>
          <Text style={styles.subtitle}>{promotion.subtitle}</Text>
          <Text style={styles.description}>{promotion.description}</Text>
          
          {promotion.savings && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savingsText}>{promotion.savings}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
          <Text style={styles.ctaButtonText}>
            {promotion.ctaText || 'Profiter maintenant'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxWidth: screenWidth * 0.62, // Limite la largeur maximale
  },
  gradient: {
    padding: 16, // Réduit de 20 à 16
    minHeight: 160, // Réduit de 220 à 160 (environ 27% de réduction)
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginVertical: 15,
  },
  title: {
    fontSize: 20, // Réduit de 24 à 20
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4, // Réduit de 5 à 4
  },
  subtitle: {
    fontSize: 14, // Réduit de 16 à 14
    color: 'white',
    opacity: 0.9,
    marginBottom: 8, // Réduit de 10 à 8
  },
  description: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    lineHeight: 20,
  },
  savingsContainer: {
    marginTop: 10,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
});

export default PromotionCard;
