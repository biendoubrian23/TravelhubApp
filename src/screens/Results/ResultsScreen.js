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
import { tripService } from '../../services/supabase'
import { formatDate, formatPrice } from '../../utils/helpers'

const ResultsScreen = ({ navigation }) => {
  const { searchParams, searchResults, setSearchResults, isSearching, setIsSearching, setSearchParams } = useSearchStore()
  const { setCurrentTrip } = useBookingStore()
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [dateCarousel, setDateCarousel] = useState([])
  const [isLoadingNewDate, setIsLoadingNewDate] = useState(false)
  const [localSearchParams, setLocalSearchParams] = useState(searchParams) // État local pour éviter les re-renders

  useEffect(() => {
    generateDateCarousel()
    searchTrips()
  }, [])

  // Synchroniser les paramètres locaux avec le store seulement quand nécessaire
  useEffect(() => {
    setLocalSearchParams(searchParams)
  }, [searchParams.departure, searchParams.arrival, searchParams.passengers])

  const generateDateCarousel = () => {
    const dates = []
    const baseDate = new Date(searchParams.date)
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
    setIsSearching(true)
    try {
      // Simulation de données pour la démo
      const mockTrips = [
        {
          id: '1',
          ville_depart: searchParams.departure,
          ville_arrivee: searchParams.arrival,
          date: searchParams.date.toISOString().split('T')[0],
          heure_dep: '06:47',
          heure_arr: '12:37',
          prix: 3500,
          is_vip: false,
          agencies: { nom: 'Finexs Voyage' },
          trip_services: [{ wifi: true, repas: false, clim: true }]
        },
        {
          id: '2',
          ville_depart: searchParams.departure,
          ville_arrivee: searchParams.arrival,
          date: searchParams.date.toISOString().split('T')[0],
          heure_dep: '08:25',
          heure_arr: '13:13',
          prix: 4200,
          is_vip: true,
          agencies: { nom: 'Garanti Express' },
          trip_services: [{ wifi: true, repas: true, clim: true }]
        },
        {
          id: '3',
          ville_depart: searchParams.departure,
          ville_arrivee: searchParams.arrival,
          date: searchParams.date.toISOString().split('T')[0],
          heure_dep: '10:15',
          heure_arr: '15:45',
          prix: 3200,
          is_vip: false,
          agencies: { nom: 'Touristique Express' },
          trip_services: [{ wifi: false, repas: false, clim: true }]
        },
        {
          id: '4',
          ville_depart: searchParams.departure,
          ville_arrivee: searchParams.arrival,
          date: searchParams.date.toISOString().split('T')[0],
          heure_dep: '14:30',
          heure_arr: '19:20',
          prix: 3800,
          is_vip: true,
          agencies: { nom: 'Central Voyages' },
          trip_services: [{ wifi: true, repas: true, clim: true }]
        }
      ]

      setSearchResults(mockTrips)
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les trajets')
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const filteredTrips = searchResults.filter(trip => {
    if (selectedFilter === 'classic') return !trip.is_vip
    if (selectedFilter === 'vip') return trip.is_vip
    return true
  })

  const handleTripSelect = (trip) => {
    // Stocker le trajet sélectionné dans le store pour les autres écrans
    setCurrentTrip(trip)
    // Passer aussi le trajet dans les paramètres de navigation pour éviter les problèmes
    navigation.navigate('Details', { 
      tripId: trip.id,
      trip: trip,
      searchParams: localSearchParams, // Utiliser les paramètres locaux actuels
      allTrips: searchResults // Passer tous les résultats pour permettre la comparaison
    })
  }

  const handleDateSelect = async (selectedDate) => {
    // Ne pas permettre de sélectionner la même date
    if (selectedDate.toDateString() === localSearchParams.date.toDateString()) {
      return
    }
    
    // Empêcher les appels multiples pendant le chargement
    if (isLoadingNewDate) {
      return
    }
    
    console.log('Recherche pour la nouvelle date:', selectedDate.toISOString())
    setIsLoadingNewDate(true)
    
    try {
      // Mettre à jour les paramètres locaux immédiatement
      const newSearchParams = {
        ...localSearchParams,
        date: selectedDate
      }
      setLocalSearchParams(newSearchParams)
      
      // Mettre à jour le store seulement après la fin du processus
      setSearchParams(newSearchParams)
      
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
      
      // Simuler la recherche de nouveaux trajets
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Recherche terminée pour:', selectedDate.toISOString())
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      Alert.alert('Erreur', 'Impossible de charger les trajets pour cette date')
    } finally {
      setIsLoadingNewDate(false)
    }
  }

  const renderDateCarouselItem = ({ item, index }) => {
    const isSelected = item.date.toDateString() === localSearchParams.date.toDateString()
    
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>
            {localSearchParams.departure} → {localSearchParams.arrival}
          </Text>
          <Text style={styles.routeSubtitle}>
            {formatDate(localSearchParams.date)} • {localSearchParams.passengers} {localSearchParams.passengers === 1 ? 'passager' : 'passagers'}
          </Text>
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
