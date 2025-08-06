# TravelHub - Application de Réservation de Bus au Cameroun

TravelHub est une application mobile React Native développée avec Expo pour faciliter la réservation de trajets en bus au Cameroun. L'application s'inspire du design SNCF Connect pour offrir une expérience utilisateur moderne et intuitive.

## 🚀 Fonctionnalités

### Pour les Voyageurs
- **Recherche de trajets** : Recherche par ville de départ, arrivée et date
- **Filtrage** : Trajets classiques ou VIP avec services inclus
- **Détails complets** : Horaires, services, prix, timeline du trajet
- **Réservation** : Sélection de places et paiement sécurisé
- **Authentification** : Inscription/connexion avec email ou Google
- **Historique** : Consultation des trajets précédents

### Pour les Agences
- **Dashboard dédié** : Interface de gestion des trajets
- **Gestion des prix** : Prix dynamiques par jour
- **Services** : Configuration des services disponibles
- **Statistiques** : Suivi des réservations

## 🛠 Technologies Utilisées

- **React Native** avec Expo
- **Supabase** pour l'authentification et la base de données
- **React Navigation** pour la navigation
- **Zustand** pour la gestion d'état
- **React Native Paper** pour les composants UI
- **Stripe** pour les paiements (à configurer)
- **Orange Money** pour les paiements mobiles (à configurer)

## 📁 Structure du Projet

```
src/
├── assets/              # Images, logos, icônes
├── components/          # Composants réutilisables
│   ├── Button.js
│   ├── Input.js
│   ├── TripCard.js
│   └── index.js
├── navigation/          # Configuration de navigation
│   └── AppNavigator.js
├── screens/             # Écrans de l'application
│   ├── Auth/            # Connexion, inscription
│   ├── Home/            # Recherche de trajets
│   ├── Results/         # Résultats de recherche
│   ├── Details/         # Détails du trajet
│   ├── SeatSelection/   # Sélection de places
│   ├── Recap/           # Récapitulatif et paiement
│   ├── AgencyDashboard/ # Interface agences
│   └── Profile/         # Profil utilisateur
├── services/            # Services API
│   └── supabase.js
├── store/               # Gestion d'état Zustand
│   └── index.js
├── utils/               # Fonctions utilitaires
│   └── index.js
└── constants/           # Constantes et configuration
    └── index.js
```

## 🚦 Installation et Lancement

### Prérequis
- Node.js (version 16 ou plus)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Smartphone avec l'app Expo Go ou émulateur

### Installation
```bash
# Cloner le projet
git clone [url-du-repo]
cd travelhub-app

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

### Configuration
1. Créer un compte Supabase si nécessaire
2. Configurer les variables d'environnement dans `.env`
3. Configurer les clés API pour Stripe et Orange Money

## 🎨 Design

L'application s'inspire du design SNCF Connect avec :
- **Interface épurée** et professionnelle
- **Navigation intuitive** avec tabs et stack navigators
- **Couleurs sobres** adaptées au contexte camerounais
- **Timeline verticale** pour les détails de trajet
- **Cards modernes** pour l'affichage des trajets
- **Design mobile-first** optimisé pour smartphones

## 🗄 Base de Données

Structure Supabase :
- **users** : Informations utilisateurs
- **agencies** : Données des agences de transport
- **trips** : Trajets disponibles
- **trip_services** : Services par trajet
- **bookings** : Réservations
- **seat_maps** : Configuration des sièges

## 🚌 Villes Supportées

- Douala
- Yaoundé
- Bafoussam
- Garoua
- Bamenda
- Ngaoundéré
- Bertoua
- Kribi
- Limbe
- Buea
- Dschang
- Foumban
- Maroua
- Ebolowa
- Edéa

## 💳 Paiements

- **Stripe** : Cartes bancaires internationales
- **Orange Money** : Portefeuille mobile populaire au Cameroun
- **Paiement sécurisé** avec confirmation par SMS

## 🔒 Sécurité

- Authentification sécurisée via Supabase
- Données chiffrées en transit et au repos
- Validation côté client et serveur
- Protection contre les injections SQL

## 📱 Fonctionnalités Futures

- [ ] Notifications push pour les rappels
- [ ] Chat support client
- [ ] Programme de fidélité
- [ ] Géolocalisation des gares
- [ ] Mode hors ligne
- [ ] Support multilingue (français/anglais)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- Email : support@travelhub.cm
- Téléphone : +237 XXX XXX XXX

---

**TravelHub** - Voyagez facilement au Cameroun 🇨🇲
