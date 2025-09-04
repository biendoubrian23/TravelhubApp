-- Création de la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'booking_reminder',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour permettre l'insertion de notifications
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre la mise à jour des notifications par l'utilisateur
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Fonction pour créer automatiquement une notification de rappel lors d'une réservation
CREATE OR REPLACE FUNCTION create_booking_reminder_notification()
RETURNS TRIGGER AS $$
DECLARE
    trip_info RECORD;
    reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Récupérer les informations du voyage
    SELECT departure_time, departure_city, arrival_city
    INTO trip_info
    FROM trips
    WHERE id = NEW.trip_id;
    
    -- Calculer le moment du rappel (24h avant le départ)
    reminder_time := trip_info.departure_time - INTERVAL '24 hours';
    
    -- Ne créer la notification que si le rappel est dans le futur
    IF reminder_time > NOW() THEN
        INSERT INTO notifications (
            user_id,
            booking_id,
            type,
            title,
            message,
            scheduled_for
        ) VALUES (
            NEW.user_id,
            NEW.id,
            'booking_reminder',
            'Rappel de voyage',
            FORMAT('Votre voyage de %s à %s est prévu demain à %s. Référence: %s',
                trip_info.departure_city,
                trip_info.arrival_city,
                TO_CHAR(trip_info.departure_time, 'HH24:MI'),
                NEW.booking_reference
            ),
            reminder_time
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les notifications de rappel
CREATE TRIGGER trigger_create_booking_reminder
    AFTER INSERT ON bookings
    FOR EACH ROW
    WHEN (NEW.booking_status = 'confirmed')
    EXECUTE FUNCTION create_booking_reminder_notification();
