import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, BORDER_RADIUS } from '../constants'
import { formatTime, formatPrice, calculateDuration } from '../utils/helpers'

const TripCard = ({ 
  trip, 
  onPress, 
  showRecommended = false,
  style 
}) => {
  const {
    heure_dep,
    heure_arr,
    ville_depart,
    ville_arrivee,
    prix,
    is_vip,
    agencies,
    trip_services,
    available_seats,
    total_seats
  } = trip

  const duration = calculateDuration(heure_dep, heure_arr)
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={() => onPress(trip)}
      activeOpacity={0.8}
    >
      {showRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>⭐ Recommandé</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(heure_dep)}</Text>
          <Text style={styles.duration}>{duration}</Text>
          <Text style={styles.time}>{formatTime(heure_arr)}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(prix)}</Text>
          {is_vip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.routeSection}>
        <Text style={styles.city}>{ville_depart}</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.text.secondary} />
        <Text style={styles.city}>{ville_arrivee}</Text>
      </View>

      {agencies && (
        <Text style={styles.agency}>{agencies.nom}</Text>
      )}

      {trip_services && trip_services.length > 0 && (
        <View style={styles.servicesContainer}>
          {trip_services[0].wifi && (
            <View style={styles.serviceTag}>
              <Ionicons name="wifi" size={12} color={COLORS.text.secondary} />
              <Text style={styles.serviceText}>WiFi</Text>
            </View>
          )}
          {trip_services[0].repas && (
            <View style={styles.serviceTag}>
              <Ionicons name="restaurant" size={12} color={COLORS.text.secondary} />
              <Text style={styles.serviceText}>Repas</Text>
            </View>
          )}
          {trip_services[0].clim && (
            <View style={styles.serviceTag}>
              <Ionicons name="snow" size={12} color={COLORS.text.secondary} />
              <Text style={styles.serviceText}>Clim</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.availabilityText}>
          {available_seats !== undefined 
            ? `${available_seats} place${available_seats > 1 ? 's' : ''} disponible${available_seats > 1 ? 's' : ''}`
            : 'Disponibilité à vérifier'
          }
        </Text>
        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.md,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  
  recommendedText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: '600',
  },

  header: {
    marginBottom: SPACING.sm,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  time: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  duration: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.border + '40',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 2,
  },

  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },

  vipBadge: {
    backgroundColor: COLORS.vip,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },

  vipText: {
    color: COLORS.text.white,
    fontSize: 10,
    fontWeight: '600',
  },

  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  city: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginHorizontal: SPACING.xs,
  },

  agency: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },

  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  serviceText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginLeft: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  availabilityText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailsButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
})

export default TripCard
