// 🎯 Données des promotions centralisées
export const mainPromotions = [
  {
    id: 1,
    title: "Premier trajet à -50%",
    subtitle: "Découvrez TravelHub",
    description: "Votre première réservation bénéficie d'une réduction de 50%. Parfait pour découvrir nos services premium.",
    gradient: ['#FF6B6B', '#4ECDC4'],
    icon: 'rocket-outline',
    badge: 'NOUVEAU CLIENT',
    savings: 'Jusqu\'à 3,290 FCFA',
    ctaText: 'Première réservation',
    type: 'first_booking',
    conditions: 'Valable pour les nouveaux clients uniquement',
    validUntil: '2025-12-31',
  },
  {
    id: 2,
    title: "Réservation anticipée",
    subtitle: "Jusqu'à -30%",
    description: "Plus vous réservez tôt, plus vous économisez. Planifiez votre voyage et profitez de tarifs avantageux.",
    gradient: ['#667eea', '#764ba2'],
    icon: 'calendar-outline',
    badge: 'PLANIFICATION',
    savings: 'Jusqu\'à 1,974 FCFA',
    ctaText: 'Réserver en avance',
    type: 'early_booking',
    conditions: 'Réservation 7 jours à l\'avance minimum',
    discountSchedule: [
      { days: 7, discount: 10 },
      { days: 14, discount: 20 },
      { days: 30, discount: 30 },
    ],
  },
  {
    id: 3,
    title: "Happy Hour Digital",
    subtitle: "22h - 6h sur l'app",
    description: "Profitez de prix exclusifs lors de vos réservations nocturnes. Des tarifs réduits pour les lève-tôt et couche-tard.",
    gradient: ['#f093fb', '#f5576c'],
    icon: 'moon-outline',
    badge: 'EXCLUSIF APP',
    savings: 'Jusqu\'à 25% de remise',
    ctaText: 'Réserver maintenant',
    type: 'happy_hour',
    conditions: 'Réservations effectuées entre 22h et 6h',
    timeRange: { start: 22, end: 6 },
    discount: 25,
  },
  {
    id: 4,
    title: "Offre Aller-Retour",
    subtitle: "Économisez en planifiant",
    description: "Réservez votre aller et retour en même temps et bénéficiez d'une réduction automatique sur le trajet de retour.",
    gradient: ['#a8edea', '#fed6e3'],
    icon: 'swap-horizontal-outline',
    badge: 'PLANIFICATION',
    savings: 'Jusqu\'à 15% sur le retour',
    ctaText: 'Réserver A/R',
    type: 'round_trip',
    conditions: 'Valable sur les trajets aller-retour',
    discount: 15,
  },
];

export const fidelityPrograms = [
  {
    id: 1,
    title: "Programme Fidélité",
    description: "10 trajets = 1 offert",
    icon: 'trophy-outline',
    color: '#FFD700',
    progress: 7,
    maxProgress: 10,
    type: 'loyalty_program',
    benefits: [
      'Trajet gratuit après 10 voyages',
      'Points de fidélité cumulables',
      'Accès prioritaire aux promotions',
    ],
  },
  {
    id: 2,
    title: "Parrainage",
    description: "Vous et votre filleul gagnez 10%",
    icon: 'people-outline',
    color: '#FF6B6B',
    reward: '+10%',
    type: 'referral',
    benefits: [
      '10% de réduction pour le parrain',
      '10% de réduction pour le filleul',
      'Récompenses illimitées',
    ],
  },
  {
    id: 3,
    title: "Tarif Famille",
    description: "4 personnes = -25%",
    icon: 'home-outline',
    color: '#4ECDC4',
    discount: '-25%',
    type: 'family_discount',
    conditions: 'Minimum 4 personnes dans la même réservation',
    minPersons: 4,
    discountPercent: 25,
  },
  {
    id: 4,
    title: "Tarif Étudiant",
    description: "Avec carte étudiant -20%",
    icon: 'school-outline',
    color: '#9B59B6',
    discount: '-20%',
    type: 'student_discount',
    conditions: 'Présentation de la carte étudiant obligatoire',
    discountPercent: 20,
    verification: 'student_card_required',
  },
];

