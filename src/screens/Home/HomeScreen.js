import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Calendar } from 'react-native-calendars'
import { Button, Input } from '../../components'
import { COLORS, SPACING, BORDER_RADIUS, CITIES } from '../../constants'
import { useSearchStore } from '../../store'
import { formatDate } from '../../utils/helpers'

const HomeScreen = ({ navigation }) => {
  const { searchParams, setSearchParams } = useSearchStore()
  const [showDeparture, setShowDeparture] = useState(false)
  const [showArrival, setShowArrival] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showPassengers, setShowPassengers] = useState(false)

  const handleCitySelect = (city, type) => {
    if (type === 'departure') {
      setSearchParams({ departure: city })
      setShowDeparture(false)
    } else {
      setSearchParams({ arrival: city })
      setShowArrival(false)
    }
  }

  const handleDateSelect = (date) => {
    setSearchParams({ date: new Date(date.dateString) })
    setShowCalendar(false)
  }

  const handlePassengerChange = (count) => {
    setSearchParams({ passengers: count })
    setShowPassengers(false)
  }

  const handleSearch = () => {
    if (!searchParams.departure || !searchParams.arrival) {
      Alert.alert('Erreur', 'Veuillez sélectionner une ville de départ et d\'arrivée')
      return
    }
    
    if (searchParams.departure === searchParams.arrival) {
      Alert.alert('Erreur', 'La ville de départ et d\'arrivée doivent être différentes')
      return
    }

    navigation.navigate('Results')
  }

  const swapCities = () => {
    setSearchParams({
      departure: searchParams.arrival,
      arrival: searchParams.departure
    })
  }

  const renderCityModal = (visible, onClose, onSelect, title) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={CITIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cityItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.cityText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  )

  const renderPassengerModal = () => (
    <Modal visible={showPassengers} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nombre de passagers</Text>
          <TouchableOpacity onPress={() => setShowPassengers(false)}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.passengerContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.passengerOption,
                searchParams.passengers === count && styles.passengerSelected
              ]}
              onPress={() => handlePassengerChange(count)}
            >
              <Text style={[
                styles.passengerText,
                searchParams.passengers === count && styles.passengerTextSelected
              ]}>
                {count} {count === 1 ? 'passager' : 'passagers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TravelHub</Text>
          <Text style={styles.subtitle}>Voyagez facilement au Cameroun</Text>
        </View>

        {/* Search Form */}
        <View style={styles.searchCard}>
          {/* Departure and Arrival */}
          <View style={styles.routeContainer}>
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setShowDeparture(true)}
            >
              <View style={styles.citySelectorContent}>
                <Text style={styles.cityLabel}>Départ</Text>
                <Text style={[
                  styles.cityValue,
                  !searchParams.departure && styles.placeholder
                ]}>
                  {searchParams.departure || 'Choisir une ville'}
                </Text>
              </View>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={swapCities}>
              <Ionicons name="swap-vertical" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setShowArrival(true)}
            >
              <View style={styles.citySelectorContent}>
                <Text style={styles.cityLabel}>Arrivée</Text>
                <Text style={[
                  styles.cityValue,
                  !searchParams.arrival && styles.placeholder
                ]}>
                  {searchParams.arrival || 'Choisir une ville'}
                </Text>
              </View>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Date and Passengers */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionSelector}
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Date</Text>
                <Text style={styles.optionValue}>
                  {formatDate(searchParams.date)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionSelector}
              onPress={() => setShowPassengers(true)}
            >
              <Ionicons name="person" size={20} color={COLORS.primary} />
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Passagers</Text>
                <Text style={styles.optionValue}>
                  {searchParams.passengers} {searchParams.passengers === 1 ? 'passager' : 'passagers'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Button */}
          <Button
            title="Rechercher"
            onPress={handleSearch}
            style={styles.searchButton}
            size="large"
          />
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Trajets populaires</Text>
          
          <View style={styles.popularRoutes}>
            {[
              { from: 'Douala', to: 'Yaoundé', price: '3 500' },
              { from: 'Yaoundé', to: 'Bafoussam', price: '2 800' },
              { from: 'Douala', to: 'Bamenda', price: '4 200' }
            ].map((route, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularRoute}
                onPress={() => {
                  setSearchParams({
                    departure: route.from,
                    arrival: route.to
                  })
                }}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeText}>{route.from} → {route.to}</Text>
                  <Text style={styles.routePrice}>dès {route.price} FCFA</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderCityModal(
        showDeparture,
        () => setShowDeparture(false),
        (city) => handleCitySelect(city, 'departure'),
        'Ville de départ'
      )}

      {renderCityModal(
        showArrival,
        () => setShowArrival(false),
        (city) => handleCitySelect(city, 'arrival'),
        'Ville d\'arrivée'
      )}

      <Modal visible={showCalendar} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir une date</Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [searchParams.date.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: COLORS.primary
              }
            }}
            minDate={new Date().toISOString().split('T')[0]}
            theme={{
              selectedDayBackgroundColor: COLORS.primary,
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
            }}
          />
        </SafeAreaView>
      </Modal>

      {renderPassengerModal()}
      
      {/* Bouton de test Realtime (temporaire) */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => navigation.navigate('RealtimeTest')}
      >
        <Text style={styles.testButtonText}>🧪</Text>
      </TouchableOpacity>
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
    padding: SPACING.lg,
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },

  searchCard: {
    backgroundColor: COLORS.background,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  routeContainer: {
    marginBottom: SPACING.lg,
  },

  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },

  citySelectorContent: {
    flex: 1,
  },

  cityLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },

  cityValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },

  placeholder: {
    color: COLORS.text.light,
  },

  swapButton: {
    alignSelf: 'center',
    padding: SPACING.xs,
    marginVertical: SPACING.xs,
  },

  optionsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },

  optionSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },

  optionContent: {
    marginLeft: SPACING.sm,
  },

  optionLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },

  optionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },

  searchButton: {
    marginTop: SPACING.sm,
  },

  quickAccessContainer: {
    padding: SPACING.md,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  popularRoutes: {
    gap: SPACING.sm,
  },

  popularRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  routeInfo: {
    flex: 1,
  },

  routeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 2,
  },

  routePrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  cityItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  cityText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },

  passengerContainer: {
    padding: SPACING.md,
  },

  passengerOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  passengerSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  passengerText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },

  passengerTextSelected: {
    color: COLORS.text.white,
  },

  testButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  testButtonText: {
    fontSize: 20,
  },
})

export default HomeScreen
