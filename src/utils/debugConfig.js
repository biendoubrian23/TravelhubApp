/**
 * Configuration centralisée pour les logs de debug
 * Permet d'activer/désactiver facilement les logs par catégorie
 */

const DEBUG_CONFIG = {
  // Logs généraux de l'application
  app: false,
  
  // Logs de navigation et de rendu des composants
  navigation: false,
  
  // Logs des services métier
  booking: false,
  payment: false,
  balance: false,
  notifications: false,
  
  // Logs de transformation de données
  dataTransformation: false,
  
  // Logs de performance
  performance: true,
  
  // Logs d'erreurs (toujours activés)
  errors: true,
  
  // Mode développement global
  isDev: __DEV__
};

/**
 * Logger conditionnel basé sur la configuration
 */
export const debugLog = {
  app: (message, ...args) => {
    if (DEBUG_CONFIG.app && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  navigation: (message, ...args) => {
    if (DEBUG_CONFIG.navigation && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  booking: (message, ...args) => {
    if (DEBUG_CONFIG.booking && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  payment: (message, ...args) => {
    if (DEBUG_CONFIG.payment && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  balance: (message, ...args) => {
    if (DEBUG_CONFIG.balance && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  notifications: (message, ...args) => {
    if (DEBUG_CONFIG.notifications && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  dataTransformation: (message, ...args) => {
    if (DEBUG_CONFIG.dataTransformation && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  performance: (message, ...args) => {
    if (DEBUG_CONFIG.performance && DEBUG_CONFIG.isDev) {
      console.log(message, ...args);
    }
  },
  
  error: (message, ...args) => {
    if (DEBUG_CONFIG.errors) {
      console.error(message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (DEBUG_CONFIG.errors) {
      console.warn(message, ...args);
    }
  }
};

/**
 * Utilitaire pour activer tous les logs (mode debug complet)
 */
export const enableAllLogs = () => {
  Object.keys(DEBUG_CONFIG).forEach(key => {
    if (key !== 'isDev') {
      DEBUG_CONFIG[key] = true;
    }
  });
};

/**
 * Utilitaire pour désactiver tous les logs sauf les erreurs
 */
export const disableAllLogs = () => {
  Object.keys(DEBUG_CONFIG).forEach(key => {
    if (key !== 'isDev' && key !== 'errors') {
      DEBUG_CONFIG[key] = false;
    }
  });
};

/**
 * Configuration pour les logs de production
 */
export const setProductionMode = () => {
  DEBUG_CONFIG.isDev = false;
  disableAllLogs();
  DEBUG_CONFIG.errors = true;
  DEBUG_CONFIG.performance = false;
};

export default DEBUG_CONFIG;
