import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');

const FidelityCard = ({ program, onPress, style }) => {
  // Utilise la couleur principale bleu-violet de l'app
  const blueVioletColor = '#6366F1'; // Bleu-violet harmonieux
  
  const renderProgress = () => {
    if (!program.progress || !program.maxProgress) return null;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(program.progress / program.maxProgress) * 100}%`,
                backgroundColor: blueVioletColor // Utilise la couleur bleu-violet
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {program.progress}/{program.maxProgress}
        </Text>
      </View>
    );
  };

  const renderBadge = () => {
    if (program.reward) {
      return (
        <View style={[styles.rewardBadge, { backgroundColor: blueVioletColor }]}>
          <Text style={styles.rewardText}>{program.reward}</Text>
        </View>
      );
    }
    
    if (program.discount) {
      return (
        <View style={[styles.rewardBadge, { backgroundColor: blueVioletColor }]}>
          <Text style={styles.rewardText}>{program.discount}</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: blueVioletColor + '20' }]}>
        <Ionicons name={program.icon} size={24} color={blueVioletColor} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{program.title}</Text>
        <Text style={styles.description}>{program.description}</Text>
        
        {renderProgress()}
        {renderBadge()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12, // Réduit de 16 à 12
    marginHorizontal: 8, // Réduit de 10 à 8
    width: screenWidth * 0.55, // Réduit de 0.7 à 0.55 (environ 21% de réduction)
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40, // Réduit de 50 à 40
    height: 40, // Réduit de 50 à 40
    borderRadius: 20, // Ajusté pour la nouvelle taille
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Réduit de 15 à 12
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  rewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  rewardText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FidelityCard;
