import { supabase } from '@/lib/supabaseClient';

export interface WorkingHours {
  [key: string]: {
    active: boolean;
    start: string;
    end: string;
  };
}

/**
 * Récupère les horaires de travail d'un professionnel
 */
export const getProfessionalWorkingHours = async (userId: string): Promise<WorkingHours | null> => {
  try {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('pro_profiles')
      .select('working_hours')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des horaires:', error);
      return null;
    }

    return data?.working_hours || null;
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires:', error);
    return null;
  }
};

/**
 * Vérifie si un jour de la semaine est un jour de travail
 * @param workingHours - Les horaires de travail du professionnel
 * @param dayOfWeek - Index du jour (0 = dimanche, 1 = lundi, ..., 6 = samedi)
 */
export const isWorkingDay = (workingHours: WorkingHours | null, dayOfWeek: number): boolean => {
  if (!workingHours) {
    return false; // Si pas d'horaires définis, on considère que tous les jours sont NON travaillés (sécurité)
  }

  // Mapping JS standard : 0=dimanche, 1=lundi, 2=mardi, 3=mercredi, 4=jeudi, 5=vendredi, 6=samedi
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = days[dayOfWeek];
  const dayHours = workingHours[dayName];
  
  console.log(`🔍 isWorkingDay: dayOfWeek=${dayOfWeek}, dayName=${dayName}, active=${dayHours?.active}`);
  
  return dayHours?.active === true;
};

/**
 * Vérifie si une date est un jour de travail
 */
export const isDateWorkingDay = (workingHours: WorkingHours | null, date: Date): boolean => {
  const dayOfWeek = date.getDay(); // 0=dimanche, 1=lundi, 2=mardi, etc.
  return isWorkingDay(workingHours, dayOfWeek);
};

/**
 * Génère les dates non travaillées pour un calendrier
 */
export const getNonWorkingDates = (workingHours: WorkingHours | null, startDate: Date, endDate: Date): Date[] => {
  const nonWorkingDates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!isDateWorkingDay(workingHours, currentDate)) {
      nonWorkingDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return nonWorkingDates;
};

/**
 * Récupère les horaires de travail pour un jour spécifique
 */
export const getWorkingHoursForDay = (workingHours: WorkingHours | null, dayOfWeek: number): { start: string; end: string } | null => {
  if (!workingHours) {
    return null;
  }

  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = days[dayOfWeek];
  const dayHours = workingHours[dayName];
  
  if (!dayHours || !dayHours.active) {
    return null;
  }
  
  return {
    start: dayHours.start,
    end: dayHours.end
  };
};

/**
 * Récupère les créneaux déjà réservés pour un professionnel à une date donnée
 * Inclut tous les statuts qui rendent un créneau indisponible
 */
export const getBookedSlots = async (proId: string, date: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/appointments/booked-slots?pro_id=${proId}&date=${date}`);
    
    if (!response.ok) {
      console.error('Erreur API booked-slots:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.bookedSlots || [];
  } catch (error) {
    console.error('Erreur getBookedSlots:', error);
    return [];
  }
};

/**
 * Génère les créneaux horaires disponibles selon les horaires de travail du professionnel
 * et en excluant les créneaux déjà réservés
 */
export const generateAvailableTimeSlots = async (
  workingHours: WorkingHours | null, 
  date: Date, 
  proId: string,
  consultationDuration: number = 30
): Promise<string[]> => {
  const dayOfWeek = date.getDay(); // 0=dimanche, 1=lundi, etc.
  const dayHours = getWorkingHoursForDay(workingHours, dayOfWeek);
  
  if (!dayHours) return [];
  
  // Générer tous les créneaux possibles
  const allSlots: string[] = [];
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  let currentMinutes = startMinutes;
  while (currentMinutes + consultationDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    allSlots.push(timeString);
    currentMinutes += consultationDuration;
  }
  
  // Récupérer les créneaux réservés
  const dateString = date.toISOString().split('T')[0];
  const bookedSlots = await getBookedSlots(proId, dateString);
  
  // Exclure les créneaux réservés
  return allSlots.filter(slot => !bookedSlots.includes(slot));
};

/**
 * Vérifie si un créneau spécifique est disponible pour un professionnel
 * Utilisé pour la validation finale avant la soumission
 */
export const isSlotAvailable = async (
  proId: string, 
  date: string, 
  time: string
): Promise<boolean> => {
  try {
    const bookedSlots = await getBookedSlots(proId, date);
    return !bookedSlots.includes(time);
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error);
    return false;
  }
};
