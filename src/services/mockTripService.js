import { CITIES, AGENCIES } from '../constants'

// Service pour générer des trajets fictifs pour les tests
export const mockTripService = {
  generateTripsForDays: (searchParams, days = 5) => {
    const trips = []
    const today = new Date()
    
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const tripDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dateStr = tripDate.toISOString().split('T')[0]
      
      // Générer 3-6 trajets par jour
      const tripsPerDay = Math.floor(Math.random() * 4) + 3
      
      for (let i = 0; i < tripsPerDay; i++) {
        const isVip = Math.random() > 0.6 // 40% chance d'être VIP
        const basePrice = Math.floor(Math.random() * 3000) + 2500
        const vipMultiplier = isVip ? 1.5 : 1
        
        const departureHour = Math.floor(Math.random() * 16) + 5 // 5h à 21h
        const departureMinutes = Math.floor(Math.random() * 6) * 10 // 0, 10, 20, 30, 40, 50
        const travelTime = Math.floor(Math.random() * 6) + 2 // 2h à 8h de voyage
        const arrivalHour = (departureHour + travelTime) % 24
        const arrivalMinutes = Math.floor(Math.random() * 6) * 10
        
        trips.push({
          id: `trip_${dateStr}_${i}`,
          ville_depart: searchParams.departure,
          ville_arrivee: searchParams.arrival,
          date: dateStr,
          heure_dep: `${departureHour.toString().padStart(2, '0')}:${departureMinutes.toString().padStart(2, '0')}`,
          heure_arr: `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`,
          prix: Math.floor(basePrice * vipMultiplier),
          is_vip: isVip,
          agencies: { 
            nom: AGENCIES[Math.floor(Math.random() * AGENCIES.length)]
          },
          trip_services: [{
            wifi: Math.random() > 0.3,
            repas: isVip && Math.random() > 0.4,
            clim: Math.random() > 0.2,
            divertissement: isVip && Math.random() > 0.6
          }],
          available_seats: Math.floor(Math.random() * 30) + 15
        })
      }
    }
    
    return trips
  },

  generateTripForSpecificDate: (searchParams, date) => {
    const dateStr = date.toISOString().split('T')[0]
    const trips = []
    
    // Générer 4-8 trajets pour la date spécifique
    const tripsCount = Math.floor(Math.random() * 5) + 4
    
    for (let i = 0; i < tripsCount; i++) {
      const isVip = Math.random() > 0.6
      const basePrice = Math.floor(Math.random() * 3000) + 2500
      const vipMultiplier = isVip ? 1.5 : 1
      
      const departureHour = Math.floor(Math.random() * 16) + 5
      const departureMinutes = Math.floor(Math.random() * 6) * 10 // 0, 10, 20, 30, 40, 50
      const travelTime = Math.floor(Math.random() * 6) + 2
      const arrivalHour = (departureHour + travelTime) % 24
      const arrivalMinutes = Math.floor(Math.random() * 6) * 10
      
      trips.push({
        id: `trip_${dateStr}_${i}`,
        ville_depart: searchParams.departure,
        ville_arrivee: searchParams.arrival,
        date: dateStr,
        heure_dep: `${departureHour.toString().padStart(2, '0')}:${departureMinutes.toString().padStart(2, '0')}`,
        heure_arr: `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`,
        prix: Math.floor(basePrice * vipMultiplier),
        is_vip: isVip,
        agencies: { 
          nom: AGENCIES[Math.floor(Math.random() * AGENCIES.length)]
        },
        trip_services: [{
          wifi: Math.random() > 0.3,
          repas: isVip && Math.random() > 0.4,
          clim: Math.random() > 0.2,
          divertissement: isVip && Math.random() > 0.6
        }],
        available_seats: Math.floor(Math.random() * 30) + 15
      })
    }
    
    // Trier par heure de départ
    return trips.sort((a, b) => a.heure_dep.localeCompare(b.heure_dep))
  }
}
