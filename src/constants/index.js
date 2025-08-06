// Couleurs principales inspirées du design SNCF mais adaptées
export const COLORS = {
  primary: '#0066CC',        // Bleu principal
  secondary: '#00A651',      // Vert pour les actions positives
  accent: '#FF6B35',         // Orange pour les highlights
  background: '#FFFFFF',     // Blanc pour les fonds
  surface: '#F8F9FA',        // Gris très clair pour les surfaces
  text: {
    primary: '#1A1A1A',     // Noir pour le texte principal
    secondary: '#6B7280',    // Gris pour le texte secondaire
    light: '#9CA3AF',       // Gris clair
    white: '#FFFFFF'
  },
  border: '#E5E7EB',        // Gris pour les bordures
  error: '#DC2626',         // Rouge pour les erreurs
  success: '#059669',       // Vert pour les succès
  warning: '#D97706',       // Orange pour les avertissements
  vip: '#8B5CF6',          // Violet pour les trajets VIP
}

// Villes principales du Cameroun
export const CITIES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Garoua',
  'Bamenda',
  'Ngaoundéré',
  'Bertoua',
  'Kribi',
  'Limbe',
  'Buea',
  'Dschang',
  'Foumban',
  'Maroua',
  'Ebolowa',
  'Edéa'
]

// Agences de transport connues
export const AGENCIES = [
  'Finexs Voyage',
  'Garanti Express',
  'Touristique Express',
  'Buca Voyages',
  'Central Voyages',
  'Musango',
  'Alliance Voyages',
  'Général Voyages'
]

// Services disponibles dans les bus
export const BUS_SERVICES = {
  wifi: { label: 'WiFi', icon: 'wifi' },
  meals: { label: 'Repas', icon: 'restaurant' },
  ac: { label: 'Climatisation', icon: 'ac-unit' },
  usb: { label: 'Prise USB', icon: 'usb' },
  movies: { label: 'Films', icon: 'movie' },
  reclining: { label: 'Sièges inclinables', icon: 'airline-seat-recline-normal' },
  toilet: { label: 'Toilettes', icon: 'wc' },
  legroom: { label: 'Espace jambes', icon: 'airline-seat-legroom-extra' }
}

// Dimensions et espacements
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
}

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
}
