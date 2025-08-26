import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { balanceService } from '../services/balanceService';
import { useAuthStore } from '../store';

const BalanceCard = forwardRef(({ onPress, style, clickable = false }, ref) => {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBalance();
  }, [user]);

  const loadBalance = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await balanceService.getUserBalance(user.id);
      if (result.error) {
        setError(result.error);
        setBalance(0);
      } else {
        setBalance(result.balance || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
      setError(error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Exposer la méthode de rafraîchissement via ref
  useImperativeHandle(ref, () => ({
    refresh: loadBalance
  }));

  const formatBalance = (amount) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  };

  // Si clickable est false, utiliser View au lieu de TouchableOpacity
  const Container = clickable ? TouchableOpacity : View;
  const containerProps = clickable ? {
    onPress: onPress,
    activeOpacity: 0.7
  } : {};

  return (
    <Container 
      style={[styles.container, style]} 
      {...containerProps}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="wallet" size={20} color={COLORS.primary} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.label}>Mon solde</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>Erreur</Text>
        ) : (
          <Text style={styles.balance}>{formatBalance(balance)}</Text>
        )}
      </View>
      
      {/* Afficher la flèche seulement si cliquable */}
      {clickable && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
      )}
    </Container>
  );
});

// Composant simplifié pour afficher juste le solde (pour la barre de profil)
export const BalanceDisplay = ({ style, textStyle }) => {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, [user]);

  const loadBalance = async () => {
    if (!user?.id) return;
    
    try {
      const result = await balanceService.getUserBalance(user.id);
      setBalance(result.balance || 0);
    } catch (error) {
      console.error('Erreur solde:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <View style={[styles.displayContainer, style]}>
        <ActivityIndicator size="small" color={COLORS.text.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.displayContainer, style]}>
      <Ionicons name="wallet" size={16} color={COLORS.text.secondary} />
      <Text style={[styles.displayText, textStyle]}>
        Solde: {formatBalance(balance)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.xs,
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  content: {
    flex: 1,
  },
  
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '500',
  },
  
  // Styles pour BalanceDisplay
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  displayText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});

export default BalanceCard;
