import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 180;
const CARD_SPACING = 20;

const ElegantPromotionCarousel = ({ promotions = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Données de démonstration avec des dégradés élégants
  const demoPromotions = [
    {
      id: '1',
      title: 'Premier trajet',
      subtitle: 'NOUVEAU CLIENT',
      discount: '-50%',
      description: 'Découvrez TravelHub\nVotre première réservation bénéficie d\'une réduction de 50%',
      price: 'Jusqu\'à 3,290 FCFA',
      action: 'Première réservation',
      gradient: ['#667eea', '#764ba2'],
      iconName: 'rocket',
      accentColor: '#FFD700',
    },
    {
      id: '2',
      title: 'Réservation multiple',
      subtitle: 'PLANIFICATION',
      discount: '-30%',
      description: 'Plus vous réservez, plus vous économisez',
      price: 'Jusqu\'à 1,974 FCFA',
      action: 'Réserver en avance',
      gradient: ['#f093fb', '#f5576c'],
      iconName: 'calendar',
      accentColor: '#FF69B4',
    },
    {
      id: '3',
      title: 'Voyage en groupe',
      subtitle: 'OFFRE SPÉCIALE',
      discount: '-25%',
      description: 'Économisez en voyageant ensemble',
      price: 'À partir de 2,200 FCFA',
      action: 'Réserver pour 3+',
      gradient: ['#4facfe', '#00f2fe'],
      iconName: 'people',
      accentColor: '#00CED1',
    },
    {
      id: '4',
      title: 'Week-end Express',
      subtitle: 'ESCAPADE',
      discount: '-40%',
      description: 'Parfait pour vos sorties de week-end',
      price: 'Dès 1,800 FCFA',
      action: 'Réserver maintenant',
      gradient: ['#fa709a', '#fee140'],
      iconName: 'car',
      accentColor: '#FFB347',
    }
  ];

  const data = promotions.length > 0 ? promotions : demoPromotions;

  // Auto-scroll
  useEffect(() => {
    if (data.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % data.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [data.length]);

  const onScrollEnd = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_SPACING));
    setActiveIndex(index);
  };

  const renderPromotionCard = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          promotionStyles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={promotionStyles.card}
          activeOpacity={0.9}
          onPress={() => console.log('Promo pressed:', item.title)}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={promotionStyles.gradientBackground}
          >
            {/* Header avec badge et icône */}
            <View style={promotionStyles.header}>
              <View style={[promotionStyles.badge, { backgroundColor: item.accentColor }]}>
                <Text style={promotionStyles.badgeText}>{item.subtitle}</Text>
              </View>
              <View style={[promotionStyles.iconContainer, { backgroundColor: item.accentColor + '20' }]}>
                <Ionicons name={item.iconName} size={24} color={item.accentColor} />
              </View>
            </View>

            {/* Contenu principal */}
            <View style={promotionStyles.content}>
              <View style={promotionStyles.titleSection}>
                <Text style={promotionStyles.title}>{item.title}</Text>
                <Text style={promotionStyles.discount}>{item.discount}</Text>
              </View>
              
              <Text style={promotionStyles.description}>{item.description}</Text>
              
              <View style={promotionStyles.footer}>
                <Text style={promotionStyles.price}>{item.price}</Text>
                <View style={promotionStyles.actionButton}>
                  <Text style={promotionStyles.actionText}>{item.action}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </View>
              </View>
            </View>

            {/* Effet de brillance */}
            <View style={promotionStyles.shine} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDots = () => {
    return (
      <View style={promotionStyles.dotsContainer}>
        {data.map((_, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ];

          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                promotionStyles.dot,
                {
                  transform: [{ scale: dotScale }],
                  opacity: dotOpacity,
                  backgroundColor: index === activeIndex ? '#fff' : '#ffffff60',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (data.length === 0) return null;

  return (
    <View style={promotionStyles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderPromotionCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={promotionStyles.listContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
      />
      {renderDots()}
    </View>
  );
};

const promotionStyles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  listContainer: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: CARD_SPACING / 2,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    letterSpacing: -0.5,
  },
  discount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
    borderRadius: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ElegantPromotionCarousel;
