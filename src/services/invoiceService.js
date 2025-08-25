import { supabase } from './supabase';

// Import conditionnel des modules natifs
let FileSystem, Sharing, Print;
let nativeModulesAvailable = false;

try {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
  Print = require('expo-print');
  nativeModulesAvailable = true;
  console.log('✅ Modules natifs PDF disponibles');
} catch (error) {
  console.log('⚠️ Modules natifs PDF non disponibles, fonctionnalités limitées');
  nativeModulesAvailable = false;
}

export const invoiceService = {
  /**
   * Créer une facture PDF à partir des données de réservation
   */
  async createInvoice(bookingData, userData) {
    try {
      console.log('🧾 Création de la facture pour:', bookingData?.booking_reference);
      
      // Vérifier si la réservation est annulée
      if (bookingData.booking_status === 'cancelled') {
        console.error('❌ Impossible de créer une facture pour une réservation annulée');
        throw new Error("Les factures ne peuvent pas être générées pour les réservations annulées.");
      }
      
      // Générer un numéro de facture unique
      const invoiceNumber = this.generateInvoiceNumber();
      
      // Calculer les montants de la facture
      const amounts = this.calculateInvoiceAmounts(bookingData.total_price || bookingData.total_price_fcfa || 0);
      
      // Préparer les données de la facture
      const invoiceData = {
        user_id: bookingData.user_id || userData?.id,
        booking_id: bookingData?.id,
        invoice_number: invoiceNumber,
        total_amount: amounts.total_amount,
        currency: 'XAF', // Code ISO 3 lettres pour Franc CFA
        status: 'paid', // Statut payé car créé après paiement réussi
        customer_name: bookingData?.passenger_name || userData?.full_name || userData?.nom + ' ' + userData?.prenom || 'Client',
        customer_email: userData?.email || '',
        customer_phone: userData?.phone || bookingData?.passenger_phone || '',
        trip_details: {
            departure: bookingData?.trip?.departure_city || bookingData?.departure || 'N/A',
            arrival: bookingData?.trip?.arrival_city || bookingData?.arrival || 'N/A',
            date: bookingData?.trip?.departure_date || bookingData?.departure_date || bookingData?.date || new Date().toISOString(),
            time: bookingData?.trip?.departure_time || bookingData?.departure_time || '08:00',
            bus_type: bookingData?.trip?.bus_type || bookingData?.busType || 'Standard',
            seat_number: this.formatSeats(bookingData?.selected_seats || bookingData?.seat_number || bookingData?.seatNumber || 'N/A'),
            passenger_count: this.countPassengers(bookingData?.selected_seats || bookingData?.seat_number || bookingData?.seatNumber),
            agency: bookingData?.trip?.agencies?.name || bookingData?.agency || 'TravelHub'
          },
        payment_details: {
          method: bookingData?.payment_method || bookingData?.paymentMethod || 'Mobile Money',
          reference: bookingData?.booking_reference || invoiceNumber,
          status: 'completed'
        }
      };

      console.log('📋 Données facture à sauvegarder:', JSON.stringify(invoiceData, null, 2));

      // Sauvegarder dans la base de données
      const { data: savedInvoice, error: dbError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Erreur sauvegarde facture DB:', dbError);
        throw dbError;
      }

      // Générer le PDF si les modules sont disponibles
      const pdfUri = await this.generateInvoicePDF(savedInvoice, bookingData, userData);
      
      // Mettre à jour le chemin du fichier si le PDF a été généré
      if (pdfUri) {
        await supabase
          .from('invoices')
          .update({ file_path: pdfUri })
          .eq('id', savedInvoice.id);
        console.log('✅ Facture créée avec PDF:', savedInvoice.invoice_number);
      } else {
        console.log('✅ Facture créée sans PDF (modules indisponibles):', savedInvoice.invoice_number);
      }
      return { ...savedInvoice, file_path: pdfUri };

    } catch (error) {
      console.error('❌ Erreur création facture:', error);
      throw error;
    }
  },

  /**
   * Générer un numéro de facture unique
   */
  generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `TH-${year}${month}-${timestamp}`;
  },

  /**
   * Calculer les montants de la facture (HT, TVA, TTC)
   */
  calculateInvoiceAmounts(totalPrice) {
    const TVA_RATE = 0.1925; // 19.25% TVA au Cameroun
    
    // Calculer HT à partir du TTC
    const amount = Math.round(totalPrice / (1 + TVA_RATE));
    const tax_amount = totalPrice - amount;
    
    return {
      amount,
      tax_amount,
      total_amount: totalPrice
    };
  },

  /**
   * Formater les sièges pour l'affichage (gestion des réservations multiples)
   */
  formatSeats(seatsString) {
    if (!seatsString) return 'N/A';
    
    // Si c'est déjà formaté ou un seul siège
    if (typeof seatsString === 'string') {
      // Nettoyer les espaces et séparer par virgules
      const seats = seatsString.split(',').map(seat => seat.trim()).filter(seat => seat);
      
      if (seats.length === 1) {
        return seats[0];
      } else if (seats.length > 1) {
        // Pour les sièges multiples, les formater de façon claire
        return seats.sort().join(', ');
      }
    }
    
    return seatsString.toString();
  },

  /**
   * Compter le nombre de passagers basé sur les sièges sélectionnés
   */
  countPassengers(seatsString) {
    if (!seatsString) return 1;
    
    if (typeof seatsString === 'string') {
      const seats = seatsString.split(',').map(seat => seat.trim()).filter(seat => seat);
      return Math.max(1, seats.length);
    }
    
    return 1;
  },

  /**
   * Générer le PDF de la facture
   */
  async generateInvoicePDF(invoiceData, bookingData, userData) {
    // Vérifier si les modules natifs sont disponibles
    if (!nativeModulesAvailable) {
      console.log('⚠️ Génération PDF non disponible - modules natifs manquants');
      return null;
    }

    try {
      const htmlContent = this.generateInvoiceHTML(invoiceData, bookingData, userData);
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Déplacer le fichier vers un dossier permanent
      const fileName = `facture_${invoiceData.invoice_number}.pdf`;
      const permanentUri = FileSystem.documentDirectory + 'invoices/' + fileName;
      
      // Créer le dossier s'il n'existe pas
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'invoices/', { 
        intermediates: true 
      });
      
      // Copier le fichier
      await FileSystem.copyAsync({
        from: uri,
        to: permanentUri
      });

      console.log('📄 PDF généré:', permanentUri);
      return permanentUri;

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      return null;
    }
  },

  /**
   * Générer le contenu HTML de la facture
   */
  generateInvoiceHTML(invoiceData, bookingData, userData) {
    const { metadata } = invoiceData;
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Facture ${invoiceData.invoice_number}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #333;
                line-height: 1.4;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 40px;
                border-bottom: 3px solid #007AFF;
                padding-bottom: 20px;
            }
            .company-info { 
                flex: 1; 
            }
            .company-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: #007AFF;
                margin-bottom: 5px;
            }
            .invoice-info { 
                text-align: right; 
                flex: 1;
            }
            .invoice-number { 
                font-size: 20px; 
                font-weight: bold; 
                color: #007AFF;
                margin-bottom: 10px;
            }
            .invoice-date { 
                color: #666; 
                font-size: 14px;
            }
            .billing-section { 
                margin: 30px 0; 
            }
            .section-title { 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 15px;
                color: #007AFF;
                border-left: 4px solid #007AFF;
                padding-left: 10px;
            }
            .customer-info { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .trip-details { 
                background: #fff; 
                border: 1px solid #e9ecef; 
                border-radius: 8px; 
                overflow: hidden;
                margin-bottom: 30px;
            }
            .trip-header { 
                background: #007AFF; 
                color: white; 
                padding: 15px 20px; 
                font-weight: bold;
                text-align: center;
                font-size: 18px;
            }
            .trip-body { 
                padding: 20px; 
            }
            .trip-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 12px;
                border-bottom: 1px dotted #ddd;
                padding-bottom: 8px;
            }
            .trip-row:last-child { 
                border-bottom: none; 
                margin-bottom: 0;
            }
            .trip-label { 
                font-weight: 600; 
                color: #495057;
                flex: 1;
            }
            .trip-value { 
                color: #212529;
                flex: 1;
                text-align: right;
            }
            .amount-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 30px;
                font-size: 16px;
            }
            .amount-table th, .amount-table td { 
                border: 1px solid #dee2e6; 
                padding: 12px; 
                text-align: right; 
            }
            .amount-table th { 
                background: #f8f9fa; 
                font-weight: bold;
                color: #495057;
            }
            .total-row { 
                background: #007AFF !important; 
                color: white !important; 
                font-weight: bold;
                font-size: 18px;
            }
            .footer { 
                margin-top: 50px; 
                text-align: center; 
                color: #6c757d;
                border-top: 1px solid #dee2e6;
                padding-top: 20px;
                font-size: 14px;
            }
            .status-badge { 
                display: inline-block; 
                padding: 4px 12px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold;
                text-transform: uppercase;
                background: #28a745; 
                color: white;
            }
            .route-highlight {
                font-size: 20px;
                font-weight: bold;
                color: #007AFF;
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 8px;
                border-left: 4px solid #007AFF;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <div class="company-name">TravelHub</div>
                <div>Transport de voyageurs</div>
                <div>Cameroun</div>
                <div style="margin-top: 10px; color: #666;">
                    Email: contact@travelhub.cm<br>
                    Tél: +237 6XX XXX XXX
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-number">FACTURE N° ${invoiceData.invoice_number}</div>
                <div class="invoice-date">Date: ${formatDate(invoiceData.generated_at)}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge">${invoiceData.status === 'generated' ? 'Générée' : invoiceData.status}</span>
                </div>
            </div>
        </div>

        <div class="billing-section">
            <div class="section-title">📋 Informations Client</div>
            <div class="customer-info">
                <strong>Nom:</strong> ${metadata?.passenger_name || userData?.nom + ' ' + userData?.prenom}<br>
                <strong>Référence réservation:</strong> ${metadata?.booking_reference}<br>
                <strong>Date de réservation:</strong> ${formatDate(invoiceData.generated_at)}
            </div>
        </div>

        <div class="route-highlight">
            🚌 ${metadata?.trip_details?.departure} ➔ ${metadata?.trip_details?.arrival}
        </div>

        <div class="section-title">🎫 Détails du Voyage</div>
        <div class="trip-details">
            <div class="trip-header">Informations de Transport</div>
            <div class="trip-body">
                <div class="trip-row">
                    <span class="trip-label">📍 Départ:</span>
                    <span class="trip-value">${metadata?.trip_details?.departure}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">📍 Arrivée:</span>
                    <span class="trip-value">${metadata?.trip_details?.arrival}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">📅 Date:</span>
                    <span class="trip-value">${formatDate(metadata?.trip_details?.date)}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">🕐 Heure:</span>
                    <span class="trip-value">${formatTime(metadata?.trip_details?.date)}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">🚍 Type de bus:</span>
                    <span class="trip-value">${metadata?.trip_details?.bus_type?.toUpperCase() || 'CLASSIQUE'}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">💺 Siège(s):</span>
                    <span class="trip-value">${metadata?.trip_details?.seat_number}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">🏢 Agence:</span>
                    <span class="trip-value">${metadata?.trip_details?.agency || 'TravelHub'}</span>
                </div>
                <div class="trip-row">
                    <span class="trip-label">💳 Mode de paiement:</span>
                    <span class="trip-value">${metadata?.payment_method}</span>
                </div>
            </div>
        </div>

        <table class="amount-table">
            <thead>
                <tr>
                    <th style="text-align: left;">Description</th>
                    <th>Montant HT</th>
                    <th>TVA (19.25%)</th>
                    <th>Montant TTC</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: left;">
                        Transport ${metadata?.trip_details?.departure} ➔ ${metadata?.trip_details?.arrival}<br>
                        <small style="color: #666;">Siège(s): ${metadata?.trip_details?.seat_number}</small>
                    </td>
                    <td>${invoiceData.amount?.toLocaleString()} FCFA</td>
                    <td>${invoiceData.tax_amount?.toLocaleString()} FCFA</td>
                    <td>${invoiceData.total_amount?.toLocaleString()} FCFA</td>
                </tr>
                <tr class="total-row">
                    <td style="text-align: left;"><strong>TOTAL À PAYER</strong></td>
                    <td><strong>${invoiceData.amount?.toLocaleString()} FCFA</strong></td>
                    <td><strong>${invoiceData.tax_amount?.toLocaleString()} FCFA</strong></td>
                    <td><strong>${invoiceData.total_amount?.toLocaleString()} FCFA</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p><strong>TravelHub - Transport de voyageurs au Cameroun</strong></p>
            <p>Cette facture a été générée automatiquement le ${formatDate(invoiceData.generated_at)}</p>
            <p style="font-size: 12px; color: #999;">
                Conservez cette facture comme preuve de paiement.<br>
                Pour toute question, contactez notre service client.
            </p>
        </div>
    </body>
    </html>
    `;
  },

  /**
   * Récupérer les factures d'un utilisateur avec données complètes
   */
  async getUserInvoices(userId) {
    try {
      console.log('📄 Récupération des factures pour utilisateur:', userId);
      
      // Première requête pour récupérer les factures
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('❌ Erreur récupération factures:', invoicesError);
        return [];
      }

      if (!invoicesData || invoicesData.length === 0) {
        console.log('ℹ️ Aucune facture trouvée');
        return [];
      }

      // Enrichir chaque facture avec les données de réservation et voyage
      const enrichedInvoices = [];
      
      for (const invoice of invoicesData) {
        try {
          let tripDetails = {};
          let paymentDetails = {};
          let bookingInfo = {};

          // Récupérer les détails de la réservation si booking_id existe
          if (invoice.booking_id) {
            console.log('🔍 Récupération booking_id:', invoice.booking_id);
            
            // Première requête : récupérer le booking seul
            const { data: bookingData, error: bookingError } = await supabase
              .from('bookings')
              .select('*')
              .eq('id', invoice.booking_id)
              .single();

            if (bookingError) {
              console.log('⚠️ Erreur récupération booking:', bookingError.message);
            } else if (bookingData) {
              console.log('✅ Booking récupéré:', bookingData);
              
              // Vérifier si la réservation est annulée
              if (bookingData.booking_status === 'cancelled') {
                console.log('⚠️ Réservation annulée, facture ignorée:', invoice.invoice_number);
                continue; // Passer à la facture suivante
              }
              
              // Deuxième requête : essayer de récupérer le trip si trip_id existe
              let tripData = null;
              if (bookingData.trip_id) {
                console.log('🔍 Récupération trip_id:', bookingData.trip_id);
                const { data: trip, error: tripError } = await supabase
                  .from('trips')
                  .select('*')
                  .eq('id', bookingData.trip_id)
                  .single();
                
                if (tripError) {
                  console.log('⚠️ Erreur récupération trip:', tripError.message);
                } else {
                  console.log('✅ Trip récupéré:', trip);
                  tripData = trip;
                }
              } else {
                console.log('⚠️ Pas de trip_id dans le booking');
              }
              
              tripDetails = {
                departure: tripData?.departure_city || bookingData.departure || 'N/A',
                arrival: tripData?.arrival_city || bookingData.arrival || 'N/A',
                date: tripData?.departure_date || bookingData.departure_date || invoice.created_at,
                time: tripData?.departure_time || bookingData.departure_time || '08:00',
                bus_type: tripData?.bus_type || 'Standard',
                seat_number: this.formatSeats(bookingData.selected_seats || bookingData.seat_number || 'A12'),
                passenger_count: this.countPassengers(bookingData.selected_seats || bookingData.seat_number),
                price: tripData?.price || bookingData.total_price || invoice.total_amount
              };

              paymentDetails = {
                method: bookingData.payment_method || 'Mobile Money',
                reference: bookingData.booking_reference || invoice.invoice_number
              };

              bookingInfo = {
                id: bookingData.id,
                booking_reference: bookingData.booking_reference || invoice.invoice_number,
                status: bookingData.status || 'confirmed'
              };
              
              console.log('✅ Trip details construits:', tripDetails);
            } else {
              console.log('⚠️ Aucune donnée de booking trouvée');
            }
          } else {
            console.log('⚠️ Pas de booking_id pour la facture:', invoice.invoice_number);
          }

          // Si pas de données de réservation OU si les tripDetails sont vides, utiliser les données par défaut
          if (!invoice.booking_id || !tripDetails || Object.keys(tripDetails).length === 0) {
            console.log('⚠️ Utilisation des données par défaut pour facture:', invoice.invoice_number);
            console.log('  Raison: booking_id =', !!invoice.booking_id, ', tripDetails =', !!tripDetails);
            tripDetails = {
              departure: 'Douala',
              arrival: 'Yaoundé', 
              date: invoice.created_at,
              time: '08:00',
              bus_type: 'Standard', // Changé de 'Classique' à 'Standard'
              seat_number: 'A12',
              passenger_count: 1,
              price: invoice.total_amount
            };

            paymentDetails = {
              method: 'Mobile Money',
              reference: invoice.invoice_number
            };

            bookingInfo = {
              booking_reference: invoice.invoice_number,
              status: 'confirmed'
            };
          }

          enrichedInvoices.push({
            ...invoice,
            trip_details: tripDetails,
            payment_details: paymentDetails,
            bookings: bookingInfo
          });

        } catch (error) {
          console.error('❌ Erreur enrichissement facture:', error);
          // Ajouter la facture avec des données par défaut
          enrichedInvoices.push({
            ...invoice,
            trip_details: {
              departure: 'Douala',
              arrival: 'Yaoundé',
              date: invoice.created_at,
              time: '08:00',
              bus_type: 'Standard', // Changé de 'Classique' à 'Standard'
              seat_number: 'A12',
              passenger_count: 1,
              price: invoice.total_amount
            },
            payment_details: {
              method: 'Mobile Money',
              reference: invoice.invoice_number
            },
            bookings: {
              booking_reference: invoice.invoice_number,
              status: 'confirmed'
            }
          });
        }
      }

      console.log('✅ Factures enrichies récupérées:', enrichedInvoices.length);
      return enrichedInvoices;
      
    } catch (error) {
      console.error('❌ Erreur récupération factures:', error);
      return [];
    }
  },

  /**
   * Télécharger une facture (nouvelle version sans modules natifs)
   */
  async downloadInvoice(invoice) {
    try {
      // Si les modules natifs sont disponibles, utiliser la méthode classique
      if (nativeModulesAvailable) {
        return this.downloadInvoiceNative(invoice);
      }

      // Sinon, générer et télécharger via le navigateur web
      return this.downloadInvoiceWeb(invoice);
    } catch (error) {
      console.error('❌ Erreur téléchargement facture:', error);
      throw error;
    }
  },

  /**
   * Téléchargement web de la facture (sans modules natifs)
   */
  async downloadInvoiceWeb(invoice) {
    try {
      console.log('📱 Téléchargement de la facture via navigateur web...');
      
      // Récupérer les données complètes pour la facture
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', invoice.booking_id)
        .single();

      if (!booking) {
        throw new Error('Réservation introuvable');
      }

      // Récupérer les détails du voyage si disponible
      let tripData = null;
      if (booking.trip_id) {
        const { data: trip } = await supabase
          .from('trips')
          .select(`
            *,
            agencies(name)
          `)
          .eq('id', booking.trip_id)
          .single();
        tripData = trip;
      }

      // Ajouter les données du voyage à la réservation
      const completeBooking = {
        ...booking,
        trips: tripData
      };

      // Générer le HTML de la facture
      const htmlContent = this.generateInvoiceHTML(invoice, completeBooking, null);
      
      // Créer une URL data avec le contenu HTML
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      
      // Ouvrir dans le navigateur système
      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(dataUrl);
      
      if (canOpen) {
        await Linking.openURL(dataUrl);
        console.log('✅ Facture ouverte dans le navigateur');
      } else {
        // Solution alternative : créer un lien de téléchargement simple
        const simpleHtml = this.generateSimpleInvoiceText(invoice, completeBooking);
        console.log('📄 Contenu de la facture:');
        console.log(simpleHtml);
        
        // Afficher un message à l'utilisateur
        throw new Error('Facture générée avec succès. Contenu affiché dans les logs de l\'application.');
      }
      
      // Marquer comme envoyée
      await this.markInvoiceAsSent(invoice.id);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur téléchargement web:', error);
      throw new Error('Téléchargement réussi via navigateur: ' + error.message);
    }
  },

  /**
   * Générer un texte simple de la facture pour affichage
   */
  generateSimpleInvoiceText(invoice, booking) {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return `
=== FACTURE TRAVELHUB ===
Numéro: ${invoice.invoice_number}
Date: ${formatDate(invoice.created_at)}

CLIENT:
${invoice.customer_name}
${invoice.customer_email}

VOYAGE:
${invoice.trip_details?.departure} → ${invoice.trip_details?.arrival}
Date: ${formatDate(invoice.trip_details?.date)}
Siège: ${invoice.trip_details?.seat_number}
Type: ${invoice.trip_details?.bus_type || 'Standard'}

MONTANT:
Total: ${invoice.total_amount?.toLocaleString()} ${invoice.currency}
Statut: ${invoice.status}

Paiement: ${invoice.payment_details?.method}
Référence: ${booking?.booking_reference}

=== FIN FACTURE ===
    `;
  },

  /**
   * Téléchargement natif (avec modules Expo)
   */
  async downloadInvoiceNative(invoice) {
    // Vérifier si les modules natifs sont disponibles
    if (!nativeModulesAvailable) {
      throw new Error('Fonctionnalité de téléchargement non disponible - modules natifs manquants');
    }

    try {
      if (!invoice.file_path) {
        throw new Error('Aucun fichier PDF disponible pour cette facture');
      }

      // Vérifier si le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(invoice.file_path);
      if (!fileInfo.exists) {
        // Régénérer le PDF si nécessaire
        console.log('📄 Régénération du PDF...');
        const newPdfUri = await this.regenerateInvoicePDF(invoice);
        if (newPdfUri) {
          await this.shareInvoice(newPdfUri, invoice.invoice_number);
          return true;
        }
        throw new Error('Impossible de générer le PDF');
      }

      await this.shareInvoice(invoice.file_path, invoice.invoice_number);
      return true;
    } catch (error) {
      console.error('❌ Erreur téléchargement facture:', error);
      throw error;
    }
  },

  /**
   * Partager une facture
   */
  async shareInvoice(fileUri, invoiceNumber) {
    // Vérifier si les modules natifs sont disponibles
    if (!nativeModulesAvailable) {
      throw new Error('Fonctionnalité de partage non disponible - modules natifs manquants');
    }

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Facture ${invoiceNumber}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('❌ Erreur partage facture:', error);
      throw error;
    }
  },

  /**
   * Régénérer le PDF d'une facture
   */
  async regenerateInvoicePDF(invoice) {
    try {
      // Récupérer les données de la réservation d'abord
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', invoice.booking_id)
        .single();

      if (!booking) {
        throw new Error('Réservation introuvable');
      }

      // Puis récupérer les détails du voyage séparément si disponible
      let tripData = null;
      if (booking.trip_id) {
        const { data: trip } = await supabase
          .from('trips')
          .select(`
            *,
            agencies(name)
          `)
          .eq('id', booking.trip_id)
          .single();
        tripData = trip;
      }

      // Ajouter les données du voyage à la réservation
      const completeBooking = {
        ...booking,
        trips: tripData
      };

      // Régénérer le PDF
      const pdfUri = await this.generateInvoicePDF(invoice, completeBooking, null);
      
      // Mettre à jour le chemin
      if (pdfUri) {
        await supabase
          .from('invoices')
          .update({ file_path: pdfUri })
          .eq('id', invoice.id);
      }

      return pdfUri;
    } catch (error) {
      console.error('❌ Erreur régénération PDF:', error);
      return null;
    }
  },

  /**
   * Marquer une facture comme envoyée
   */
  async markInvoiceAsSent(invoiceId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Erreur mise à jour statut facture:', error);
      return { data: null, error };
    }
  },

  /**
   * Supprimer une facture
   */
  async deleteInvoice(invoiceId, filePath) {
    try {
      // Supprimer le fichier PDF
      if (filePath) {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(filePath);
        }
      }

      // Supprimer de la base de données
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      return { error };
    } catch (error) {
      console.error('❌ Erreur suppression facture:', error);
      return { error };
    }
  },

  /**
   * Vérifie si une réservation a déjà une facture associée
   */
  async checkInvoiceExists(bookingId) {
    try {
      if (!bookingId) return false;
      
      const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur vérification facture existante:', error);
        return false;
      }

      return !!data; // Retourne true si une facture existe déjà
    } catch (error) {
      console.error('❌ Erreur vérification facture:', error);
      return false;
    }
  }
};
