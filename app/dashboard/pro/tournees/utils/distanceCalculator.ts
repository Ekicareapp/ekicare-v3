// Utilitaire pour calculer les distances via Google Maps Distance Matrix API

interface DistanceResult {
  distance: number; // en kilomètres
  error?: string;
}

interface AppointmentLocation {
  address: string;
  city?: string;
}

/**
 * Calcule la distance totale d'une tournée en utilisant l'API Google Maps Distance Matrix
 * @param appointments Liste des rendez-vous dans l'ordre de la tournée
 * @param isMockTour Si c'est une tournée mockée
 * @returns Distance totale en kilomètres ou null si erreur
 */
export async function calculateTourDistance(
  appointments: any[],
  isMockTour: boolean = false
): Promise<DistanceResult> {
  try {
    if (!appointments || appointments.length === 0) {
      return { distance: 0 };
    }

    if (appointments.length === 1) {
      return { distance: 0 };
    }

    // Préparer les adresses pour l'API
    const addresses = appointments.map(appointment => {
      if (isMockTour) {
        return appointment.address;
      } else {
        return appointment.proprio_profiles?.adresse || '';
      }
    }).filter(address => address.trim() !== '');

    if (addresses.length < 2) {
      return { distance: 0 };
    }

    // Appeler l'API Google Maps Distance Matrix
    const distance = await calculateDistanceMatrix(addresses);
    
    return { distance };
  } catch (error) {
    console.error('Erreur calcul distance tournée:', error);
    return { distance: 0, error: 'Erreur calcul distance' };
  }
}

/**
 * Appelle l'API Google Maps Distance Matrix
 * @param addresses Liste des adresses
 * @returns Distance totale en kilomètres
 */
async function calculateDistanceMatrix(addresses: string[]): Promise<number> {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!API_KEY) {
    console.warn('Clé API Google Maps non configurée');
    return 0;
  }

  try {
    // Construire l'URL pour l'API Distance Matrix
    const origins = addresses.slice(0, -1).join('|');
    const destinations = addresses.slice(1).join('|');
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=metric&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Erreur API Google Maps:', data.status);
      return 0;
    }

    // Calculer la distance totale
    let totalDistance = 0;
    
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      for (let j = 0; j < row.elements.length; j++) {
        const element = row.elements[j];
        if (element.status === 'OK' && element.distance) {
          // Convertir de mètres en kilomètres
          totalDistance += element.distance.value / 1000;
        }
      }
    }

    return Math.round(totalDistance * 100) / 100; // Arrondir à 2 décimales
  } catch (error) {
    console.error('Erreur appel API Google Maps:', error);
    return 0;
  }
}

/**
 * Formate la distance pour l'affichage
 * @param distance Distance en kilomètres
 * @returns String formatée (ex: "12,34 km" ou "– km")
 */
export function formatDistance(distance: number | null): string {
  if (distance === null || distance === undefined || distance === 0) {
    return '– km';
  }
  
  return `${distance.toFixed(2).replace('.', ',')} km`;
}
