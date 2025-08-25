/**
 * Utilitaire de journalisation sécurisé pour React Native
 * Évite les erreurs "Text strings must be rendered within a <Text> component"
 */

// Configuration globale pour la journalisation
const config = {
  // Activer/désactiver les journaux en production
  enabled: process.env.NODE_ENV !== 'production',
  // Niveaux de log à afficher (debug, info, warn, error)
  levels: ['info', 'warn', 'error']
};

/**
 * Journalisation sécurisée pour React Native
 * Transforme les objets en chaînes JSON avant l'affichage
 * @param {*} args - Arguments à journaliser
 */
const safeLog = (...args) => {
  if (!config.enabled) return;
  
  try {
    // Convertir les objets complexes en chaînes JSON
    const safeArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return '[Objet non sérialisable]';
        }
      }
      return arg;
    });
    
    console.log(...safeArgs);
  } catch (e) {
    // En cas d'erreur, journaliser un message simple
    console.log('[Log sécurisé: erreur lors de la journalisation]');
  }
};

/**
 * Journalisation de niveau info
 */
const info = (...args) => {
  if (!config.enabled || !config.levels.includes('info')) return;
  safeLog('[INFO]', ...args);
};

/**
 * Journalisation de niveau avertissement
 */
const warn = (...args) => {
  if (!config.enabled || !config.levels.includes('warn')) return;
  console.warn(...args);
};

/**
 * Journalisation de niveau erreur
 */
const error = (...args) => {
  if (!config.enabled || !config.levels.includes('error')) return;
  console.error(...args);
};

/**
 * Journalisation de niveau debug (désactivée en production)
 */
const debug = (...args) => {
  if (!config.enabled || !config.levels.includes('debug')) return;
  safeLog('[DEBUG]', ...args);
};

/**
 * Configuration du logger
 * @param {Object} options - Options de configuration
 */
const configure = (options = {}) => {
  if (options.enabled !== undefined) {
    config.enabled = options.enabled;
  }
  
  if (options.levels) {
    config.levels = options.levels;
  }
};

export const logger = {
  log: safeLog,
  info,
  warn,
  error,
  debug,
  configure
};

export default logger;
