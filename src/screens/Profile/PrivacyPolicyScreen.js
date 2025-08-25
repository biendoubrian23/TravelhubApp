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

const PrivacyPolicyScreen = ({ navigation }) => {
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

  const DataList = ({ items }) => (
    <View style={styles.dataList}>
      {items.map((item, index) => (
        <View key={index} style={styles.dataListItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.dataListText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Dernière mise à jour : 25 août 2025
          </Text>
        </View>

        <Section title="1. Introduction">
          TravelHub s'engage à protéger votre vie privée et vos données personnelles. 
          Cette politique explique comment nous collectons, utilisons, stockons et 
          protégeons vos informations personnelles lorsque vous utilisez notre application.
        </Section>

        <Section title="2. Données collectées">
          <SubSection title="2.1 Informations d'identification">
            Nous collectons les informations suivantes lors de votre inscription :
          </SubSection>
          <DataList items={[
            'Nom et prénom',
            'Adresse email',
            'Numéro de téléphone',
            'Date de naissance',
            'Ville de résidence'
          ]} />

          <SubSection title="2.2 Données de voyage">
            Pour traiter vos réservations, nous collectons :
          </SubSection>
          <DataList items={[
            'Itinéraires de voyage recherchés',
            'Historique des réservations',
            'Préférences de siège',
            'Informations de paiement (cryptées)',
            'Évaluations et commentaires'
          ]} />

          <SubSection title="2.3 Données techniques">
            Notre application collecte automatiquement :
          </SubSection>
          <DataList items={[
            'Adresse IP et localisation approximative',
            'Type d\'appareil et système d\'exploitation',
            'Données d\'utilisation de l\'application',
            'Logs d\'erreurs et de performance',
            'Identifiants publicitaires (si autorisés)'
          ]} />
        </Section>

        <Section title="3. Utilisation des données">
          <SubSection title="3.1 Finalités principales">
            Vos données sont utilisées pour :
          </SubSection>
          <DataList items={[
            'Traiter vos réservations et paiements',
            'Vous envoyer des confirmations et notifications',
            'Améliorer nos services et votre expérience',
            'Assurer la sécurité de la plateforme',
            'Respecter nos obligations légales'
          ]} />

          <SubSection title="3.2 Marketing et communication">
            Avec votre consentement, nous utilisons vos données pour :
          </SubSection>
          <DataList items={[
            'Vous informer des promotions et offres spéciales',
            'Personnaliser les recommandations de voyage',
            'Envoyer des newsletters (désabonnement possible)',
            'Améliorer nos campagnes publicitaires'
          ]} />
        </Section>

        <Section title="4. Partage des données">
          <SubSection title="4.1 Partenaires de transport">
            Nous partageons vos informations de voyage avec les compagnies 
            de bus partenaires uniquement dans le cadre de votre réservation.
          </SubSection>

          <SubSection title="4.2 Prestataires de paiement">
            Les données de paiement sont transmises de manière sécurisée à 
            nos partenaires (Orange Money, MTN Money, Stripe) pour traiter 
            vos transactions.
          </SubSection>

          <SubSection title="4.3 Autorités légales">
            Nous pouvons divulguer vos données si requis par la loi ou pour 
            protéger nos droits, votre sécurité ou celle d'autrui.
          </SubSection>
        </Section>

        <Section title="5. Sécurité des données">
          <SubSection title="5.1 Mesures techniques">
            Nous mettons en place des mesures de sécurité robustes :
          </SubSection>
          <DataList items={[
            'Chiffrement des données sensibles (AES-256)',
            'Connexions sécurisées (HTTPS/TLS)',
            'Authentification à deux facteurs disponible',
            'Surveillance continue des accès',
            'Sauvegardes régulières et sécurisées'
          ]} />

          <SubSection title="5.2 Accès aux données">
            L'accès à vos données est strictement limité aux employés 
            autorisés qui en ont besoin pour fournir nos services.
          </SubSection>
        </Section>

        <Section title="6. Conservation des données">
          <SubSection title="6.1 Durée de conservation">
            Nous conservons vos données personnelles :
          </SubSection>
          <DataList items={[
            'Compte actif : durée d\'utilisation du service',
            'Historique des voyages : 3 ans après le voyage',
            'Données de paiement : selon obligations légales',
            'Logs techniques : maximum 12 mois',
            'Compte supprimé : 30 jours (sauf obligations légales)'
          ]} />
        </Section>

        <Section title="7. Vos droits">
          Conformément à la réglementation, vous disposez des droits suivants :
          <DataList items={[
            'Droit d\'accès : consulter vos données personnelles',
            'Droit de rectification : corriger des informations inexactes',
            'Droit d\'effacement : supprimer vos données',
            'Droit à la portabilité : récupérer vos données',
            'Droit d\'opposition : refuser certains traitements',
            'Droit de retrait du consentement à tout moment'
          ]} />
        </Section>

        <Section title="8. Cookies et technologies similaires">
          <SubSection title="8.1 Types de cookies">
            Notre application utilise :
          </SubSection>
          <DataList items={[
            'Cookies essentiels : fonctionnement de l\'app',
            'Cookies analytiques : mesure d\'audience',
            'Cookies de personnalisation : préférences utilisateur',
            'Cookies publicitaires : avec votre consentement'
          ]} />

          <SubSection title="8.2 Gestion des cookies">
            Vous pouvez gérer vos préférences de cookies dans les paramètres 
            de l'application ou de votre appareil.
          </SubSection>
        </Section>

        <Section title="9. Transferts internationaux">
          Certaines de nos données peuvent être traitées en dehors du Cameroun 
          par nos prestataires techniques. Nous nous assurons que ces transferts 
          respectent les standards de protection appropriés.
        </Section>

        <Section title="10. Mineurs">
          Notre service n'est pas destiné aux personnes de moins de 18 ans. 
          Nous ne collectons pas sciemment de données personnelles de mineurs 
          sans le consentement parental.
        </Section>

        <Section title="11. Modifications de cette politique">
          Nous pouvons modifier cette politique de confidentialité. Les 
          modifications importantes vous seront notifiées par email ou 
          notification push.
        </Section>

        <Section title="12. Contact et réclamations">
          <SubSection title="12.1 Délégué à la protection des données">
            Pour exercer vos droits ou poser des questions :
            • Email : privacy@travelhub.cm
            • Téléphone : +237 6XX XXX XXX
            • Courrier : TravelHub, BP XXX, Douala, Cameroun
          </SubSection>

          <SubSection title="12.2 Autorité de contrôle">
            Vous avez le droit de déposer une plainte auprès de l'autorité 
            de protection des données compétente au Cameroun.
          </SubSection>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Nous nous engageons à traiter vos données personnelles avec le 
            plus grand respect et la plus grande transparence.
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
  dataList: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  dataListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  bullet: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: SPACING.xs,
    marginTop: 1,
  },
  dataListText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
    lineHeight: 18,
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

export default PrivacyPolicyScreen;
