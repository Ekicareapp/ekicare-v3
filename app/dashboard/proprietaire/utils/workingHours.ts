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
export const getProfessionalWorkingHours = async (proId: string): Promise<WorkingHours | null> => {
  try {
    const { data, error } = await supabase
      .from('pro_profiles')
      .select('working_hours')
      .eq('user_id', proId)
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
 */
export const isWorkingDay = (workingHours: WorkingHours | null, dayOfWeek: number): boolean => {
  console.log('🔍 isWorkingDay: Début');
  console.log('📅 Jour de la semaine:', dayOfWeek);
  console.log('⏰ Working hours:', workingHours);
  
  if (!workingHours) {
    console.log('✅ Pas d\'horaires définis, tous les jours sont travaillés');
    return true; // Si pas d'horaires définis, on considère que tous les jours sont travaillés
  }

  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = days[dayOfWeek];
  console.log('📅 Nom du jour:', dayName);
  
  const dayHours = workingHours[dayName];
  console.log('🕐 Horaires pour ce jour:', dayHours);
  
  const isActive = dayHours?.active === true;
  console.log('✅ Jour actif:', isActive);
  
  return isActive;
};

/**
 * Vérifie si une date est un jour de travail
 */
export const isDateWorkingDay = (workingHours: WorkingHours | null, date: Date): boolean => {
  console.log('🔍 isDateWorkingDay: Début');
  console.log('📅 Date:', date);
  
  const dayOfWeek = date.getUTCDay(); // Utiliser UTC pour éviter les décalages
  console.log('📅 Jour de la semaine (UTC):', dayOfWeek);
  
  const result = isWorkingDay(workingHours, dayOfWeek);
  console.log('✅ Résultat isDateWorkingDay:', result);
  
  return result;
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
  console.log('🔍 getWorkingHoursForDay: Début');
  console.log('📅 Jour de la semaine:', dayOfWeek);
  console.log('⏰ Working hours:', workingHours);
  
  if (!workingHours) {
    console.log('❌ Pas d\'horaires de travail définis');
    return null;
  }

  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = days[dayOfWeek];
  console.log('📅 Nom du jour:', dayName);
  
  const dayHours = workingHours[dayName];
  console.log('🕐 Horaires pour ce jour:', dayHours);
  
  if (!dayHours || !dayHours.active) {
    console.log('❌ Jour non actif ou pas d\'horaires');
    return null;
  }
  
  const result = {
    start: dayHours.start,
    end: dayHours.end
  };
  
  console.log('✅ Horaires trouvés:', result);
  return result;
};

/**
 * Récupère les créneaux déjà réservés pour un professionnel à une date donnée
 * Inclut tous les statuts qui rendent un créneau indisponible
 */
export const getBookedSlots = async (proId: string, date: string): Promise<string[]> => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Récupérer tous les rendez-vous qui rendent un créneau indisponible
    const { data, error } = await supabase
      .from('appointments')
      .select('main_slot, alternative_slots, status')
      .eq('pro_id', proId)
      .in('status', ['confirmed', 'pending', 'rescheduled']) // Inclure tous les statuts actifs
      .gte('main_slot', startOfDay.toISOString())
      .lte('main_slot', endOfDay.toISOString());
    
    if (error) {
      console.error('Erreur lors de la récupération des créneaux réservés:', error);
      return [];
    }
    
    const bookedSlots: string[] = [];
    
    data?.forEach(appointment => {
      // Ajouter le créneau principal
      const mainSlot = new Date(appointment.main_slot);
      const timeString = `${mainSlot.getHours().toString().padStart(2, '0')}:${mainSlot.getMinutes().toString().padStart(2, '0')}`;
      bookedSlots.push(timeString);
      
      // Ajouter les créneaux alternatifs s'ils existent
      if (appointment.alternative_slots && Array.isArray(appointment.alternative_slots)) {
        appointment.alternative_slots.forEach((slot: string) => {
          const altSlot = new Date(slot);
          const altTimeString = `${altSlot.getHours().toString().padStart(2, '0')}:${altSlot.getMinutes().toString().padStart(2, '0')}`;
          bookedSlots.push(altTimeString);
        });
      }
    });
    
    // Supprimer les doublons
    return [...new Set(bookedSlots)];
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux réservés:', error);
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
  console.log('🔧 generateAvailableTimeSlots: Début');
  console.log('📅 Date:', date);
  console.log('👨‍⚕️ Pro ID:', proId);
  console.log('⏰ Working hours:', workingHours);
  console.log('⏱️ Consultation duration:', consultationDuration);
  
  const dayOfWeek = date.getUTCDay(); // Utiliser UTC pour éviter les décalages
  console.log('📅 Jour de la semaine (UTC):', dayOfWeek, '(0=dimanche, 5=vendredi)');
  
  const dayHours = getWorkingHoursForDay(workingHours, dayOfWeek);
  console.log('🕐 Horaires pour ce jour:', dayHours);
  
  if (!dayHours) {
    console.log('❌ Pas d\'horaires définis pour ce jour');
    return []; // Pas de créneaux si le jour n'est pas travaillé
  }
  
  // Générer tous les créneaux possibles
  const allSlots: string[] = [];
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  console.log('🕐 Heure de début:', startHour, ':', startMinute);
  console.log('🕐 Heure de fin:', endHour, ':', endMinute);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  console.log('⏰ Début en minutes:', startMinutes);
  console.log('⏰ Fin en minutes:', endMinutes);
  
  let currentMinutes = startMinutes;
  
  while (currentMinutes + consultationDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    allSlots.push(timeString);
    
    currentMinutes += consultationDuration;
  }
  
  console.log('🎯 Tous les créneaux possibles:', allSlots);
  
  // Récupérer les créneaux déjà réservés
  const dateString = date.toISOString().split('T')[0];
  console.log('📅 Date string pour requête:', dateString);
  
  const bookedSlots = await getBookedSlots(proId, dateString);
  console.log('🚫 Créneaux réservés:', bookedSlots);
  
  // Filtrer les créneaux disponibles
  const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
  console.log('✅ Créneaux disponibles:', availableSlots);
  
  return availableSlots;
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
