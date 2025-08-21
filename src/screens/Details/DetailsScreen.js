import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components'
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants'
import { useBookingStore } from '../../store'
import { formatTime, formatPrice, calculateDuration } from '../../utils/helpers'

const DetailsScreen = ({ navigation, route }) => {
  // Utiliser les données passées en paramètres en priorité, puis le store
  const { trip: passedTrip, searchParams, allTrips } = route.params || {}
  const { currentTrip } = useBookingStore()
  
  // Utiliser le trajet passé en paramètre ou celui du store
  const trip = passedTrip || currentTrip
  
  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trajet introuvable</Text>
          <Button
            title="Retour"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    )
  }

  const {
    ville_depart,
    ville_arrivee,
    heure_dep,
    heure_arr,
    prix,
    is_vip,
    agencies,
    trip_services
  } = trip

  const duration = calculateDuration(heure_dep, heure_arr)
  const services = trip_services?.[0] || {}

  const handleSelectTrip = () => {
    navigation.navigate('SeatSelection', { 
      trip: trip,
      searchParams: searchParams // Passer les paramètres de recherche
    })
  }

  const handleViewOtherOptions = () => {
    // Retourner aux résultats avec les mêmes paramètres de recherche
    navigation.goBack()
  }

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      <Text style={styles.sectionTitle}>Détail du trajet</Text>
      
      <View style={styles.timeline}>
        {/* Départ */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineIconContainer}>
            <View style={styles.timelineIcon} />
            <View style={styles.timelineLine} />
          </View>
          
          <View style={styles.timelineContent}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTime}>{formatTime(heure_dep)}</Text>
              <Text style={styles.timelineLabel}>Départ</Text>
            </View>
            <Text style={styles.timelineLocation}>{ville_depart}</Text>
            <Text style={styles.timelineDetails}>
              Accueil embarquement jusqu'à 2 min avant le départ
            </Text>
          </View>
        </View>

        {/* Trajet */}
        <View style={styles.journeyInfo}>
          <View style={styles.journeyLine} />
          <View style={styles.journeyDetails}>
            <View style={styles.busInfo}>
              <Text style={styles.busNumber}>
                {is_vip ? 'VIP' : 'CLASSIQUE'} n° {Math.floor(Math.random() * 9000) + 1000}
              </Text>
              <View style={styles.servicesRow}>
                {services.wifi && (
                  <View style={styles.serviceIcon}>
                    <Ionicons name="wifi" size={16} color={COLORS.text.secondary} />
                  </View>
                )}
                {services.repas && (
                  <View style={styles.serviceIcon}>
                    <Ionicons name="restaurant" size={16} color={COLORS.text.secondary} />
                  </View>
                )}
                {services.clim && (
                  <View style={styles.serviceIcon}>
                    <Ionicons name="snow" size={16} color={COLORS.text.secondary} />
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.duration}>{duration}</Text>
          </View>
        </View>

        {/* Arrivée */}
        <View style={styles.timelineItem}>
          <View style={styles.timelineIconContainer}>
            <View style={[styles.timelineIcon, styles.arrivalIcon]} />
          </View>
          
          <View style={styles.timelineContent}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTime}>{formatTime(heure_arr)}</Text>
              <Text style={styles.timelineLabel}>Arrivée</Text>
            </View>
            <Text style={styles.timelineLocation}>{ville_arrivee}</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const renderServices = () => (
    <View style={styles.servicesContainer}>
      <Text style={styles.sectionTitle}>Services à bord</Text>
      
      <View style={styles.servicesGrid}>
        {[
          { key: 'wifi', icon: 'wifi', label: 'WiFi gratuit', available: services.wifi },
          { key: 'clim', icon: 'snow', label: 'Climatisation', available: services.clim },
          { key: 'repas', icon: 'restaurant', label: 'Restauration', available: services.repas },
          { key: 'usb', icon: 'phone-portrait', label: 'Prise USB', available: true },
          { key: 'baggage', icon: 'bag', label: 'Bagages inclus', available: true },
          { key: 'comfort', icon: 'car-sport', label: 'Sièges confort', available: is_vip }
        ].map((service) => (
          <View key={service.key} style={styles.serviceItem}>
            <View style={[
              styles.serviceIconContainer,
              !service.available && styles.serviceUnavailable
            ]}>
              <Ionicons
                name={service.icon}
                size={20}
                color={service.available ? COLORS.primary : COLORS.text.light}
              />
            </View>
            <Text style={[
              styles.serviceLabel,
              !service.available && styles.serviceLabelUnavailable
            ]}>
              {service.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )

  const renderPricing = () => (
    <View style={styles.pricingContainer}>
      <Text style={styles.sectionTitle}>Tarification</Text>
      
      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix par passager</Text>
          <Text style={styles.priceValue}>{formatPrice(prix)}</Text>
        </View>
        
        {is_vip && (
          <View style={styles.vipBenefits}>
            <Text style={styles.vipTitle}>✨ Avantages VIP inclus</Text>
            <Text style={styles.vipBenefit}>• Repas et boisson offerts</Text>
            <Text style={styles.vipBenefit}>• Sièges premium inclinables</Text>
            <Text style={styles.vipBenefit}>• WiFi haut débit</Text>
            <Text style={styles.vipBenefit}>• Espace jambes étendu</Text>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {ville_depart} → {ville_arrivee}
            </Text>
            <Text style={styles.headerSubtitle}>
              {agencies?.nom}
            </Text>
          </View>

          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {renderTimeline()}
          {renderServices()}
          {renderPricing()}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.priceFooter}>
          <Text style={styles.footerPrice}>{formatPrice(prix)}</Text>
          <Text style={styles.footerPriceLabel}>par passager</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {/* Bouton pour voir d'autres options si disponible */}
          {allTrips && allTrips.length > 1 && (
            <Button
              title="Voir autres options"
              onPress={handleViewOtherOptions}
              variant="outline"
              style={styles.secondaryButton}
            />
          )}
          
          <Button
            title="Choisir ce trajet"
            onPress={handleSelectTrip}
            style={styles.selectButton}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  scrollView: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  favoriteButton: {
    padding: SPACING.xs,
  },

  content: {
    padding: SPACING.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  // Timeline styles
  timelineContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  timeline: {
    paddingLeft: SPACING.sm,
  },

  timelineItem: {
    flexDirection: 'row',
    paddingBottom: SPACING.md,
  },

  timelineIconContainer: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  timelineIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  arrivalIcon: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
  },

  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  timelineContent: {
    flex: 1,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  timelineTime: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },

  timelineLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },

  timelineLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  timelineDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  journeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    marginBottom: SPACING.md,
  },

  journeyLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },

  journeyDetails: {
    flex: 1,
  },

  busInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },

  busNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  servicesRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },

  serviceIcon: {
    padding: SPACING.xs,
  },

  duration: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },

  // Services styles
  servicesContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },

  serviceItem: {
    width: '30%',
    alignItems: 'center',
  },

  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  serviceUnavailable: {
    opacity: 0.3,
  },

  serviceLabel: {
    fontSize: 12,
    color: COLORS.text.primary,
    textAlign: 'center',
  },

  serviceLabelUnavailable: {
    color: COLORS.text.light,
  },

  // Pricing styles
  pricingContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },

  priceBreakdown: {
    gap: SPACING.sm,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },

  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  vipBenefits: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.vip + '10',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.vip,
  },

  vipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.vip,
    marginBottom: SPACING.xs,
  },

  vipBenefit: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },

  // Footer styles
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  priceFooter: {
    flex: 1,
  },

  footerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  footerPriceLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  buttonContainer: {
    flex: 2,
    flexDirection: 'row',
    marginLeft: SPACING.md,
    gap: SPACING.sm,
  },

  secondaryButton: {
    flex: 1,
  },

  selectButton: {
    flex: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },

  errorText: {
    fontSize: 18,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
})

export default DetailsScreen
