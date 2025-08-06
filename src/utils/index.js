// Validation des emails
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation des numéros de téléphone camerounais
export const isValidPhone = (phone) => {
  // Format: +237XXXXXXXXX ou 237XXXXXXXXX ou 6XXXXXXXX ou 2XXXXXXXX
  const phoneRegex = /^(\+?237)?[62]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Formatage des prix en FCFA
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(price).replace('XAF', 'FCFA')
}

// Formatage des dates
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date)
}

// Formatage des heures
export const formatTime = (timeString) => {
  return timeString.slice(0, 5) // Format HH:MM
}

// Calcul de la durée du trajet
export const calculateDuration = (departureTime, arrivalTime) => {
  const [depHour, depMin] = departureTime.split(':').map(Number)
  const [arrHour, arrMin] = arrivalTime.split(':').map(Number)
  
  let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin)
  
  // Si l'arrivée est le lendemain
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60
  }
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

// Validation email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation des numéros de téléphone camerounais
export const isValidPhone = (phone) => {
  // Format: +237XXXXXXXXX ou 237XXXXXXXXX ou 6XXXXXXXX ou 2XXXXXXXX
  const phoneRegex = /^(\+?237)?[62]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Génération d'un ID unique
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Délai d'attente pour les promesses
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
