import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TripCard } from '../../components'
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants'
import { useSearchStore, useBookingStore } from '../../store'
import { tripService } from '../../services/tripService'
import { formatDate, formatPrice, formatTime } from '../../utils/helpers'

const ResultsScreen = ({ navigation, route }) => {
  const { 
    searchParams, 
    searchResults, 
    returnSearchResults,
    setSearchResults, 
    setReturnSearchResults,
    isSearching, 
    setIsSearching, 
    setSearchParams 
  } = useSearchStore()
  const { 
    setCurrentTrip, 
    setReturnTrip, 
    bookingStep, 
    setBookingStep,
    currentTrip,
    returnTrip
  } = useBookingStore()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [dateCarousel, setDateCarousel] = useState([])
  const [isLoadingNewDate, setIsLoadingNewDate] = useState(false)
  const [localSearchParams, setLocalSearchParams] = useState(searchParams)
  const [showingReturnTrips, setShowingReturnTrips] = useState(false)
  const [outboundSeats, setOutboundSeats] = useState([]) // Pour stocker les sièges aller sélectionnés

  useEffect(() => {
    // Vérifier et initialiser la date si elle est manquante
    if (!searchParams.date) {
      console.log('🗓️ ResultsScreen - Date manquante, initialisation avec date du jour')
      const today = new Date()
      setSearchParams({
        ...searchParams,
        date: today
      })
      setLocalSearchParams({
        ...searchParams,
        date: today
      })
      return // Arrêter ici, l'effet se redéclenchera avec la nouvelle date
    }
    
    generateDateCarousel()
    searchTrips()
    
    // Vérifier si on revient de SeatSelection pour choisir le trajet retour
    if (route.params?.continueReturnSelection) {
      setShowingReturnTrips(true)
      setBookingStep('return')
      if (route.params?.outboundSeats) {
        setOutboundSeats(route.params.outboundSeats)
      }
    } else {
      // Réinitialiser l'état si on arrive d'une nouvelle recherche
      setShowingReturnTrips(false)
      setBookingStep('outbound')
      setOutboundSeats([])
    }
  }, [route.params?.continueReturnSelection, searchParams.date])

  // Régénérer le calendrier quand on passe du mode aller au mode retour
  useEffect(() => {
    generateDateCarousel()
    // Mettre à jour la date locale selon le mode
    if (showingReturnTrips && searchParams.returnDate) {
      setLocalSearchParams(prev => ({
        ...prev,
        date: searchParams.returnDate
      }))
    } else {
      setLocalSearchParams(prev => ({
        ...prev,
        date: searchParams.date
      }))
    }
  }, [showingReturnTrips])

  // Synchroniser les paramètres locaux avec le store seulement quand nécessaire
  useEffect(() => {
    setLocalSearchParams(searchParams)
  }, [searchParams.departure, searchParams.arrival, searchParams.passengers])

  const generateDateCarousel = () => {
    const dates = []
    // Utiliser la date de retour si on affiche les trajets retour, sinon la date de départ
    const selectedDate = showingReturnTrips ? searchParams.returnDate : searchParams.date
    
    // Si aucune date n'est sélectionnée, utiliser aujourd'hui par défaut
    if (!selectedDate) {
      console.warn('generateDateCarousel - Aucune date sélectionnée, utilisation de la date du jour')
      const today = new Date()
      const baseDate = today
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate)
        date.setDate(baseDate.getDate() + i)
        dates.push({
          date,
          price: Math.floor(Math.random() * 2000) + 2500
        })
      }
      setDateCarousel(dates)
      return
    }
    
    const baseDate = new Date(selectedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to compare only dates
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() + i)
      
      // Ne pas inclure les dates passées
      if (date >= today) {
        dates.push({
          date,
          price: Math.floor(Math.random() * 2000) + 2500 // Prix simulé
        })
      }
    }
    
    // Si aucune date future n'est disponible, générer les 7 prochains jours
    if (dates.length === 0) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push({
          date,
          price: Math.floor(Math.random() * 2000) + 2500 // Prix simulé
        })
      }
    }
    
    setDateCarousel(dates)
  }

  const searchTrips = async () => {
    console.log('🔍 ResultsScreen - Début de la recherche de trajets')
    setIsSearching(true)
    try {
      // Rechercher les trajets dans la base de données uniquement
      const trips = await tripService.searchTrips({
        departure: searchParams.departure,
        arrival: searchParams.arrival,
        date: searchParams.date
      })
      
      console.log('✅ ResultsScreen - Trajets trouvés:', trips?.length || 0)
      setSearchResults(trips)
      
      // Si c'est un aller-retour, rechercher aussi les trajets de retour
      if (searchParams.isRoundTrip && searchParams.returnDate) {
        const returnTrips = await tripService.searchTrips({
          departure: searchParams.arrival,
          arrival: searchParams.departure,
          date: searchParams.returnDate
        })
        console.log('✅ ResultsScreen - Trajets retour trouvés:', returnTrips?.length || 0)
        setReturnSearchResults(returnTrips)
      }
      
    } catch (error) {
      console.error('❌ ResultsScreen - Erreur lors de la recherche des trajets:', error)
      Alert.alert(
        'Erreur de connexion', 
        'Impossible de récupérer les trajets depuis la base de données. Veuillez vérifier votre connexion internet et réessayer.'
      )
      // Ne pas utiliser de fallback, laisser les résultats vides
      setSearchResults([])
      setReturnSearchResults([])
    } finally {
      console.log('🏁 ResultsScreen - Fin de la recherche, setIsSearching(false)')
      setIsSearching(false)
    }
  }

  const getCurrentTrips = () => {
    if (showingReturnTrips) {
      return Array.isArray(returnSearchResults) ? returnSearchResults : []
    }
    return Array.isArray(searchResults) ? searchResults : []
  }

  const filteredTrips = getCurrentTrips().filter(trip => {
    if (selectedFilter === 'classic') return !trip.is_vip
    if (selectedFilter === 'vip') return trip.is_vip
    return true
  })

  const handleTripSelect = (trip) => {
    if (!searchParams.isRoundTrip) {
      // Trajet simple - aller directement au détail ou à la sélection de siège
      setCurrentTrip(trip)
      if (trip.is_vip) {
        // Pour les trajets VIP, aller à la sélection de siège
        navigation.navigate('SeatSelection', { 
          trip: trip,
          searchParams: localSearchParams
        })
      } else {
        // Pour les trajets classic, aller directement au récapitulatif
        navigation.navigate('Recap', { 
          trip: trip,
          searchParams: localSearchParams
        })
      }
    } else {
      // Trajet aller-retour
      if (!showingReturnTrips) {
        // Sélection du trajet aller
        setCurrentTrip(trip)
        setBookingStep('return')
        
        // Si le trajet aller est VIP, aller directement à la sélection de siège
        if (trip.is_vip) {
          navigation.navigate('SeatSelection', { 
            outboundTrip: trip,
            returnTrip: null, // Pas encore de trajet retour
            searchParams: localSearchParams,
            showReturnSelection: true // Indiquer qu'on doit revenir pour le retour
          })
        } else {
          // Si le trajet aller n'est pas VIP, passer au choix du retour
          setShowingReturnTrips(true)
        }
      } else {
        // Sélection du trajet retour
        setReturnTrip(trip)
        setBookingStep('seats')
        
        // Nouvelle logique : naviguer selon les types de trajets
        const outboundIsVip = currentTrip.is_vip
        const returnIsVip = trip.is_vip
        
        if (outboundIsVip && returnIsVip) {
          // Les deux trajets sont VIP : sélection de sièges pour les deux
          const navigationParams = { 
            outboundTrip: currentTrip,
            returnTrip: trip,
            searchParams: localSearchParams
          }
          
          if (outboundSeats.length > 0) {
            navigationParams.preselectedOutboundSeats = outboundSeats
          }
          
          navigation.navigate('SeatSelection', navigationParams)
        } else if (outboundIsVip && !returnIsVip) {
          // Seul le trajet aller est VIP
          if (outboundSeats.length > 0) {
            // Sièges aller déjà sélectionnés, aller au récapitulatif
            navigation.navigate('Recap', { 
              outboundTrip: currentTrip,
              returnTrip: trip,
              selectedSeats: outboundSeats,
              returnSelectedSeats: [], // Pas de sièges à sélectionner pour le retour
              searchParams: localSearchParams
            })
          } else {
            // Sélection de sièges pour l'aller seulement
            navigation.navigate('SeatSelection', { 
              outboundTrip: currentTrip,
              returnTrip: trip,
              searchParams: localSearchParams,
              vipTripOnly: 'outbound' // Indiquer que seul l'aller nécessite des sièges
            })
          }
        } else if (!outboundIsVip && returnIsVip) {
          // Seul le trajet retour est VIP : sélection de sièges pour le retour seulement
          navigation.navigate('SeatSelection', { 
            outboundTrip: currentTrip,
            returnTrip: trip,
            searchParams: localSearchParams,
            vipTripOnly: 'return' // Indiquer que seul le retour nécessite des sièges
          })
        } else {
          // Aucun trajet VIP : aller directement au récapitulatif
          const recapParams = { 
            outboundTrip: currentTrip,
            returnTrip: trip,
            searchParams: localSearchParams
          }
          
          if (outboundSeats.length > 0) {
            recapParams.preselectedOutboundSeats = outboundSeats
          }
          
          navigation.navigate('Recap', recapParams)
        }
      }
    }
  }

  const handleBackToOutbound = () => {
    setShowingReturnTrips(false)
    setBookingStep('outbound')
    setReturnTrip(null)
  }

  const handleDateSelect = async (selectedDate) => {
    // Utiliser la date appropriée selon le mode (aller ou retour)
    const currentDate = showingReturnTrips ? searchParams.returnDate : searchParams.date
    
    // Vérifier que currentDate n'est pas null avant de l'utiliser
    if (!currentDate || !selectedDate) {
      console.warn('handleDateSelect - Date manquante:', { currentDate, selectedDate })
      return
    }
    
    // Ne pas permettre de sélectionner la même date
    if (selectedDate.toDateString() === new Date(currentDate).toDateString()) {
      return
    }
    
    // Empêcher les appels multiples pendant le chargement
    if (isLoadingNewDate) {
      return
    }
    
    console.log('Recherche pour la nouvelle date:', selectedDate.toISOString(), 'Mode:', showingReturnTrips ? 'retour' : 'aller')
    setIsLoadingNewDate(true)
    
    try {
      // Mettre à jour les paramètres selon le mode
      if (showingReturnTrips) {
        // Mode retour : mettre à jour la date de retour et les paramètres du store
        const newSearchParams = {
          ...searchParams,
          returnDate: selectedDate
        }
        setSearchParams(newSearchParams)
        
        // Mettre à jour les paramètres locaux pour l'affichage
        setLocalSearchParams({
          ...localSearchParams,
          date: selectedDate
        })
      } else {
        // Mode aller : mettre à jour les paramètres locaux et le store
        const newSearchParams = {
          ...localSearchParams,
          date: selectedDate
        }
        setLocalSearchParams(newSearchParams)
        setSearchParams(newSearchParams)
      }
      
      // Regénérer le carrousel avec la nouvelle date
      const dates = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = -3; i <= 3; i++) {
        const date = new Date(selectedDate)
        date.setDate(selectedDate.getDate() + i)
        
        if (date >= today) {
          dates.push({
            date,
            price: Math.floor(Math.random() * 2000) + 2500
          })
        }
      }
      
      if (dates.length === 0) {
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          dates.push({
            date,
            price: Math.floor(Math.random() * 2000) + 2500
          })
        }
      }
      
      setDateCarousel(dates)
      
      // Rechercher les nouveaux trajets selon le mode
      if (showingReturnTrips) {
        // Mode retour : rechercher les trajets retour pour la nouvelle date
        const returnTrips = await tripService.searchTrips({
          departure: searchParams.arrival,
          arrival: searchParams.departure,
          date: selectedDate.toISOString().split('T')[0]
        })
        setReturnSearchResults(returnTrips)
      } else {
        // Mode aller : rechercher les trajets aller pour la nouvelle date  
        const trips = await tripService.searchTrips({
          departure: localSearchParams.departure,
          arrival: localSearchParams.arrival,
          date: selectedDate.toISOString().split('T')[0]
        })
        setSearchResults(trips)
      }
      
      // Simuler le délai de recherche
      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log('Recherche terminée pour:', selectedDate.toISOString(), 'Mode:', showingReturnTrips ? 'retour' : 'aller')
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      Alert.alert('Erreur', 'Impossible de charger les trajets pour cette date')
    } finally {
      setIsLoadingNewDate(false)
    }
  }

  const renderDateCarouselItem = ({ item, index }) => {
    // Utiliser searchParams directement au lieu de localSearchParams pour éviter les problèmes de sync
    const currentDate = showingReturnTrips ? searchParams.returnDate : searchParams.date
    
    // Protection simple : vérifier que les dates existent avant toDateString
    if (!item?.date || !currentDate) {
      return null // Ne pas afficher l'item si les dates sont manquantes
    }
    
    const isSelected = item.date.toDateString() === new Date(currentDate).toDateString()
    
    return (
      <TouchableOpacity
        style={[
          styles.dateItem, 
          isSelected && styles.selectedDateItem,
          isLoadingNewDate && !isSelected && styles.disabledDateItem
        ]}
        onPress={() => handleDateSelect(item.date)}
        disabled={isLoadingNewDate}
        activeOpacity={0.7}
      >
        {isSelected && isLoadingNewDate ? (
          <ActivityIndicator size="small" color={COLORS.surface} />
        ) : (
          <>
            <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
              {formatDate(item.date).split(' ')[0]}
            </Text>
            <Text style={[styles.dateFull, isSelected && styles.selectedDateText]}>
              {formatDate(item.date).split(' ').slice(1).join(' ')}
            </Text>
            <Text style={[styles.datePrice, isSelected && styles.selectedDateText]}>
              dès {formatPrice(item.price)}
            </Text>
          </>
        )}
      </TouchableOpacity>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.routeHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (showingReturnTrips) {
              handleBackToOutbound()
            } else {
              navigation.goBack()
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.routeInfo}>
          {showingReturnTrips ? (
            <>
              <View style={styles.tripTypeIndicator}>
                <View style={[styles.tripBadge, styles.returnBadge]}>
                  <Ionicons name="arrow-back" size={16} color="#fff" />
                  <Text style={styles.tripBadgeText}>RETOUR</Text>
                </View>
              </View>
              <Text style={styles.routeTitle}>
                {searchParams.arrival} → {searchParams.departure}
              </Text>
              <Text style={styles.routeSubtitle}>
                Retour • {searchParams.returnDate ? formatDate(searchParams.returnDate) : ''} • {searchParams.passengers} {searchParams.passengers === 1 ? 'passager' : 'passagers'}
              </Text>
              {currentTrip && (
                <View style={styles.selectedOutboundInfo}>
                  <Text style={styles.selectedTripText}>
                    ✓ Aller sélectionné: {formatTime(currentTrip.heure_dep)} - {formatPrice(currentTrip.prix)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {searchParams.isRoundTrip && (
                <View style={styles.tripTypeIndicator}>
                  <View style={[styles.tripBadge, styles.outboundBadge]}>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                    <Text style={styles.tripBadgeText}>ALLER</Text>
                  </View>
                </View>
              )}
              <Text style={styles.routeTitle}>
                {localSearchParams.departure} → {localSearchParams.arrival}
              </Text>
              <Text style={styles.routeSubtitle}>
                {searchParams.isRoundTrip ? 'Aller • ' : ''}{formatDate(localSearchParams.date)} • {localSearchParams.passengers} {localSearchParams.passengers === 1 ? 'passager' : 'passagers'}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.modifyButton}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Carousel */}
      <View style={styles.dateCarouselContainer}>
        <FlatList
          data={dateCarousel}
          renderItem={renderDateCarouselItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateCarousel}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'all' && styles.activeFilter]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
            Tous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'classic' && styles.activeFilter]}
          onPress={() => setSelectedFilter('classic')}
        >
          <Text style={[styles.filterText, selectedFilter === 'classic' && styles.activeFilterText]}>
            Classique
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'vip' && styles.activeFilter]}
          onPress={() => setSelectedFilter('vip')}
        >
          <Text style={[styles.filterText, selectedFilter === 'vip' && styles.activeFilterText]}>
            VIP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsText}>
          {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} trouvé{filteredTrips.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )

  if (isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTrips}
        renderItem={({ item, index }) => (
          <TripCard
            trip={item}
            onPress={handleTripSelect}
            showRecommended={index === 1} // Recommander le 2ème trajet
            style={styles.tripCard}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  header: {
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.md,
  },

  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },

  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },

  routeInfo: {
    flex: 1,
  },

  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  routeSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  modifyButton: {
    padding: SPACING.xs,
  },

  dateCarouselContainer: {
    paddingVertical: SPACING.sm,
  },

  dateCarousel: {
    paddingHorizontal: SPACING.md,
  },

  dateItem: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    minWidth: 80,
  },

  selectedDateItem: {
    backgroundColor: COLORS.primary,
  },

  disabledDateItem: {
    opacity: 0.5,
  },

  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  dateFull: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginVertical: 2,
  },

  datePrice: {
    fontSize: 10,
    color: COLORS.text.secondary,
  },

  selectedDateText: {
    color: COLORS.text.white,
  },

  disabledDateItem: {
    opacity: 0.5,
  },

  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },

  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  activeFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },

  activeFilterText: {
    color: COLORS.text.white,
  },

  resultsCount: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  resultsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  selectedOutboundInfo: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },

  selectedTripText: {
    fontSize: 12,
    color: COLORS.text.white,
    fontWeight: '500',
  },

  tripTypeIndicator: {
    marginBottom: SPACING.xs,
  },

  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },

  outboundBadge: {
    backgroundColor: COLORS.primary,
  },

  returnBadge: {
    backgroundColor: '#FF6B35', // Orange pour le retour
  },

  tripBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },

  listContent: {
    paddingBottom: SPACING.lg,
  },

  tripCard: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
})

export default ResultsScreen
