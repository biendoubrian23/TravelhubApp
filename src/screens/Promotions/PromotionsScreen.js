import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { 
  PromotionCard, 
  FidelityCard, 
  SpecialOfferCard 
} from './components';
import {
  mainPromotions,
  fidelityPrograms,
  specialOffers,
  howItWorksSteps,
  getActivePromotions,
  getAvailableDiscounts,
} from './data/promotionsData';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.60; // Réduit encore plus de 65% à 60% pour éviter les débordements

const PromotionsScreen = () => {
  const [activePromotionIndex, setActivePromotionIndex] = useState(0);

  // Gestion des interactions avec les promotions
  const handlePromotionPress = (promotion) => {
    Alert.alert(
      promotion.title,
      `${promotion.description}\n\nConditions: ${promotion.conditions || 'Aucune condition spéciale'}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Réserver maintenant', onPress: () => console.log('Navigation vers réservation') }
      ]
    );
  };

  const handleFidelityPress = (program) => {
    Alert.alert(
      program.title,
      `${program.description}\n\nAvantages:\n${program.benefits?.join('\n') || 'Programme de fidélité exclusif'}`,
      [{ text: 'Compris', style: 'default' }]
    );
  };

  const handleSpecialOfferPress = (offer) => {
    Alert.alert(
      offer.title,
      `${offer.description}\n\nConditions: ${offer.conditions}`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'En profiter', onPress: () => console.log('Activation offre spéciale') }
      ]
    );
  };

  const renderMainPromotion = ({ item, index }) => (
    <PromotionCard
      promotion={item}
      onPress={() => handlePromotionPress(item)}
      width={cardWidth}
      style={{ marginHorizontal: 10 }}
    />
  );

  const renderFidelityCard = ({ item }) => (
    <FidelityCard
      program={item}
      onPress={() => handleFidelityPress(item)}
    />
  );

  const renderSpecialOffer = ({ item }) => (
    <SpecialOfferCard
      offer={item}
      onPress={() => handleSpecialOfferPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header - style similaire à Mes réservations */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Promotions</Text>
          <Text style={styles.headerSubtitle}>Économisez sur vos trajets</Text>
        </View>

        {/* Promotions principales - Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Offres du moment</Text>
          <FlatList
            data={mainPromotions}
            renderItem={renderMainPromotion}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={cardWidth + 30} // Augmenté de 20 à 30 pour correspondre au nouveau padding
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContainer}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + 30));
              setActivePromotionIndex(index);
            }}
          />
          
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {mainPromotions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { opacity: index === activePromotionIndex ? 1 : 0.3 }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Programme de fidélité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Fidélité & Récompenses</Text>
          <FlatList
            data={fidelityPrograms}
            renderItem={renderFidelityCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fidelityContainer}
          />
        </View>

        {/* Offres spéciales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Offres spéciales</Text>
          <FlatList
            data={specialOffers}
            renderItem={renderSpecialOffer}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialOffersContainer}
          />
        </View>

        {/* Comment ça marche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Comment ça marche ?</Text>
          <View style={styles.howItWorksContainer}>
            {howItWorksSteps.map((step) => (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Call to Action final */}
        <View style={styles.section}>
          <View style={styles.finalCtaContainer}>
            <Text style={styles.finalCtaTitle}>Prêt à économiser ?</Text>
            <Text style={styles.finalCtaSubtitle}>
              Commencez votre premier voyage avec TravelHub
            </Text>
            <TouchableOpacity 
              style={styles.finalCtaButton}
              onPress={() => console.log('Navigation vers recherche')}
            >
              <Text style={styles.finalCtaButtonText}>Rechercher un trajet</Text>
              <Ionicons name="search" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 30, // Calcul automatique pour Android + 20px extra
    paddingBottom: 15,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 10, // Réduit la marge
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    paddingHorizontal: 20, // Augmenté de 10 à 20 pour plus d'espace
    paddingRight: 40, // Ajoute plus d'espace à droite pour éviter la coupure
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  fidelityContainer: {
    paddingHorizontal: 10,
  },
  specialOffersContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5, // Ajoute un padding vertical
  },
  howItWorksContainer: {
    paddingHorizontal: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  finalCtaContainer: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  finalCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  finalCtaSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  finalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  finalCtaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default PromotionsScreen;
