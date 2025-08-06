import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animations pour le bus
  const busPosition = useRef(new Animated.Value(-120)).current;
  const busRotation = useRef(new Animated.Value(0)).current;
  const busScale = useRef(new Animated.Value(0.8)).current;
  const busBounce = useRef(new Animated.Value(0)).current;
  
  // Animations pour l'environnement
  const roadOpacity = useRef(new Animated.Value(0)).current;
  const roadMarkings = useRef(new Animated.Value(0)).current;
  const cloudPosition1 = useRef(new Animated.Value(-50)).current;
  const cloudPosition2 = useRef(new Animated.Value(-100)).current;
  const cloudPosition3 = useRef(new Animated.Value(-30)).current;
  const sunRotation = useRef(new Animated.Value(0)).current;
  
  // Animations pour le logo et texte
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;
  
  // Animations pour les particules
  const particle1Y = useRef(new Animated.Value(height)).current;
  const particle2Y = useRef(new Animated.Value(height)).current;
  const particle3Y = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Animation du soleil qui tourne en continu
    Animated.loop(
      Animated.timing(sunRotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animation des nuages qui bougent lentement
    Animated.loop(
      Animated.parallel([
        Animated.timing(cloudPosition1, {
          toValue: width + 50,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(cloudPosition2, {
          toValue: width + 100,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(cloudPosition3, {
          toValue: width + 30,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Séquence principale d'animation
    Animated.sequence([
      // 1. Apparition de la route avec effet de dessin
      Animated.parallel([
        Animated.timing(roadOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(roadMarkings, {
          toValue: 1,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),

      // 2. Entrée spectaculaire du bus
      Animated.parallel([
        // Mouvement principal du bus
        Animated.timing(busPosition, {
          toValue: width * 0.4,
          duration: 2500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        // Légère rotation du bus pendant le mouvement
        Animated.sequence([
          Animated.timing(busRotation, {
            toValue: 0.05,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(busRotation, {
            toValue: -0.02,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(busRotation, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        // Scale du bus pour effet d'accélération
        Animated.sequence([
          Animated.timing(busScale, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(busScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // 3. Effet de rebond du bus
      Animated.sequence([
        Animated.timing(busBounce, {
          toValue: -8,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(busBounce, {
          toValue: 0,
          duration: 300,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation des particules de poussière
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(particlesOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.stagger(200, [
          Animated.timing(particle1Y, {
            toValue: -50,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(particle2Y, {
            toValue: -30,
            duration: 1800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(particle3Y, {
            toValue: -40,
            duration: 1900,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 1500);

    // Animation du logo et titre - entrée spectaculaire
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    // Animation finale - sortie du bus
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(busPosition, {
          toValue: width + 100,
          duration: 1500,
          easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
          useNativeDriver: true,
        }),
        Animated.timing(busScale, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4000);

    // Navigation directe vers l'écran de connexion client
    setTimeout(() => {
      navigation.replace('Login', { userType: 'client' });
    }, 5800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Dégradé de fond avec ciel */}
      <LinearGradient
        colors={['#87CEEB', '#98E4FF', '#E0F6FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Soleil animé */}
      <Animated.View 
        style={[
          styles.sun,
          {
            transform: [
              {
                rotate: sunRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.sunGradient}
        />
      </Animated.View>

      {/* Nuages animés */}
      <Animated.View style={[styles.cloud, styles.cloud1, { transform: [{ translateX: cloudPosition1 }] }]}>
        <View style={styles.cloudShape}>
          <View style={[styles.cloudPart, styles.cloudPart1]} />
          <View style={[styles.cloudPart, styles.cloudPart2]} />
          <View style={[styles.cloudPart, styles.cloudPart3]} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.cloud, styles.cloud2, { transform: [{ translateX: cloudPosition2 }] }]}>
        <View style={styles.cloudShape}>
          <View style={[styles.cloudPart, styles.cloudPart1]} />
          <View style={[styles.cloudPart, styles.cloudPart2]} />
          <View style={[styles.cloudPart, styles.cloudPart3]} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.cloud, styles.cloud3, { transform: [{ translateX: cloudPosition3 }] }]}>
        <View style={styles.cloudShape}>
          <View style={[styles.cloudPart, styles.cloudPart1]} />
          <View style={[styles.cloudPart, styles.cloudPart2]} />
        </View>
      </Animated.View>

      {/* Route améliorée avec marquages */}
      <Animated.View style={[styles.road, { opacity: roadOpacity }]}>
        <LinearGradient
          colors={['#444444', '#666666', '#444444']}
          style={styles.roadSurface}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        {/* Marquages routiers animés */}
        <Animated.View style={[styles.roadMarkings, { opacity: roadMarkings }]}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.roadLine, { left: i * 60 }]} />
          ))}
        </Animated.View>
      </Animated.View>

      {/* Bus avec effets avancés */}
      <Animated.View 
        style={[
          styles.busContainer,
          {
            transform: [
              { translateX: busPosition },
              { translateY: busBounce },
              { scale: busScale },
              { rotate: busRotation.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-5deg', '5deg'],
              })},
            ]
          }
        ]}
      >
        {/* Ombre du bus */}
        <View style={styles.busShadow} />
        
        {/* Corps du bus avec dégradé */}
        <LinearGradient
          colors={['#FF6B35', '#FF8A00', '#FFB347']}
          style={styles.busBody}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="bus" size={50} color={COLORS.white} />
        </LinearGradient>

        {/* Roues avec rotation */}
        <View style={styles.busWheels}>
          <View style={styles.wheel} />
          <View style={styles.wheel} />
        </View>
      </Animated.View>

      {/* Particules de poussière */}
      <Animated.View style={[styles.particles, { opacity: particlesOpacity }]}>
        <Animated.View style={[styles.particle, { transform: [{ translateY: particle1Y }] }]} />
        <Animated.View style={[styles.particle, { transform: [{ translateY: particle2Y }], left: width * 0.45 }]} />
        <Animated.View style={[styles.particle, { transform: [{ translateY: particle3Y }], left: width * 0.5 }]} />
      </Animated.View>

      {/* Logo et titre avec effets */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoCircle, { opacity: logoOpacity }]}>
          <LinearGradient
            colors={['#ffffff', '#f0f0f0']}
            style={styles.logoGradient}
          >
            <Ionicons name="location" size={40} color={COLORS.primary} />
          </LinearGradient>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.titleContainer, 
            { 
              opacity: titleOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <Text style={styles.title}>TravelHub</Text>
          <Text style={styles.subtitle}>Votre voyage commence ici</Text>
        </Animated.View>
      </View>

      {/* Points de chargement animés */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, { animationDelay: '0.2s' }]} />
        <View style={[styles.loadingDot, { animationDelay: '0.4s' }]} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Soleil
  sun: {
    position: 'absolute',
    top: 60,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  sunGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  // Nuages
  cloud: {
    position: 'absolute',
    opacity: 0.8,
  },
  cloud1: {
    top: 80,
    transform: [{ scale: 1 }],
  },
  cloud2: {
    top: 120,
    transform: [{ scale: 0.7 }],
  },
  cloud3: {
    top: 100,
    transform: [{ scale: 0.9 }],
  },
  cloudShape: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cloudPart: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
  },
  cloudPart1: {
    width: 30,
    height: 30,
  },
  cloudPart2: {
    width: 40,
    height: 35,
    marginLeft: -10,
  },
  cloudPart3: {
    width: 25,
    height: 25,
    marginLeft: -8,
  },

  // Route améliorée
  road: {
    position: 'absolute',
    bottom: height * 0.35,
    left: 0,
    right: 0,
    height: 20,
  },
  roadSurface: {
    width: '100%',
    height: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333333',
  },
  roadMarkings: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  roadLine: {
    position: 'absolute',
    width: 30,
    height: 4,
    backgroundColor: '#FFFF00',
    borderRadius: 2,
  },

  // Bus amélioré
  busContainer: {
    position: 'absolute',
    bottom: height * 0.35 + 15,
    zIndex: 10,
    alignItems: 'center',
  },
  busShadow: {
    position: 'absolute',
    bottom: -10,
    width: 60,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 30,
    transform: [{ scaleX: 1.2 }],
  },
  busBody: {
    width: 70,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  busWheels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: -8,
    width: 50,
    paddingHorizontal: 5,
  },
  wheel: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#666666',
  },

  // Particules
  particles: {
    position: 'absolute',
    bottom: height * 0.35 - 10,
  },
  particle: {
    position: 'absolute',
    left: width * 0.42,
    width: 3,
    height: 3,
    backgroundColor: '#D2B48C',
    borderRadius: 1.5,
    opacity: 0.6,
  },

  // Logo et titre
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    zIndex: 5,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.95,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Points de chargement
  loadingContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    opacity: 0.7,
  },
});

export default SplashScreen;
