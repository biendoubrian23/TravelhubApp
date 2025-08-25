import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 60; // Réduire la largeur pour montrer le prochain élément
const ITEM_SPACING = 15; // Espacement constant entre les éléments
const ITEM_HEIGHT = 130;

const ads = [
  {
    id: '1',
    title: 'Promo VIP',
    description: '-20% sur les trajets VIP',
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=800&auto=format&fit=crop',
    color: '#FF6B6B',
    expiryDate: '31 août 2025'
  },
  {
    id: '2',
    title: 'Week-end',
    description: 'Tarifs spéciaux pour Douala-Yaoundé',
    image: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?q=80&w=800&auto=format&fit=crop',
    color: '#4ECDC4',
    expiryDate: '30 sept 2025'
  },
  {
    id: '3',
    title: 'Réservez à l\'avance',
    description: '-15% sur les réservations 7 jours à l\'avance',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
    color: '#FFD166',
    expiryDate: '15 oct 2025'
  },
  {
    id: '4',
    title: 'Étudiants',
    description: 'Remise spéciale avec carte étudiante',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f8e1c1?q=80&w=800&auto=format&fit=crop',
    color: '#6A0572',
    expiryDate: 'Permanent'
  },
  {
    id: '5',
    title: 'Pack Famille',
    description: 'Réduction pour les groupes de 4+',
    image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=800&auto=format&fit=crop',
    color: '#1A535C',
    expiryDate: '31 déc 2025'
  }
];

const AdCarousel = ({ onAdPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll effect
  useEffect(() => {
    let interval;
    
    const startAutoScroll = () => {
      interval = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (activeIndex + 1) % ads.length;
          // Calculer la position exacte pour le scroll
          const offset = nextIndex * (ITEM_WIDTH + ITEM_SPACING);
          
          // Utiliser scrollToOffset pour un positionnement précis
          flatListRef.current.scrollToOffset({
            offset,
            animated: true,
          });
          // Ne pas mettre à jour activeIndex ici, cela sera fait par handleViewableItemsChanged
        }
      }, 5000); // Change ad every 5 seconds
    };
    
    startAutoScroll();
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeIndex]);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={[styles.adItem, { backgroundColor: item.color + '20' }]} 
        activeOpacity={0.9}
        onPress={() => onAdPress && onAdPress(item)}
      >
        {/* Badge PROMO placé en premier pour garantir qu'il est rendu en premier */}
        <View style={[styles.adBadge, { backgroundColor: item.color }]}>
          <Text style={styles.adBadgeText}>PROMO</Text>
        </View>
        
        <View style={styles.adContent}>
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>{item.title}</Text>
            <Text style={styles.adDescription}>{item.description}</Text>
            <View style={styles.adExpiryContainer}>
              <Ionicons name="time-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.adExpiry}>Valable jusqu'au: {item.expiryDate}</Text>
            </View>
          </View>
          <View style={[styles.adImageContainer, { backgroundColor: item.color + '40' }]}>
            <Image source={{ uri: item.image }} style={styles.adImage} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Offres spéciales</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={ads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING} // Utilisation de la variable constante pour cohérence
        decelerationRate={0.8} // Valeur ajustée pour un défilement plus prévisible
        contentContainerStyle={styles.flatListContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 70, // Augmenté pour un meilleur suivi de l'élément actif
        }}
        initialNumToRender={3} // Pour s'assurer que suffisamment d'éléments sont rendus au début
      />
      
      <View style={styles.paginationContainer}>
        {ads.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.paginationDot, 
              index === activeIndex && styles.paginationDotActive
            ]}
            onPress={() => {
              // Utiliser scrollToOffset pour un positionnement cohérent avec l'auto-scroll
              flatListRef.current.scrollToOffset({
                offset: index * (ITEM_WIDTH + ITEM_SPACING),
                animated: true,
              });
              // setActiveIndex est géré par handleViewableItemsChanged
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    paddingBottom: SPACING.md,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg, // Augmenté pour s'aligner avec le padding du carrousel
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  flatListContent: {
    paddingHorizontal: (width - ITEM_WIDTH) / 2, // Centrage parfait des éléments
  },
  adItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: ITEM_SPACING, // Utilisation de la variable constante pour cohérence
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    position: 'relative', // Nécessaire pour le positionnement du badge
    paddingTop: SPACING.md + 10, // Augmenter le padding supérieur pour laisser de la place au badge
  },
  adContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  adTextContainer: {
    flex: 2,
    justifyContent: 'center',
    paddingRight: SPACING.sm,
    paddingTop: 16, // Ajout d'un padding en haut pour éviter que le texte ne chevauche le badge
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  adExpiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adExpiry: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  adImageContainer: {
    flex: 1,
    height: '90%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderTopLeftRadius: 0, // Coin supérieur gauche plat
    borderBottomLeftRadius: 0, // Coin inférieur gauche plat
    borderTopRightRadius: 0, // Coin supérieur droit plat
    zIndex: 10, // S'assurer que le badge est toujours au-dessus
  },
  adBadgeText: {
    color: COLORS.text.white,
    fontSize: 10,
    fontWeight: '700',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
  },
});

export default AdCarousel;
