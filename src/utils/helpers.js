// Formatage des prix en FCFA
export const formatPrice = (price) => {
  if (!price) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'
}

// Formatage des dates
export const formatDate = (date, format = 'default') => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'DD/MM à HH:mm') {
    const day = dateObj.getDate().toString().padStart(2, '0')
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const hours = dateObj.getHours().toString().padStart(2, '0')
    const minutes = dateObj.getMinutes().toString().padStart(2, '0')
    return `${day}/${month} à ${hours}:${minutes}`
  }
  
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  
  return dateObj.toLocaleDateString('fr-FR', options)
}

// Formatage des heures
export const formatTime = (time) => {
  if (!time) return ''
  
  // Si c'est déjà au format HH:MM
  if (typeof time === 'string' && time.includes(':')) {
    return time
  }
  
  // Si c'est un objet Date
  if (time instanceof Date) {
    return time.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return time
}

// Calcul de la durée entre deux heures
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return ''
  
  const start = new Date(`1970-01-01T${startTime}:00`)
  const end = new Date(`1970-01-01T${endTime}:00`)
  
  let diff = end - start
  
  // Si l'heure de fin est le lendemain
  if (diff < 0) {
    diff += 24 * 60 * 60 * 1000
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours === 0) {
    return `${minutes} min`
  }
  
  if (minutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

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

// Formatage du nom complet
export const formatFullName = (nom, prenom) => {
  if (!nom && !prenom) return 'Utilisateur'
  if (!nom) return prenom
  if (!prenom) return nom
  return `${prenom} ${nom}`
}

// Génération d'un ID unique
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
