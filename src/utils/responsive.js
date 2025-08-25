import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Largeur de référence (iPhone 11/12/13/14)
const BASE_WIDTH = 375;

// Fonction pour adapter la taille de police
export const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  // Limiter l'échelle pour éviter des polices trop grandes ou trop petites
  const minScale = 0.85;
  const maxScale = 1.15;
  
  const limitedScale = Math.max(minScale, Math.min(maxScale, scale));
  return size * limitedScale;
};

// Fonction pour adapter l'espacement
export const scaleSpacing = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return size * Math.max(0.9, Math.min(1.1, scale));
};

// Détection du type d'écran
export const getScreenType = () => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  
  if (SCREEN_WIDTH >= 400) {
    return 'large'; // Samsung S23 Ultra, iPhone Plus, etc.
  } else if (SCREEN_WIDTH >= 360) {
    return 'medium'; // iPhone standard, Samsung S series
  } else {
    return 'small'; // Écrans compacts
  }
};

// Configuration responsive pour les polices
export const responsiveFontSizes = {
  small: {
    tiny: scaleFont(10),
    small: scaleFont(12),
    medium: scaleFont(14),
    large: scaleFont(16),
    xlarge: scaleFont(18),
    xxlarge: scaleFont(20)
  },
  medium: {
    tiny: scaleFont(11),
    small: scaleFont(13),
    medium: scaleFont(15),
    large: scaleFont(17),
    xlarge: scaleFont(19),
    xxlarge: scaleFont(21)
  },
  large: {
    tiny: scaleFont(12),
    small: scaleFont(14),
    medium: scaleFont(16),
    large: scaleFont(18),
    xlarge: scaleFont(20),
    xxlarge: scaleFont(22)
  }
};

// Fonction pour obtenir la taille de police responsive
export const getResponsiveFontSize = (size) => {
  const screenType = getScreenType();
  return responsiveFontSizes[screenType][size] || scaleFont(14);
};
