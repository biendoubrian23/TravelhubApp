import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const TermsConditionsScreen = ({ navigation }) => {
  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{children}</Text>
    </View>
  );

  const SubSection = ({ title, children }) => (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <Text style={styles.subSectionContent}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Dernière mise à jour : 25 août 2025
          </Text>
        </View>

        <Section title="1. Acceptation des conditions">
          En utilisant l'application TravelHub, vous acceptez ces conditions d'utilisation. 
          Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
        </Section>

        <Section title="2. Description du service">
          TravelHub est une plateforme de réservation de billets de bus au Cameroun. 
          Nous mettons en relation les voyageurs avec les compagnies de transport agréées 
          pour faciliter la réservation et l'achat de billets de voyage.
        </Section>

        <Section title="3. Inscription et compte utilisateur">
          <SubSection title="3.1 Création de compte">
            Pour utiliser nos services, vous devez créer un compte en fournissant des 
            informations exactes et à jour. Vous êtes responsable de la sécurité de 
            votre mot de passe et de toutes les activités sous votre compte.
          </SubSection>

          <SubSection title="3.2 Âge minimum">
            Vous devez avoir au moins 18 ans pour utiliser TravelHub. Les mineurs 
            peuvent voyager mais les réservations doivent être effectuées par un adulte.
          </SubSection>
        </Section>

        <Section title="4. Réservations et paiements">
          <SubSection title="4.1 Réservations">
            Les réservations sont confirmées sous réserve de disponibilité des places. 
            Nous nous réservons le droit d'annuler une réservation en cas d'indisponibilité.
          </SubSection>

          <SubSection title="4.2 Prix et paiement">
            Les prix affichés incluent toutes les taxes. Le paiement s'effectue via 
            Orange Money, MTN Mobile Money ou carte bancaire. Les tarifs peuvent 
            varier selon la période et la disponibilité.
          </SubSection>

          <SubSection title="4.3 Confirmation">
            Vous recevrez une confirmation par email et/ou SMS après chaque réservation. 
            Ce justificatif est obligatoire pour embarquer.
          </SubSection>
        </Section>

        <Section title="5. Annulations et modifications">
          <SubSection title="5.1 Par le client">
            Les annulations sont possibles jusqu'à 2 heures avant le départ. 
            Des frais d'annulation peuvent s'appliquer selon les conditions 
            de la compagnie de transport.
          </SubSection>

          <SubSection title="5.2 Par la compagnie">
            En cas d'annulation par la compagnie, vous serez remboursé intégralement 
            ou pourrez reporter votre voyage sans frais supplémentaires.
          </SubSection>
        </Section>

        <Section title="6. Responsabilités">
          <SubSection title="6.1 TravelHub">
            Nous agissons en tant qu'intermédiaire entre vous et les compagnies 
            de transport. Nous ne sommes pas responsables des retards, annulations 
            ou incidents durant le voyage.
          </SubSection>

          <SubSection title="6.2 Utilisateur">
            Vous devez vous présenter à l'heure indiquée avec une pièce d'identité 
            valide et votre justificatif de réservation. Le non-respect de ces 
            conditions peut entraîner la perte de votre billet.
          </SubSection>
        </Section>

        <Section title="7. Utilisation acceptable">
          Il est interdit d'utiliser TravelHub pour :
          • Des activités illégales ou frauduleuses
          • Perturber le fonctionnement de la plateforme
          • Copier ou reproduire le contenu sans autorisation
          • Créer de faux comptes ou usurper l'identité d'autrui
        </Section>

        <Section title="8. Propriété intellectuelle">
          Tous les contenus de TravelHub (textes, images, logos, design) sont 
          protégés par les droits d'auteur et appartiennent à TravelHub ou 
          à ses partenaires.
        </Section>

        <Section title="9. Données personnelles">
          Le traitement de vos données personnelles est régi par notre 
          Politique de confidentialité, accessible depuis votre profil.
        </Section>

        <Section title="10. Modifications">
          Nous nous réservons le droit de modifier ces conditions à tout moment. 
          Les modifications prennent effet dès leur publication dans l'application.
        </Section>

        <Section title="11. Droit applicable">
          Ces conditions sont régies par le droit camerounais. Tout litige 
          sera soumis aux tribunaux compétents du Cameroun.
        </Section>

        <Section title="12. Contact">
          Pour toute question concernant ces conditions, contactez-nous :
          • Email : legal@travelhub.cm
          • Téléphone : +237 6XX XXX XXX
          • Adresse : Douala, Cameroun
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En continuant à utiliser TravelHub, vous confirmez avoir lu et 
            accepté ces conditions d'utilisation.
          </Text>
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
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  lastUpdated: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.md,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  subSection: {
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subSectionContent: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TermsConditionsScreen;
