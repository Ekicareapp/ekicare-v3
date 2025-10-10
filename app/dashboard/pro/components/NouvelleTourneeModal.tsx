'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Appointment {
  id: string;
  main_slot: string;
  status: string;
  comment: string;
  duration_minutes: number;
  equide_ids: string[];
  equides?: { nom: string }[];
  address?: string;
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
        
        // Vérifier que Supabase est initialisé
        if (!supabase) {
          throw new Error('Client Supabase non initialisé');
        }
        
        // Vérifier si l'utilisateur est connecté
        const { data: { user }, error: authError } = await supabase!.auth.getUser();
        if (authError || !user) {
          throw new Error('Vous devez être connecté pour créer une tournée');
        }
        
        console.log('✅ Utilisateur connecté pour nouvelle tournée:', user.id);
        
        // Récupérer le profil pro pour obtenir le pro_id
        const { data: proProfile, error: proProfileError } = await supabase!
          .from('pro_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (proProfileError || !proProfile) {
          throw new Error('Profil professionnel non trouvé');
        }

        console.log('🔍 Pro ID récupéré:', proProfile.id);
        
        // Récupérer les rendez-vous confirmés sans tournée
        const { data: appointmentsData, error: appointmentsError } = await supabase!
          .from('appointments')
          .select('id, main_slot, status, comment, duration_minutes, tour_id, equide_ids, proprio_id, address')
          .eq('pro_id', proProfile.id)
          .eq('status', 'confirmed')
          .is('tour_id', null)
          .gte('main_slot', new Date().toISOString())
          .order('main_slot', { ascending: true });

        if (appointmentsError) {
          console.error('❌ Erreur rendez-vous:', appointmentsError);
          throw new Error('Erreur lors de la récupération des rendez-vous');
        }
        
        console.log('📅 Rendez-vous disponibles:', appointmentsData?.length || 0);
        console.log('📋 Détail des rendez-vous bruts:', appointmentsData);
        
        // Test : Vérifier s'il y a des appointments pour ce pro
        const { data: allAppointments, error: allAppointmentsError } = await supabase!
          .from('appointments')
          .select('id, pro_id, status, main_slot, tour_id')
          .eq('pro_id', proProfile.id);
        
        console.log('🔍 Tous les appointments pour ce pro:');
        console.log('- Nombre total:', allAppointments?.length || 0);
        console.log('- Données:', allAppointments);
        console.log('- Erreur:', allAppointmentsError);
        
        // Enrichir les données des propriétaires et des équidés
        const enrichedAppointments = await Promise.all(
          (appointmentsData || []).map(async (appointment) => {
            let proprioData: any = {
              proprio_profiles: {
                prenom: '',
                nom: '',
                telephone: '',
                adresse: '',
                users: { email: '' }
              }
            };
            let equides: any[] = [];
            
            // Récupérer les données du propriétaire
            if (appointment.proprio_id) {
              const { data: proprioProfile } = await supabase!
                .from('proprio_profiles')
                .select('prenom, nom, telephone, adresse')
                .eq('user_id', appointment.proprio_id)
                .single();
              
              if (proprioProfile) {
                // Récupérer l'email depuis la table users
                const { data: userData } = await supabase!
                  .from('users')
                  .select('email')
                  .eq('id', appointment.proprio_id)
                  .single();
                
                proprioData = {
                  proprio_profiles: {
                    ...proprioProfile,
                    users: userData ? { email: userData.email } : {}
                  }
                };
              }
            }
            
            // Récupérer les noms des équidés
            if (appointment.equide_ids && appointment.equide_ids.length > 0) {
              const { data: equidesData, error: equidesError } = await supabase!
                .from('equides')
                .select('nom')
                .in('id', appointment.equide_ids);
              
              console.log('🐴 Équidés récupérés pour appointment', appointment.id, ':', equidesData, 'Erreur:', equidesError);
              equides = equidesData || [];
            }
            
            return {
              ...appointment,
              ...proprioData,
              equides
            };
          })
        );
        
        console.log('✅ Rendez-vous enrichis:', enrichedAppointments);
        setAppointments(enrichedAppointments);
        
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
    if (rdv.equides && rdv.equides.length > 0) {
      return rdv.equides.map(equide => equide.nom).join(', ');
    }
    return rdv.equide_ids && rdv.equide_ids.length > 0 
      ? 'Équidé non spécifié' 
      : 'N/A';
  };

  const getAddress = (rdv: Appointment) => {
    // Priorité à l'adresse spécifique du rendez-vous
    if (rdv.address && rdv.address.trim() !== '') {
      return rdv.address;
    }
    // Fallback sur l'adresse du propriétaire
    return rdv.proprio_profiles?.adresse || 'Adresse non spécifiée';
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
      
      // Vérifier que Supabase est initialisé
      if (!supabase) {
        throw new Error('Client Supabase non initialisé');
      }
      
      // Vérifier si l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase!.auth.getUser();
      if (authError || !user) {
        throw new Error('Vous devez être connecté pour créer une tournée');
      }
      
      const selectedAppointmentsData = appointments.filter(apt => 
        selectedAppointments.includes(apt.id)
      );
      
      if (selectedAppointmentsData.length < 2) {
        throw new Error('Veuillez sélectionner au moins 2 rendez-vous pour créer une tournée');
      }
      
      if (!selectedDate) {
        throw new Error('Veuillez sélectionner une date pour la tournée');
      }
      
      // Créer la tournée
      // Utiliser la date sélectionnée par l'utilisateur
      const tourDate = selectedDate;
      
      const { data: tourData, error: tourError } = await supabase!
        .from('tours')
        .insert({
          pro_id: user.id,
          name: tourName || `Tournée du ${formatDateLabel(tourDate)}`,
          date: tourDate,
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
      const { error: updateError } = await supabase!
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
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#111827]">
              Rendez-vous disponibles
            </label>
            {selectedCount > 0 && (
              <span className="text-xs text-[#f86f4d] font-medium">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                {selectedCount < 2 && ' (minimum 2 requis)'}
              </span>
            )}
          </div>
          
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
                            <p className="text-sm text-gray-500">{appointment.comment || 'Consultation'} • {getAddress(appointment)}</p>
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
            disabled={selectedCount < 2 || !selectedDate || loading}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {loading ? 'Création...' : 'Créer la tournée'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
