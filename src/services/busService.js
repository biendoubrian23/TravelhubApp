import { supabase } from './supabaseClient'

export const busService = {
  // Récupérer les informations d'un bus
  async getBusDetails(busId) {
    try {
      const { data: bus, error } = await supabase
        .from('buses')
        .select(`
          *,
          agencies:agency_id (
            name,
            id
          )
        `)
        .eq('id', busId)
        .single()

      if (error) {
        console.error('Erreur lors de la récupération des détails du bus:', error)
        throw error
      }

      return bus
    } catch (error) {
      console.error('Erreur dans getBusDetails:', error)
      throw error
    }
  },

  // Récupérer tous les sièges disponibles pour un trajet (pour tous types de bus)
  async getAvailableSeatsForTrip(tripId, busId = null) {
    try {
      console.log(`Récupération des sièges pour le trajet ${tripId}`);
      
      const { data: seats, error } = await supabase
        .from('seat_maps')
        .select('*')
        .eq('trip_id', tripId)
        .order('position_row', { ascending: true })
        .order('position_column', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des sièges:', error);
        throw error;
      }

      console.log(`${seats?.length || 0} sièges trouvés pour le trajet ${tripId}`);
      return seats || [];
    } catch (error) {
      console.error('Erreur dans getAvailableSeatsForTrip:', error);
      throw error;
    }
  },

  // Récupérer la disposition VIP des sièges (maintenant utilisé pour tous types)
  async getVipSeatDisplayLayout(tripId) {
    try {
      console.log(`Récupération de la disposition des sièges pour le trajet ${tripId}`);
      
      const { data: seats, error } = await supabase
        .from('seat_maps')
        .select('*')
        .eq('trip_id', tripId)
        .order('position_row', { ascending: true })
        .order('position_column', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération de la disposition des sièges:', error);
        throw error;
      }

      if (!seats || seats.length === 0) {
        console.log('Aucun siège trouvé pour ce trajet');
        return {
          layout: [],
          stats: {
            totalSeats: 0,
            availableSeats: 0,
            occupiedSeats: 0
          }
        };
      }

      // Organiser les sièges par rangée
      const seatsByRow = seats.reduce((acc, seat) => {
        const rowNumber = seat.position_row;
        if (!acc[rowNumber]) {
          acc[rowNumber] = [];
        }
        acc[rowNumber].push({
          seatNumber: seat.seat_number,
          column: seat.position_column,
          type: seat.seat_type,
          isAvailable: seat.is_available,
          priceModifier: seat.price_modifier_fcfa || 0
        });
        return acc;
      }, {});

      // Créer le layout final
      const layout = Object.keys(seatsByRow)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(rowNumber => ({
          rowNumber: parseInt(rowNumber),
          seats: seatsByRow[rowNumber].sort((a, b) => a.column - b.column)
        }));

      // Calculer les statistiques
      const totalSeats = seats.length;
      const availableSeats = seats.filter(seat => seat.is_available).length;
      const occupiedSeats = totalSeats - availableSeats;

      console.log(`Disposition chargée: ${totalSeats} sièges total (${availableSeats} libres, ${occupiedSeats} occupés)`);

      return {
        layout,
        stats: {
          totalSeats,
          availableSeats,
          occupiedSeats
        }
      };
    } catch (error) {
      console.error('Erreur dans getVipSeatDisplayLayout:', error);
      throw error;
    }
  },

  // Récupérer tous les bus d'une agence
  async getBusesByAgency(agencyId) {
    try {
      const { data: buses, error } = await supabase
        .from('buses')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des bus de l\'agence:', error)
        throw error
      }

      return buses || []
    } catch (error) {
      console.error('Erreur dans getBusesByAgency:', error)
      throw error
    }
  },

  // Réserver temporairement un siège (pour éviter les conflits)
  async reserveSeatTemporarily(tripId, seatNumber, userId, minutes = 10) {
    try {
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes)

      const { data, error } = await supabase
        .from('temporary_seat_reservations')
        .insert({
          trip_id: tripId,
          seat_number: seatNumber,
          user_id: userId,
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        console.error('Erreur lors de la réservation temporaire:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erreur dans reserveSeatTemporarily:', error)
      throw error
    }
  },

  // Libérer une réservation temporaire
  async releaseTemporaryReservation(tripId, seatNumber, userId) {
    try {
      const { error } = await supabase
        .from('temporary_seat_reservations')
        .delete()
        .eq('trip_id', tripId)
        .eq('seat_number', seatNumber)
        .eq('user_id', userId)

      if (error) {
        console.error('Erreur lors de la libération de la réservation temporaire:', error)
        throw error
      }
    } catch (error) {
      console.error('Erreur dans releaseTemporaryReservation:', error)
      throw error
    }
  },

  // Récupérer la disposition complète des sièges pour un trajet
  async getDetailedSeatLayout(tripId) {
    try {
      const { data: seatMaps, error } = await supabase
        .from('seat_maps')
        .select(`
          seat_number,
          seat_type,
          is_available,
          price_modifier_fcfa,
          position_row,
          position_column
        `)
        .eq('trip_id', tripId)
        .order('position_row')
        .order('position_column')

      if (error) {
        console.error('Erreur lors de la récupération de la disposition des sièges:', error)
        throw error
      }

      if (!seatMaps || seatMaps.length === 0) {
        return {
          seats: [],
          totalSeats: 0,
          availableSeats: 0,
          occupiedSeats: 0,
          vipSeats: 0,
          standardSeats: 0
        }
      }

      // Organiser les sièges par rangée
      const seatsByRow = {}
      seatMaps.forEach(seat => {
        if (!seatsByRow[seat.position_row]) {
          seatsByRow[seat.position_row] = []
        }
        seatsByRow[seat.position_row].push(seat)
      })

      // Statistiques
      const totalSeats = seatMaps.length
      const availableSeats = seatMaps.filter(seat => seat.is_available).length
      const occupiedSeats = seatMaps.filter(seat => !seat.is_available).length
      const vipSeats = seatMaps.filter(seat => seat.seat_type === 'vip').length
      const standardSeats = seatMaps.filter(seat => seat.seat_type === 'standard').length

      return {
        seats: seatMaps,
        seatsByRow,
        totalSeats,
        availableSeats,
        occupiedSeats,
        vipSeats,
        standardSeats
      }
    } catch (error) {
      console.error('Erreur dans getDetailedSeatLayout:', error)
      throw error
    }
  },

  // Générer un plan de sièges VIP formaté pour l'affichage mobile
  async getVipSeatDisplayLayout(tripId) {
    try {
      const seatLayout = await this.getDetailedSeatLayout(tripId)
      
      if (seatLayout.totalSeats === 0) {
        return {
          layout: [],
          stats: {
            totalSeats: 0,
            availableSeats: 0,
            occupiedSeats: 0
          }
        }
      }

      // Créer un layout organisé par rangées pour l'affichage VIP
      const layout = []
      Object.keys(seatLayout.seatsByRow).forEach(rowNumber => {
        const row = seatLayout.seatsByRow[rowNumber]
        layout.push({
          rowNumber: parseInt(rowNumber),
          seats: row.map(seat => ({
            seatNumber: seat.seat_number,
            type: seat.seat_type,
            isAvailable: seat.is_available,
            isOccupied: !seat.is_available,
            column: seat.position_column,
            priceModifier: seat.price_modifier_fcfa
          })).sort((a, b) => a.column - b.column)
        })
      })

      // Trier par numéro de rangée
      layout.sort((a, b) => a.rowNumber - b.rowNumber)

      return {
        layout,
        stats: {
          totalSeats: seatLayout.totalSeats,
          availableSeats: seatLayout.availableSeats,
          occupiedSeats: seatLayout.occupiedSeats,
          vipSeats: seatLayout.vipSeats,
          standardSeats: seatLayout.standardSeats
        }
      }
    } catch (error) {
      console.error('Erreur dans getVipSeatDisplayLayout:', error)
      throw error
    }
  },

  // Attribuer automatiquement des sièges disponibles pour un trajet non-VIP
  async assignRandomSeats(tripId, numberOfSeats = 1) {
    try {
      // Récupérer les sièges disponibles
      const { data: availableSeats, error } = await supabase
        .from('seat_maps')
        .select('seat_number, seat_type, position_row, position_column')
        .eq('trip_id', tripId)
        .eq('is_available', true)
        .limit(numberOfSeats * 2) // Prendre un peu plus pour avoir du choix

      if (error) {
        console.error('Erreur lors de la récupération des sièges disponibles:', error)
        throw error
      }

      if (!availableSeats || availableSeats.length < numberOfSeats) {
        throw new Error(`Pas assez de sièges disponibles. Demandé: ${numberOfSeats}, Disponible: ${availableSeats?.length || 0}`)
      }

      // Mélanger et prendre le nombre de sièges demandé
      const shuffledSeats = [...availableSeats].sort(() => Math.random() - 0.5)
      const selectedSeats = shuffledSeats.slice(0, numberOfSeats)

      console.log(`Sièges automatiquement attribués: ${selectedSeats.map(s => s.seat_number).join(', ')}`)

      return selectedSeats.map(seat => ({
        seat_number: seat.seat_number,
        seat_type: seat.seat_type,
        row: seat.position_row,
        column: seat.position_column
      }))
    } catch (error) {
      console.error('Erreur dans assignRandomSeats:', error)
      throw error
    }
  },

  // Vérifier et réserver automatiquement des sièges pour une réservation
  async autoReserveSeats(tripId, numberOfSeats = 1) {
    try {
      // 1. Attribuer les sièges
      const assignedSeats = await this.assignRandomSeats(tripId, numberOfSeats)
      
      // 2. Les marquer comme réservés
      const seatNumbers = assignedSeats.map(seat => seat.seat_number)
      const { error: updateError } = await supabase
        .from('seat_maps')
        .update({ is_available: false })
        .eq('trip_id', tripId)
        .in('seat_number', seatNumbers)

      if (updateError) {
        console.error('Erreur lors de la réservation automatique:', updateError)
        throw updateError
      }

      console.log(`Sièges automatiquement réservés: ${seatNumbers.join(', ')}`)
      return assignedSeats
    } catch (error) {
      console.error('Erreur dans autoReserveSeats:', error)
      throw error
    }
  }
}