export const specialOffers = [
  {
    id: 1,
    title: "Offre Anniversaire",
    description: "Réduction spéciale le jour J",
    icon: 'gift-outline',
    gradient: ['#ff9a9e', '#fecfef'],
    badge: 'PERSO',
    type: 'birthday_offer',
    discount: 30,
    conditions: 'Valable le jour de votre anniversaire uniquement',
  },
  {
    id: 2,
    title: "Weekend Express",
    description: "Offres week-end",
    icon: 'car-sport-outline',
    gradient: ['#ffecd2', '#fcb69f'],
    badge: 'W-E',
    type: 'weekend_offer',
    discount: 15,
    conditions: 'Valable les vendredis, samedis et dimanches',
    validDays: [5, 6, 0], // Vendredi, Samedi, Dimanche
  },
  {
    id: 3,
    title: "Flash Sale",
    description: "Promotions éclair",
    icon: 'flash-outline',
    gradient: ['#FF512F', '#F09819'],
    badge: 'FLASH',
    type: 'flash_sale',
    discount: 40,
    conditions: 'Offres limitées dans le temps',
    timeLimit: '2h',
  },
  {
    id: 4,
    title: "Groupe VIP",
    description: "Voyagez ensemble",
    icon: 'people-circle-outline',
    gradient: ['#654ea3', '#eaafc8'],
    badge: 'VIP',
    type: 'group_discount',
    discount: 20,
    conditions: 'Minimum 6 personnes',
    minPersons: 6,
  },
];

export const howItWorksSteps = [
  {
    id: 1,
    number: "1",
    title: "Réservez",
    description: "Sélectionnez votre trajet et appliquez automatiquement vos promotions disponibles",
    icon: 'search-outline',
  },
  {
    id: 2,
    number: "2",
    title: "Économisez",
    description: "Bénéficiez immédiatement de votre réduction sur le prix final affiché",
    icon: 'wallet-outline',
  },
  {
    id: 3,
    number: "3",
    title: "Cumulez",
    description: "Plus vous voyagez, plus vous débloquez d'avantages exclusifs et de récompenses",
    icon: 'trophy-outline',
  },
];

// 🎨 Couleurs et thèmes pour les promotions
export const promotionThemes = {
  primary: {
    gradient: ['#667eea', '#764ba2'],
    color: '#667eea',
  },
  success: {
    gradient: ['#4ECDC4', '#44A08D'],
    color: '#4ECDC4',
  },
  warning: {
    gradient: ['#f093fb', '#f5576c'],
    color: '#f093fb',
  },
  info: {
    gradient: ['#a8edea', '#fed6e3'],
    color: '#a8edea',
  },
  special: {
    gradient: ['#FF6B6B', '#4ECDC4'],
    color: '#FF6B6B',
  },
};

// 🎯 Fonctions utilitaires pour les promotions
export const getActivePromotions = () => {
  const now = new Date();
  return mainPromotions.filter(promo => {
    if (promo.validUntil) {
      return new Date(promo.validUntil) > now;
    }
    return true;
  });
};

export const getAvailableDiscounts = (userProfile) => {
  const discounts = [];
  
  // Vérifier les conditions spécifiques
  if (userProfile?.isFirstBooking) {
    discounts.push(mainPromotions.find(p => p.type === 'first_booking'));
  }
  
  if (userProfile?.isStudent) {
    discounts.push(fidelityPrograms.find(p => p.type === 'student_discount'));
  }
  
  // Vérifier Happy Hour
  const hour = now.getHours();
  const happyHour = mainPromotions.find(p => p.type === 'happy_hour');
  if (hour >= happyHour.timeRange.start || hour < happyHour.timeRange.end) {
    discounts.push(happyHour);
  }
  
  return discounts.filter(Boolean);
};

export const calculateDiscount = (originalPrice, promotionType, conditions = {}) => {
  switch (promotionType) {
    case 'first_booking':
      return originalPrice * 0.5;
    case 'early_booking':
      const days = conditions.daysInAdvance || 0;
      const schedule = mainPromotions.find(p => p.type === 'early_booking')?.discountSchedule || [];
      const applicableDiscount = schedule
        .reverse()
        .find(s => days >= s.days);
      return applicableDiscount ? originalPrice * (applicableDiscount.discount / 100) : 0;
    case 'happy_hour':
      return originalPrice * 0.25;
    case 'student_discount':
      return originalPrice * 0.2;
    case 'family_discount':
      return conditions.personCount >= 4 ? originalPrice * 0.25 : 0;
    default:
      return 0;
  }
};
