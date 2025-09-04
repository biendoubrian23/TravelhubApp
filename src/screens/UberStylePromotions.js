import React from 'react';
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ModernCarousel from '../components/ModernCarousel';
import styles from './styles';

// Données simulées pour les carrousels
const featuredOffers = [
  {
    id: 1,
    title: 'Premier trajet',
    subtitle: 'Découvrez TravelHub',
    description: 'Votre première réservation bénéficie d\'une réduction exceptionnelle',
    badge: 'NOUVEAU CLIENT',
    discount: '50%',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
    color: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    title: 'Week-end découverte',
    subtitle: 'Explorez le Cameroun',
    description: 'Réductions spéciales sur tous les trajets du week-end',
    badge: 'WEEK-END',
    discount: '30%',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    color: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    title: 'Fidélité récompensée',
    subtitle: 'Programme VIP',
    description: 'Cumulez des points et obtenez des trajets gratuits',
    badge: 'VIP',
    discount: '100%',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    color: ['#4facfe', '#00f2fe'],
  },
];

const popularDestinations = [
  {
    id: 1,
    city: 'Douala',
    region: 'Littoral',
    price: '15,000',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    discount: '20%',
  },
  {
    id: 2,
    city: 'Yaoundé',
    region: 'Centre',
    price: '12,000',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    discount: '15%',
  },
  {
    id: 3,
    city: 'Bafoussam',
    region: 'Ouest',
    price: '18,000',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    discount: '25%',
  },
];

const busCompanies = [
  {
    id: 1,
    name: 'Touristique Express',
    rating: 4.8,
    vehicles: 45,
    logo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100',
    speciality: 'VIP & Couchettes',
  },
  {
    id: 2,
    name: 'Garanti Express',
    rating: 4.7,
    vehicles: 38,
    logo: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=100',
    speciality: 'Confort & Économique',
  },
  {
    id: 3,
    name: 'Central Voyages',
    rating: 4.6,
    vehicles: 32,
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100',
    speciality: 'Express & Standard',
  },
];

const services = [
  {
    id: 1,
    title: 'Assurance voyage',
    subtitle: 'Protection complète',
    icon: 'shield-checkmark',
    color: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    title: 'Support 24/7',
    subtitle: 'Assistance continue',
    icon: 'headset',
    color: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    title: 'Modification gratuite',
    subtitle: 'Flexibilité totale',
    icon: 'refresh',
    color: ['#4facfe', '#00f2fe'],
  },
];

