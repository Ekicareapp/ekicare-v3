/**
 * Utilitaires pour la gestion des dates et heures dans Ekicare
 * Évite les problèmes de fuseau horaire en utilisant UTC
 */

/**
 * Crée une date ISO string en UTC à partir d'une date et heure
 * @param dateString Format YYYY-MM-DD
 * @param timeString Format HH:MM
 * @returns ISO string en UTC
 */
export function createUTCDateTime(dateString: string, timeString: string): string {
  // Créer la date en UTC correctement pour éviter les décalages de fuseau horaire
  const [year, month, day] = dateString.split('-');
  const [hour, minute] = timeString.split(':');
  
  const date = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1, // Les mois commencent à 0
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0,
    0
  ));
  
  return date.toISOString();
}

/**
 * Formate une date ISO string pour l'affichage en français
 * @param dateTimeString ISO string
 * @returns Objet avec date et time formatés
 */
export function formatDateTimeForDisplay(dateTimeString: string) {
  try {
    // Vérifier si la chaîne est valide
    if (!dateTimeString || typeof dateTimeString !== 'string') {
      console.error('❌ formatDateTimeForDisplay: Chaîne de date invalide:', dateTimeString);
      return {
        date: 'Date invalide',
        time: 'Heure invalide'
      };
    }

    // S'assurer que la date est traitée comme UTC
    let date: Date;
    if (dateTimeString.includes('Z')) {
      date = new Date(dateTimeString);
    } else if (dateTimeString.includes('+') || dateTimeString.includes('-', 10)) {
      // Gérer les formats avec timezone (+00:00, -05:00, etc.)
      date = new Date(dateTimeString);
    } else {
      date = new Date(dateTimeString + 'Z');
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error('❌ formatDateTimeForDisplay: Date invalide après parsing:', dateTimeString);
      return {
        date: 'Date invalide',
        time: 'Heure invalide'
      };
    }
    
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      })
    };
  } catch (error) {
    console.error('❌ formatDateTimeForDisplay: Erreur:', error, 'pour la chaîne:', dateTimeString);
    return {
      date: 'Date invalide',
      time: 'Heure invalide'
    };
  }
}

/**
 * Vérifie si une date est dans le futur
 * @param dateTimeString ISO string
 * @returns boolean
 */
export function isFutureDateTime(dateTimeString: string): boolean {
  const date = new Date(dateTimeString + (dateTimeString.includes('Z') ? '' : 'Z'));
  const now = new Date();
  return date > now;
}

/**
 * Extrait la date (YYYY-MM-DD) d'une ISO string
 * @param dateTimeString ISO string
 * @returns Date string au format YYYY-MM-DD
 */
export function extractDateFromISO(dateTimeString: string): string {
  const date = new Date(dateTimeString + (dateTimeString.includes('Z') ? '' : 'Z'));
  return date.toISOString().split('T')[0];
}

/**
 * Extrait l'heure (HH:MM) d'une ISO string
 * @param dateTimeString ISO string
 * @returns Time string au format HH:MM
 */
export function extractTimeFromISO(dateTimeString: string): string {
  const date = new Date(dateTimeString + (dateTimeString.includes('Z') ? '' : 'Z'));
  return date.toISOString().split('T')[1].substring(0, 5);
}
