import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ElegantPromotionCarousel from '../../components/ElegantPromotionCarousel';

const { width, height } = Dimensions.get('window');

const ElegantPromotionsScreen = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Données pour les programmes de fidélité
  const fidelityPrograms = [
    {
      id: '1',
      title: 'Programme Fidélité',
      subtitle: '10 trajets = 1 offert',
      progress: 7,
      total: 10,
      gradient: ['#667eea', '#764ba2'],
      accentColor: '#FFD700',
      icon: 'trophy',
    },
    {
      id: '2',
      title: 'Parrainage',
      subtitle: 'Vous et votre filleul',
      reward: '+10%',
      gradient: ['#f093fb', '#f5576c'],
      accentColor: '#FF69B4',
      icon: 'people',
    },
  ];

  // Données pour les offres spéciales
  const specialOffers = [
    {
      id: '1',
      title: 'Offre Anniversaire',
      description: 'Réduction spéciale sur votre trajet',
      code: 'PERSO',
      gradient: ['#667eea', '#764ba2'],
      icon: 'gift',
    },
    {
      id: '2',
      title: 'Weekend Express',
      description: 'Offres week-end',
      code: 'WE',
      gradient: ['#4facfe', '#00f2fe'],
      icon: 'car',
    },
    {
      id: '3',
      title: 'Flash Sale',
      description: 'Promotions éclair',
      code: 'FLASH',
      gradient: ['#fa709a', '#fee140'],
      icon: 'flash',
    },
  ];

  const tabs = ['Offres du moment', 'Fidélité', 'Offres spéciales'];

  // Animation pour le header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const renderFidelityCard = (item) => (
    <TouchableOpacity key={item.id} style={promotionsStyles.fidelityCard} activeOpacity={0.9}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={promotionsStyles.fidelityGradient}
      >
        <View style={promotionsStyles.fidelityHeader}>
          <View style={[promotionsStyles.fidelityIcon, { backgroundColor: item.accentColor + '20' }]}>
            <Ionicons name={item.icon} size={24} color={item.accentColor} />
          </View>
          {item.reward && (
            <View style={[promotionsStyles.rewardBadge, { backgroundColor: item.accentColor }]}>
              <Text style={promotionsStyles.rewardText}>{item.reward}</Text>
            </View>
          )}
        </View>
        
        <Text style={promotionsStyles.fidelityTitle}>{item.title}</Text>
        <Text style={promotionsStyles.fidelitySubtitle}>{item.subtitle}</Text>
        
        {item.progress !== undefined && (
          <View style={promotionsStyles.progressContainer}>
            <View style={promotionsStyles.progressBar}>
              <View 
                style={[
                  promotionsStyles.progressFill,
                  { 
                    width: `${(item.progress / item.total) * 100}%`,
                    backgroundColor: item.accentColor,
                  }
                ]} 
              />
            </View>
            <Text style={promotionsStyles.progressText}>{item.progress}/{item.total}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSpecialOfferCard = (item) => (
    <TouchableOpacity key={item.id} style={promotionsStyles.specialOfferCard} activeOpacity={0.9}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={promotionsStyles.specialOfferGradient}
      >
        <View style={promotionsStyles.specialOfferIcon}>
          <Ionicons name={item.icon} size={28} color="#fff" />
        </View>
        <View style={promotionsStyles.specialOfferContent}>
          <Text style={promotionsStyles.specialOfferTitle}>{item.title}</Text>
          <Text style={promotionsStyles.specialOfferDescription}>{item.description}</Text>
          <View style={promotionsStyles.codeContainer}>
            <Text style={promotionsStyles.codeText}>{item.code}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <ElegantPromotionCarousel />;
      case 1:
        return (
          <View style={promotionsStyles.tabContent}>
            <Text style={promotionsStyles.sectionTitle}>🏆 Fidélité & Récompenses</Text>
            <View style={promotionsStyles.fidelityContainer}>
              {fidelityPrograms.map(renderFidelityCard)}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={promotionsStyles.tabContent}>
            <Text style={promotionsStyles.sectionTitle}>🎁 Offres spéciales</Text>
            <View style={promotionsStyles.specialOffersGrid}>
              {specialOffers.map(renderSpecialOfferCard)}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={promotionsStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header avec dégradé */}
      <Animated.View
        style={[
          promotionsStyles.header,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={promotionsStyles.headerGradient}
        >
          <Text style={promotionsStyles.headerTitle}>Promotions</Text>
          <Text style={promotionsStyles.headerSubtitle}>Économisez sur vos trajets</Text>
        </LinearGradient>
      </Animated.View>

      {/* Tabs */}
      <View style={promotionsStyles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={promotionsStyles.tabs}
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                promotionsStyles.tab,
                selectedTab === index && promotionsStyles.activeTab,
              ]}
              onPress={() => setSelectedTab(index)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  promotionsStyles.tabText,
                  selectedTab === index && promotionsStyles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenu */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={promotionsStyles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderTabContent()}
        
        {/* Espace en bas pour la navigation */}
        <View style={promotionsStyles.bottomSpace} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const promotionsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  tabs: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  fidelityContainer: {
    gap: 16,
  },
  fidelityCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  fidelityGradient: {
    padding: 20,
  },
  fidelityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fidelityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  fidelityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  fidelitySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  specialOffersGrid: {
    gap: 16,
  },
  specialOfferCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  specialOfferGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  specialOfferIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialOfferContent: {
    flex: 1,
  },
  specialOfferTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  specialOfferDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  codeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  bottomSpace: {
    height: 100,
  },
});

export default ElegantPromotionsScreen;