const testimonials = [
  {
    id: 1,
    name: 'Marie Kamga',
    city: 'Douala',
    rating: 5,
    comment: 'Service exceptionnel ! Réservation facile et voyage confortable.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
  },
  {
    id: 2,
    name: 'Jean Foka',
    city: 'Yaoundé',
    rating: 5,
    comment: 'TravelHub a révolutionné mes voyages. Je recommande vivement !',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  },
  {
    id: 3,
    name: 'Grace Mballa',
    city: 'Bafoussam',
    rating: 4,
    comment: 'Interface intuitive et prix compétitifs. Parfait pour voyager.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  },
];

const seasonalOffers = [
  {
    id: 1,
    title: 'Promotion Septembre',
    subtitle: 'Rentrée scolaire',
    discount: '30%',
    validUntil: '30 Sept 2025',
    color: ['#ff9a9e', '#fecfef'],
  },
  {
    id: 2,
    title: 'Offre Étudiant',
    subtitle: 'Spécial campus',
    discount: '40%',
    validUntil: 'Permanent',
    color: ['#a8edea', '#fed6e3'],
  },
  {
    id: 3,
    title: 'Business Class',
    subtitle: 'Confort premium',
    discount: '25%',
    validUntil: '15 Oct 2025',
    color: ['#d299c2', '#fef9d7'],
  },
];

const UberStylePromotions = () => {
  const renderFeaturedCard = (item) => (
    <View style={styles.featuredCard}>
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.featuredOverlay}
      >
        <View style={styles.featuredTop}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>{item.badge}</Text>
          </View>
          <View style={styles.featuredDiscountBadge}>
            <Text style={styles.featuredDiscountText}>-{item.discount}</Text>
          </View>
        </View>
        <View style={styles.featuredBottom}>
          <Text style={styles.featuredTitle}>{item.title}</Text>
          <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
          <Text style={styles.featuredDescription}>{item.description}</Text>
          <TouchableOpacity style={styles.featuredCtaButton}>
            <Text style={styles.featuredCtaText}>Découvrir</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderDestinationCard = (item) => (
    <View style={styles.destinationCard}>
      <Image source={{ uri: item.image }} style={styles.destinationImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.destinationOverlay}
      >
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}</Text>
          </View>
        )}
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationCity}>{item.city}</Text>
          <Text style={styles.destinationRegion}>{item.region}</Text>
          <Text style={styles.destinationPrice}>à partir de {item.price} FCFA</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderCompanyCard = (item) => (
    <View style={styles.companyCard}>
      <Image source={{ uri: item.logo }} style={styles.companyLogo} />
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{item.name}</Text>
        <Text style={styles.companySpeciality}>{item.speciality}</Text>
        <View style={styles.companyStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.statText}>{item.rating}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bus" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.vehicles} véhicules</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderServiceCard = (item) => (
    <LinearGradient
      colors={item.color}
      style={styles.serviceCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={item.icon} size={24} color="#fff" />
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.serviceSubtitle}>{item.subtitle}</Text>
    </LinearGradient>
  );

  const renderTestimonialCard = (item) => (
    <View style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.testimonialInfo}>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <Text style={styles.testimonialCity}>{item.city}</Text>
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={12}
                color={i < item.rating ? "#FFB800" : "#E5E7EB"}
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.testimonialComment}>{item.comment}</Text>
    </View>
  );

  const renderSeasonalCard = (item) => (
    <LinearGradient
      colors={item.color}
      style={styles.seasonalCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.seasonalDiscount}>{item.discount}</Text>
      <Text style={styles.seasonalTitle}>{item.title}</Text>
      <Text style={styles.seasonalSubtitle}>{item.subtitle}</Text>
      <Text style={styles.seasonalValid}>Valide jusqu'au {item.validUntil}</Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Promotions</Text>
          <Text style={styles.headerSubtitle}>Économisez sur vos trajets</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Offres vedettes - Carrousel principal */}
        <ModernCarousel
          title="Offres vedettes"
          data={featuredOffers}
          renderItem={renderFeaturedCard}
          autoScroll={true}
          containerStyle={styles.sectionContainer}
        />

        {/* Destinations populaires - Carrousel */}
        <ModernCarousel
          title="Destinations populaires"
          data={popularDestinations}
          renderItem={renderDestinationCard}
          autoScroll={false}
          containerStyle={styles.sectionContainer}
        />

        {/* Section combinée - Services + Compagnies en grille */}
        <View style={styles.combinedSection}>
          <Text style={styles.sectionTitle}>Nos services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <View key={index} style={styles.serviceGridItem}>
                {renderServiceCard(service)}
              </View>
            ))}
          </View>
        </View>

        {/* Compagnies partenaires - Layout en grille 2x2 */}
        <View style={styles.companiesSection}>
          <Text style={styles.sectionTitle}>Compagnies partenaires</Text>
          <View style={styles.companiesGrid}>
            {busCompanies.slice(0, 4).map((company, index) => (
              <View key={index} style={styles.companyGridItem}>
                {renderCompanyCard(company)}
              </View>
            ))}
          </View>
        </View>

        {/* Témoignages - Un seul carrousel plus compact */}
        <ModernCarousel
          title="Avis clients"
          data={testimonials}
          renderItem={renderTestimonialCard}
          autoScroll={true}
          showDots={false}
          containerStyle={styles.sectionContainer}
        />

        {/* Offres spéciales - Layout horizontal simple */}
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>Offres limitées</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersHorizontal}
          >
            {seasonalOffers.map((offer, index) => (
              <View key={index} style={styles.offerItem}>
                {renderSeasonalCard(offer)}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UberStylePromotions;
