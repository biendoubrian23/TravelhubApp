import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HelpSupportScreen = ({ navigation }) => {
  // Sections d'aide
  const helpSections = [
    {
      title: 'Réservations',
      icon: 'ticket-outline',
      iconColor: '#3B82F6',
      questions: [
        'Comment annuler ma réservation ?',
        'Comment modifier ma réservation ?',
        'Je n\'ai pas reçu ma confirmation de réservation',
        'Comment réserver pour quelqu\'un d\'autre ?'
      ]
    },
    {
      title: 'Paiements',
      icon: 'wallet-outline',
      iconColor: '#10B981',
      questions: [
        'Quels moyens de paiement sont acceptés ?',
        'Je n\'ai pas reçu mon remboursement',
        'Comment obtenir une facture ?',
        'Problèmes avec le paiement mobile'
      ]
    },
    {
      title: 'Compte',
      icon: 'person-outline',
      iconColor: '#6366F1',
      questions: [
        'Comment modifier mes informations personnelles ?',
        'Comment changer mon mot de passe ?',
        'Comment supprimer mon compte ?',
        'Problèmes de connexion'
      ]
    },
    {
      title: 'Voyage',
      icon: 'bus-outline',
      iconColor: '#F59E0B',
      questions: [
        'Quelle est la politique de bagages ?',
        'Horaires de départ et d\'arrivée',
        'Services disponibles à bord',
        'Accessibilité pour personnes à mobilité réduite'
      ]
    },
  ];

  const handleQuestionPress = (section, question) => {
    // Afficher une alerte simple pour simuler l'ouverture d'une réponse
    alert(`${section}: ${question}\n\nUne réponse détaillée sera disponible dans une future mise à jour de l'application.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header avec titre - Repositionné en haut sans le bouton retour */}
      <View style={styles.headerTitle}>
        <Text style={styles.headerText}>Aide & Support</Text>
      </View>
      
      {/* Bouton retour - maintenant repositionné sous le header */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bannière de contact avec dégradé */}
        <LinearGradient
          colors={['rgba(0, 102, 204, 0.8)', 'rgba(0, 102, 204, 0.6)']}
          style={styles.contactBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.contactContent}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="headset" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
              <Text style={styles.contactText}>Notre équipe est disponible 7j/7 de 8h à 20h</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => alert('Cette fonctionnalité sera disponible dans une future mise à jour.')}
          >
            <Text style={styles.contactButtonText}>Contacter</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        
        {helpSections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            {/* En-tête de section avec style amélioré */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${section.iconColor}20` }]}>
                <Ionicons name={section.icon} size={22} color={section.iconColor} />
              </View>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            </View>
            
            {/* Liste des questions avec séparateurs élégants */}
            {section.questions.map((question, qIndex) => (
              <TouchableOpacity 
                key={qIndex} 
                style={[
                  styles.questionItem,
                  qIndex === section.questions.length - 1 ? styles.lastQuestionItem : null
                ]}
                onPress={() => handleQuestionPress(section.title, question)}
              >
                <Text style={styles.questionText}>{question}</Text>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Espace au bas de la page pour un meilleur scrolling */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  // Bouton retour repositionné sous le header
  backButton: {
    position: 'absolute',
    top: 56, // Position sous le header
    left: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  // Nouvelle bannière de contact avec dégradé
  contactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    marginTop: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  contactButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  contactButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 20,
    marginTop: 6,
  },
  // Nouveau style pour les conteneurs de section
  sectionContainer: {
    marginBottom: 25,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingLeft: 6,
  },
  sectionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  // Style amélioré pour les questions
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginLeft: 12,
  },
  lastQuestionItem: {
    borderBottomWidth: 0,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    marginRight: 8,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 60,
  }
});

export default HelpSupportScreen;