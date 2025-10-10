'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Calendar, MapPin, Clock, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Appointment {
  id: string;
  main_slot: string;
  status: string;
  comment: string;
  duration_minutes: number;
  equide_ids: string[];
  proprio_profiles: {
    prenom: string;
    nom: string;
    telephone: string;
    adresse: string;
    users: {
      email: string;
    };
  };
}

interface NouvelleTourneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourCreated?: () => void;
}

export default function NouvelleTourneeModal({ isOpen, onClose, onTourCreated }: NouvelleTourneeModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tourName, setTourName] = useState('');

  // Charger les rendez-vous disponibles (confirmés et sans tournée)
  useEffect(() => {
    const fetchAvailableAppointments = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Vous devez être connecté pour créer une tournée');
        }
        
        console.log('✅ Utilisateur connecté pour nouvelle tournée:', user.id);
        
        // Récupérer les rendez-vous confirmés sans tournée
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            main_slot,
            status,
            comment,
            duration_minutes,
            tour_id,
            equide_ids,
            proprio_profiles!inner (
              prenom,
              nom,
              telephone,
              adresse,
              users!proprio_profiles_user_id_fkey (
                email
              )
            )
          `)
          .eq('pro_id', user.id)
          .eq('status', 'confirmed')
          .is('tour_id', null)
          .gte('main_slot', new Date().toISOString())
          .order('main_slot', { ascending: true });

        if (appointmentsError) {
          console.error('❌ Erreur rendez-vous:', appointmentsError);
          throw new Error('Erreur lors de la récupération des rendez-vous');
        }
        
        console.log('📅 Rendez-vous disponibles:', appointmentsData?.length || 0);
        setAppointments(appointmentsData || []);
        
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableAppointments();
  }, [isOpen]);

  // Fonction pour formater la date
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset des heures pour comparer seulement les dates
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Aujourd\'hui';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Fonction pour grouper les rendez-vous par date
  const groupAppointmentsByDate = () => {
    const grouped = appointments.reduce((acc, appointment) => {
      const date = new Date(appointment.main_slot);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);

    // Trier les rendez-vous par heure dans chaque groupe
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(a.main_slot).getTime() - new Date(b.main_slot).getTime()
      );
    });

    // Trier les dates
    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(dateKey => ({
      date: dateKey,
      label: formatDateLabel(dateKey),
      appointments: grouped[dateKey]
    }));
  };

  // Fonctions utilitaires
  const getClientName = (rdv: Appointment) => {
    return `${rdv.proprio_profiles.prenom} ${rdv.proprio_profiles.nom}`;
  };

  const getEquideName = (rdv: Appointment) => {
    return rdv.equide_ids && rdv.equide_ids.length > 0 
      ? `Équidé ${rdv.equide_ids[0]}` 
      : 'N/A';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAppointmentToggle = (appointmentId: string) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const handleCreateTournee = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Vous devez être connecté pour créer une tournée');
      }
      
      const selectedAppointmentsData = appointments.filter(apt => 
        selectedAppointments.includes(apt.id)
      );
      
      if (selectedAppointmentsData.length === 0) {
        throw new Error('Veuillez sélectionner au moins un rendez-vous');
      }
      
      if (!selectedDate) {
        throw new Error('Veuillez sélectionner une date pour la tournée');
      }
      
      // Créer la tournée
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .insert({
          pro_id: user.id,
          name: tourName || `Tournée du ${formatDateLabel(selectedDate)}`,
          date: selectedDate,
          notes: null
        })
        .select()
        .single();
      
      if (tourError) {
        console.error('❌ Erreur création tournée:', tourError);
        throw new Error('Erreur lors de la création de la tournée');
      }
      
      console.log('✅ Tournée créée:', tourData);
      
      // Mettre à jour les rendez-vous avec le tour_id
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ tour_id: tourData.id })
        .in('id', selectedAppointments);
      
      if (updateError) {
        console.error('❌ Erreur mise à jour appointments:', updateError);
        throw new Error('Erreur lors de la mise à jour des rendez-vous');
      }
      
      console.log('✅ Rendez-vous mis à jour avec la tournée');
      
      // Réinitialiser le formulaire
      setSelectedDate('');
      setSelectedAppointments([]);
      setTourName('');
      setNotes('');
      
      // Fermer le modal et rafraîchir la liste
      onClose();
      if (onTourCreated) {
        onTourCreated();
      }
      
    } catch (err) {
      console.error('Error creating tour:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedAppointments.length;
  const selectedAppointmentsData = appointments.filter(apt => 
    selectedAppointments.includes(apt.id)
  );
  const totalDistance = selectedCount * 5; // Estimation 5km par RDV
  const totalDuration = selectedAppointmentsData.reduce((total, apt) => total + (apt.duration_minutes || 60), 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une nouvelle tournée">
      <div className="space-y-6">
        {/* Nom de la tournée */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Nom de la tournée
          </label>
          <input
            type="text"
            value={tourName}
            onChange={(e) => setTourName(e.target.value)}
            placeholder="Ex: Tournée matinée Paris"
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827]"
          />
        </div>

        {/* Sélecteur de date */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Date de la tournée
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827]"
          />
        </div>


        {/* Liste des rendez-vous disponibles groupés par date */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Rendez-vous disponibles
          </label>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#6b7280] animate-spin" />
              <span className="ml-2 text-[#6b7280]">Chargement des rendez-vous...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm">Aucun rendez-vous disponible pour créer une tournée</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {groupAppointmentsByDate().map((dateGroup) => (
                <div key={dateGroup.date} className="mb-4">
                  {/* Séparateur de date */}
                  <h4 className="text-sm font-semibold text-gray-500 mt-4 mb-2">
                    {dateGroup.label}
                  </h4>
                  
                  {/* Rendez-vous du jour */}
                  <div className="space-y-2">
                    {dateGroup.appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`bg-white hover:bg-gray-50 p-3 rounded-md border border-[#e5e7eb] cursor-pointer transition-colors duration-150 ${
                          selectedAppointments.includes(appointment.id)
                            ? 'bg-[#f86f4d10] border-[#f86f4d]'
                            : ''
                        }`}
                        onClick={() => handleAppointmentToggle(appointment.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedAppointments.includes(appointment.id)}
                            onChange={() => handleAppointmentToggle(appointment.id)}
                            className="w-4 h-4 text-[#f86f4d] border-[#e5e7eb] rounded focus:border-[#ff6b35]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-[#111827]">{formatTime(appointment.main_slot)}</span>
                              <span className="text-sm text-[#111827] font-medium">{getClientName(appointment)}</span>
                            </div>
                            <p className="text-sm text-gray-500">{appointment.comment || 'Consultation'} • {getEquideName(appointment)}</p>
                            <p className="text-sm text-gray-500">{appointment.proprio_profiles.adresse}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé dynamique */}
        {selectedCount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[#111827] mb-3">Résumé de la tournée</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{selectedCount}</span>
                </div>
                <p className="text-xs text-gray-500">Rendez-vous</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MapPin className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{totalDistance} km</span>
                </div>
                <p className="text-xs text-gray-500">Distance totale</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{formatDuration(totalDuration)}</span>
                </div>
                <p className="text-xs text-gray-500">Durée totale</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer avec boutons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTournee}
            disabled={selectedCount === 0 || !selectedDate || loading}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {loading ? 'Création...' : 'Créer la tournée'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
