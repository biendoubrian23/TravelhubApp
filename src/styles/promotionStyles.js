import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Constantes de design inspirées d'Apple
const DESIGN_CONSTANTS = {
  // Espacements
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Rayons de bordure
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 9999,
  },
  
  // Ombres
  shadows: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Typographie
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    body: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '500',
      opacity: 0.8,
    },
  },
};

// Dégradés prédéfinis
export const GRADIENTS = {
  primary: ['#667eea', '#764ba2'],
  secondary: ['#f093fb', '#f5576c'],
  tertiary: ['#4facfe', '#00f2fe'],
  accent: ['#fa709a', '#fee140'],
  success: ['#56ab2f', '#a8e6cf'],
  warning: ['#f7971e', '#ffd200'],
  error: ['#ff416c', '#ff4b2b'],
  neutral: ['#bdc3c7', '#2c3e50'],
  
  // Dégradés spéciaux
  sunset: ['#ff9a9e', '#fecfef', '#fecfef'],
  ocean: ['#2196F3', '#21CBF3'],
  forest: ['#134E5E', '#71B280'],
  cosmic: ['#654ea3', '#eaafc8'],
  aurora: ['#00c9ff', '#92fe9d'],
};

// Animations prédéfinies
export const ANIMATIONS = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  timing: {
    duration: 300,
    useNativeDriver: true,
  },
  bounce: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// Styles pour les composants de promotion
export const promotionComponentStyles = StyleSheet.create({
  // Container principal
  promotionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  
  // Header avec dégradé
  promotionHeader: {
    paddingHorizontal: DESIGN_CONSTANTS.spacing.lg,
    paddingVertical: DESIGN_CONSTANTS.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : DESIGN_CONSTANTS.spacing.xl,
  },
  
  // Card de promotion principale
  promotionMainCard: {
    width: width * 0.85,
    height: 180,
    borderRadius: DESIGN_CONSTANTS.borderRadius.xxl,
    overflow: 'hidden',
    ...DESIGN_CONSTANTS.shadows.strong,
    marginHorizontal: DESIGN_CONSTANTS.spacing.sm,
  },
  
  // Gradient overlay pour les cards
  promotionGradientOverlay: {
    flex: 1,
    padding: DESIGN_CONSTANTS.spacing.lg,
    justifyContent: 'space-between',
  },
  
  // Badge de promotion
  promotionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DESIGN_CONSTANTS.spacing.md,
    paddingVertical: DESIGN_CONSTANTS.spacing.xs,
    borderRadius: DESIGN_CONSTANTS.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  // Texte du badge
  promotionBadgeText: {
    ...DESIGN_CONSTANTS.typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // Titre de promotion
  promotionTitle: {
    ...DESIGN_CONSTANTS.typography.title,
    fontSize: 24,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Description de promotion
  promotionDescription: {
    ...DESIGN_CONSTANTS.typography.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginVertical: DESIGN_CONSTANTS.spacing.sm,
  },
  
  // Discount badge
  promotionDiscount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -1,
  },
  
  // Bouton d'action
  promotionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: DESIGN_CONSTANTS.spacing.lg,
    paddingVertical: DESIGN_CONSTANTS.spacing.sm,
    borderRadius: DESIGN_CONSTANTS.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  
  // Texte du bouton d'action
  promotionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: DESIGN_CONSTANTS.spacing.xs,
  },
  
  // Container des dots
  promotionDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: DESIGN_CONSTANTS.spacing.lg,
    paddingHorizontal: DESIGN_CONSTANTS.spacing.lg,
  },
  
  // Dot individuel
  promotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  
  // Dot actif
  promotionActiveDot: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.2 }],
  },
  
  // Card de fidélité
  fidelityCard: {
    borderRadius: DESIGN_CONSTANTS.borderRadius.lg,
    overflow: 'hidden',
    ...DESIGN_CONSTANTS.shadows.medium,
    marginBottom: DESIGN_CONSTANTS.spacing.md,
  },
  
  // Container de progression
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DESIGN_CONSTANTS.spacing.md,
  },
  
  // Barre de progression
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: DESIGN_CONSTANTS.spacing.sm,
  },
  
  // Remplissage de la barre de progression
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Texte de progression
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Grid des offres spéciales
  specialOffersGrid: {
    gap: DESIGN_CONSTANTS.spacing.md,
  },
  
  // Card d'offre spéciale
  specialOfferCard: {
    borderRadius: DESIGN_CONSTANTS.borderRadius.lg,
    overflow: 'hidden',
    ...DESIGN_CONSTANTS.shadows.light,
  },
  
  // Container d'icône spéciale
  specialOfferIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DESIGN_CONSTANTS.spacing.md,
  },
  
  // Container de code promo
  promoCodeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: DESIGN_CONSTANTS.spacing.md,
    paddingVertical: DESIGN_CONSTANTS.spacing.xs,
    borderRadius: DESIGN_CONSTANTS.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Texte du code promo
  promoCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  
  // Container des tabs
  tabsContainer: {
    backgroundColor: '#fff',
    paddingTop: DESIGN_CONSTANTS.spacing.md,
    ...DESIGN_CONSTANTS.shadows.light,
  },
  
  // Tab individuel
  tab: {
    paddingHorizontal: DESIGN_CONSTANTS.spacing.lg,
    paddingVertical: DESIGN_CONSTANTS.spacing.md,
    marginRight: DESIGN_CONSTANTS.spacing.md,
    borderRadius: DESIGN_CONSTANTS.borderRadius.lg,
    backgroundColor: '#f1f3f4',
  },
  
  // Tab actif
  activeTab: {
    backgroundColor: '#667eea',
  },
  
  // Texte du tab
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  
  // Texte du tab actif
  activeTabText: {
    color: '#fff',
  },
  
  // Effet de brillance
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    borderRadius: DESIGN_CONSTANTS.borderRadius.xxl,
  },
  
  // Container de contenu principal
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  
  // Section title
  sectionTitle: {
    ...DESIGN_CONSTANTS.typography.subtitle,
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: DESIGN_CONSTANTS.spacing.lg,
  },
  
  // Espace en bas
  bottomSpace: {
    height: 120,
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    padding: DESIGN_CONSTANTS.spacing.xl,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    padding: DESIGN_CONSTANTS.spacing.xl,
  },
});

export { DESIGN_CONSTANTS };
export default promotionComponentStyles;
