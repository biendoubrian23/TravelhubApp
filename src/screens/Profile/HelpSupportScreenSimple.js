import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const HelpSupportScreen = ({ navigation }) => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'Comment réserver un voyage ?',
      answer: 'Pour réserver un voyage, utilisez notre moteur de recherche en sélectionnant votre ville de départ, votre destination, et la date souhaitée. Choisissez ensuite votre siège et procédez au paiement.'
    },
    {
      id: 2,
      question: 'Quels sont les moyens de paiement acceptés ?',
      answer: 'Nous acceptons Orange Money, MTN Mobile Money, et les cartes bancaires. Tous les paiements sont sécurisés et cryptés.'
    },
    {
      id: 3,
      question: 'Puis-je annuler ma réservation ?',
      answer: 'Vous pouvez annuler votre réservation jusqu\'à 2 heures avant le départ. Des frais d\'annulation peuvent s\'appliquer selon les conditions de l\'agence.'
    },
    {
      id: 4,
      question: 'Que faire en cas de retard du bus ?',
      answer: 'En cas de retard, vous recevrez une notification automatique. Vous pouvez également contacter directement l\'agence via l\'application.'
    },
    {
      id: 5,
      question: 'Comment modifier ma réservation ?',
      answer: 'Contactez notre service client ou l\'agence directement. Les modifications sont soumises à disponibilité et peuvent entraîner des frais supplémentaires.'
    }
  ];

  const contactMethods = [
    {
      icon: 'call',
      title: 'Téléphone',
      subtitle: '+237 6XX XXX XXX',
      action: () => Linking.openURL('tel:+237600000000'),
      color: COLORS.success
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      subtitle: 'Chat en direct',
      action: () => Linking.openURL('whatsapp://send?phone=237600000000&text=Bonjour, j\'ai besoin d\'aide'),
      color: '#25D366'
    },
    {
      icon: 'mail',
      title: 'Email',
      subtitle: 'support@travelhub.cm',
      action: () => Linking.openURL('mailto:support@travelhub.cm?subject=Support TravelHub'),
      color: COLORS.primary
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const FaqItem = ({ item }) => (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => toggleFaq(item.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons
          name={expandedFaq === item.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.primary}
        />
      </View>
      
      {expandedFaq === item.id && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  const ContactMethod = ({ method }) => (
    <TouchableOpacity
      style={styles.contactMethod}
      onPress={method.action}
    >
      <View style={[styles.contactIcon, { backgroundColor: method.color + '20' }]}>
        <Ionicons name={method.icon} size={24} color={method.color} />
      </View>
      
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{method.title}</Text>
        <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Section Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          <Text style={styles.sectionSubtitle}>
            Notre équipe est disponible 24h/24 pour vous aider
          </Text>
          
          {contactMethods.map((method, index) => (
            <ContactMethod key={index} method={method} />
          ))}
        </View>

        {/* Section FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          <Text style={styles.sectionSubtitle}>
            Trouvez rapidement des réponses à vos questions
          </Text>
          
          {faqData.map((item) => (
            <FaqItem key={item.id} item={item} />
          ))}
        </View>

        {/* Section Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guides et tutoriels</Text>
          
          <TouchableOpacity style={styles.guideItem}>
            <Ionicons name="play-circle" size={20} color={COLORS.primary} />
            <Text style={styles.guideText}>Comment réserver votre premier voyage</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.guideItem}>
            <Ionicons name="card" size={20} color={COLORS.primary} />
            <Text style={styles.guideText}>Guide des paiements mobiles</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.guideItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.guideText}>Sécurité et confidentialité</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Section Problèmes techniques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problèmes techniques</Text>
          
          <TouchableOpacity 
            style={styles.technicalItem}
            onPress={() => Alert.alert('Signalement', 'Cette fonctionnalité sera bientôt disponible')}
          >
            <Ionicons name="bug" size={20} color={COLORS.error} />
            <Text style={styles.technicalText}>Signaler un bug</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.technicalItem}
            onPress={() => Alert.alert('Suggestion', 'Cette fonctionnalité sera bientôt disponible')}
          >
            <Ionicons name="bulb" size={20} color={COLORS.warning} />
            <Text style={styles.technicalText}>Suggérer une amélioration</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    lineHeight: 20,
  },
  
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  contactContent: {
    flex: 1,
  },
  
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  contactSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  faqItem: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  
  faqAnswer: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  guideText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
    flex: 1,
  },
  
  technicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  
  technicalText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
  },
});

export default HelpSupportScreen;
