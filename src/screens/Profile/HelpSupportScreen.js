import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const HelpSupportScreen = ({ navigation }) => {
  // Sections d'aide
  const helpSections = [
    {
      title: 'Réservations',
      icon: 'ticket-outline',
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.contactCard}>
          <Ionicons name="headset-outline" size={32} color={COLORS.primary} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
            <Text style={styles.contactText}>Notre équipe est disponible 7j/7 de 8h à 20h</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => alert('Cette fonctionnalité sera disponible dans une future mise à jour.')}
          >
            <Text style={styles.contactButtonText}>Contacter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        
        {helpSections.map((section, index) => (
          <View key={index} style={styles.helpSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={24} color={COLORS.primary} />
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            </View>
            
            {section.questions.map((question, qIndex) => (
              <TouchableOpacity 
                key={qIndex} 
                style={styles.questionItem}
                onPress={() => handleQuestionPress(section.title, question)}
              >
                <Text style={styles.questionText}>{question}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.darkGrey,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contactButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  helpSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  }
});

export default HelpSupportScreen;