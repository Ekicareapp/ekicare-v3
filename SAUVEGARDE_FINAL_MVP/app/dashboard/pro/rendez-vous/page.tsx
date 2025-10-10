'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Tabs from '@/app/dashboard/pro/components/Tabs';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Eye, X, CheckCircle, RotateCcw, Clock, FileText, MoreVertical, Edit3, Calendar, MapPin, Phone, User } from 'lucide-react';
import Toast from '../components/Toast';
import { formatDateTimeForDisplay, createUTCDateTime } from '@/lib/dateUtils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🎭 MODE MOCK - Mettre à true pour utiliser les données fictives
const USE_MOCK_DATA = false;

interface Appointment {
  id: string;
  pro_id: string;
  proprio_id: string;
  equide_ids: string[];
  main_slot: string;
  alternative_slots: string[];
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'rescheduled' | 'completed' | 'canceled';
  comment: string;
  address?: string; // Adresse exacte du rendez-vous saisie par le propriétaire
  address_lat?: number; // Latitude de l'adresse du rendez-vous
  address_lng?: number; // Longitude de l'adresse du rendez-vous
  compte_rendu?: string;
  compte_rendu_updated_at?: string;
  created_at: string;
  updated_at: string;
  equides?: Array<{ nom: string }>;
  pro_profiles?: {
    prenom: string;
    nom: string;
    profession: string;
    ville_nom: string;
    photo_url?: string;
  };
  proprio_profiles?: {
    prenom: string;
    nom: string;
    telephone: string;
    adresse?: string; // Adresse du profil du propriétaire (fallback)
  };
}

interface OrganizedAppointments {
  pending: Appointment[];
  confirmed: Appointment[];
  rescheduled: Appointment[];
  completed: Appointment[];
  rejected: Appointment[];
  canceled: Appointment[];
}

// 🎭 DONNÉES MOCK POUR TESTS
const getMockAppointments = (): OrganizedAppointments => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return {
    pending: [
      {
        id: 'mock-pending-1',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-1',
        equide_ids: ['equide-1'],
        main_slot: tomorrow.toISOString(),
        alternative_slots: [
          new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString()
        ],
        duration_minutes: 60,
        status: 'pending',
        comment: 'Visite de routine pour vaccination annuelle',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Tonnerre' }],
        proprio_profiles: {
          prenom: 'Marie',
          nom: 'Dubois',
          telephone: '06 12 34 56 78'
        }
      },
      {
        id: 'mock-pending-2',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-2',
        equide_ids: ['equide-2', 'equide-3'],
        main_slot: nextWeek.toISOString(),
        alternative_slots: [],
        duration_minutes: 90,
        status: 'pending',
        comment: 'Contrôle dentaire urgent - deux chevaux',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Éclair' }, { nom: 'Tempête' }],
        proprio_profiles: {
          prenom: 'Jean',
          nom: 'Martin',
          telephone: '06 98 76 54 32'
        }
      }
    ],
    confirmed: [
      {
        id: 'mock-confirmed-1',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-3',
        equide_ids: ['equide-4'],
        main_slot: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        alternative_slots: [],
        duration_minutes: 45,
        status: 'confirmed',
        comment: 'Ostéopathie - boiterie patte avant droite',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Bella' }],
        proprio_profiles: {
          prenom: 'Sophie',
          nom: 'Bernard',
          telephone: '07 11 22 33 44'
        }
      },
      {
        id: 'mock-confirmed-2',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-4',
        equide_ids: ['equide-5'],
        main_slot: tomorrow.toISOString(),
        alternative_slots: [],
        duration_minutes: 60,
        status: 'confirmed',
        comment: 'Ferrage prévu - préparation pour concours',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Sultan' }],
        proprio_profiles: {
          prenom: 'Pierre',
          nom: 'Lefebvre',
          telephone: '06 55 44 33 22'
        }
      }
    ],
    rescheduled: [
      {
        id: 'mock-rescheduled-1',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-5',
        equide_ids: ['equide-6'],
        main_slot: nextWeek.toISOString(),
        alternative_slots: [],
        duration_minutes: 60,
        status: 'rescheduled',
        comment: 'Consultation dermatologique - démangeaisons',
        created_at: lastWeek.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Luna' }],
        proprio_profiles: {
          prenom: 'Emma',
          nom: 'Moreau',
          telephone: '06 77 88 99 00'
        }
      }
    ],
    completed: [
      {
        id: 'mock-completed-1',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-6',
        equide_ids: ['equide-7'],
        main_slot: yesterday.toISOString(),
        alternative_slots: [],
        duration_minutes: 90,
        status: 'completed',
        comment: 'Visite de suivi post-opératoire',
        compte_rendu: 'Excellent rétablissement. Cicatrisation normale. Pas d\'inflammation. Reprise progressive de l\'activité recommandée sur 2 semaines. Contrôle dans 1 mois.',
        compte_rendu_updated_at: now.toISOString(),
        created_at: lastWeek.toISOString(),
        updated_at: yesterday.toISOString(),
        equides: [{ nom: 'Océan' }],
        proprio_profiles: {
          prenom: 'Claire',
          nom: 'Petit',
          telephone: '06 44 55 66 77'
        }
      },
      {
        id: 'mock-completed-2',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-7',
        equide_ids: ['equide-8'],
        main_slot: lastWeek.toISOString(),
        alternative_slots: [],
        duration_minutes: 60,
        status: 'completed',
        comment: 'Rendez-vous annulé par le client',
        created_at: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: lastWeek.toISOString(),
        equides: [{ nom: 'Saphir' }],
        proprio_profiles: {
          prenom: 'Lucas',
          nom: 'Roux',
          telephone: '06 33 22 11 00'
        }
      }
    ],
    rejected: [
      {
        id: 'mock-rejected-1',
        pro_id: 'mock-pro-1',
        proprio_id: 'mock-proprio-8',
        equide_ids: ['equide-9'],
        main_slot: tomorrow.toISOString(),
        alternative_slots: [],
        duration_minutes: 45,
        status: 'rejected',
        comment: 'Urgence vétérinaire - coliques',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        equides: [{ nom: 'Rebel' }],
        proprio_profiles: {
          prenom: 'Thomas',
          nom: 'Garnier',
          telephone: '06 22 33 44 55'
        }
      }
    ],
    canceled: []
  };
};

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompteRenduModalOpen, setIsCompteRenduModalOpen] = useState(false);
  const [isReplanificationModalOpen, setIsReplanificationModalOpen] = useState(false);
  const [isCompteRenduEditModalOpen, setIsCompteRenduEditModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<OrganizedAppointments>({
    pending: [],
    confirmed: [],
    rescheduled: [],
    completed: [],
    rejected: [],
    canceled: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Fonction pour afficher les toasts
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Charger les rendez-vous
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // 🎭 Utiliser les données mock
      console.log('🎭 MODE MOCK ACTIVÉ - Utilisation de données fictives');
      setAppointments(getMockAppointments());
      setLoading(false);
    } else {
      fetchAppointments();
      checkPastAppointments();
      
      // Vérifier automatiquement les statuts toutes les 5 minutes (fallback)
      const interval = setInterval(() => {
        fetchAppointments();
        checkPastAppointments();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // Supabase Realtime pour les mises à jour automatiques
  useEffect(() => {
    if (USE_MOCK_DATA) {
      console.log('🎭 MODE MOCK - Realtime désactivé');
      return;
    }
    
    const setupRealtimeSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('❌ Aucune session pour Realtime');
          return;
        }

        // Récupérer l'ID de l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer le rôle de l'utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!userData) return;

        // Construire le filtre selon le rôle
        let filter = '';
        if (userData.role === 'PROPRIETAIRE') {
          filter = `proprio_id=eq.${user.id}`;
        } else if (userData.role === 'PRO') {
          // Pour les PRO, on doit récupérer leur pro_id
          const { data: proProfile } = await supabase
            .from('pro_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (proProfile) {
            filter = `pro_id=eq.${proProfile.id}`;
          }
        }

        if (!filter) return;

        console.log('🔄 Configuration Realtime pour:', filter);

        // Écouter les changements sur la table appointments
        const channel = supabase
          .channel('appointments-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'appointments',
              filter: filter
            },
            (payload) => {
              console.log('📡 Changement Realtime détecté:', payload);
              
              // Rafraîchir les données
              fetchAppointments();
            }
          )
          .subscribe();

        return () => {
          console.log('🔌 Déconnexion Realtime');
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('❌ Erreur Realtime:', error);
      }
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Fermer le menu en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as Element).closest('.menu-container')) {
        setActiveMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeMenuId) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeMenuId]);

  const checkPastAppointments = async () => {
    try {
      await fetch('/api/appointments/update-status', { method: 'POST' });
    } catch (error) {
      console.error('Error checking past appointments:', error);
    }
  };

      const fetchAppointments = async () => {
        try {
          setLoading(true);
          
          // Récupérer le token d'authentification depuis Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            console.error('❌ Aucune session active');
            return;
          }
          
          const response = await fetch('/api/appointments', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          const result = await response.json();

      if (!response.ok) {
        console.error('Erreur API:', result.error);
        return;
      }

      // Organiser les rendez-vous par statut
      const organizedAppointments = {
        pending: [],
        confirmed: [],
        rescheduled: [],
        completed: [],
        rejected: [],
        canceled: []
      };

      (result.data || []).forEach((appointment: Appointment) => {
        const status = appointment.status as keyof OrganizedAppointments;
        if (status in organizedAppointments) {
          (organizedAppointments[status] as Appointment[]).push(appointment);
        }
      });

      setAppointments(organizedAppointments);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, action: string, data?: any) => {
    try {
      setActionLoading(appointmentId);
      
      if (USE_MOCK_DATA) {
        // 🎭 MODE MOCK - Simuler la mise à jour
        console.log('🎭 MOCK - Action:', action, 'sur RDV:', appointmentId);
        
        // Simuler un délai de 500ms
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le rendez-vous et le déplacer dans le bon statut
        const allAppointments = {
          ...appointments
        };
        
        let targetAppointment: Appointment | null = null;
        let sourceStatus: keyof OrganizedAppointments | null = null;
        
        // Trouver le rendez-vous
        for (const [status, appointmentsList] of Object.entries(allAppointments)) {
          const found = appointmentsList.find((a: Appointment) => a.id === appointmentId);
          if (found) {
            targetAppointment = found;
            sourceStatus = status as keyof OrganizedAppointments;
            break;
          }
        }
        
        if (!targetAppointment || !sourceStatus) {
          showToast('Rendez-vous non trouvé', 'error');
          setActionLoading(null);
          return;
        }
        
        // Retirer le rendez-vous de son statut actuel
        allAppointments[sourceStatus] = allAppointments[sourceStatus].filter(
          (a: Appointment) => a.id !== appointmentId
        );
        
        // Déterminer le nouveau statut et mettre à jour le rendez-vous
        let newStatus: keyof OrganizedAppointments = sourceStatus;
        
        if (action === 'accept') {
          newStatus = 'confirmed';
          targetAppointment.status = 'confirmed';
        } else if (action === 'reject') {
          newStatus = 'rejected';
          targetAppointment.status = 'rejected';
        } else if (action === 'reschedule') {
          newStatus = 'rescheduled';
          targetAppointment.status = 'rescheduled';
          if (data?.main_slot) targetAppointment.main_slot = data.main_slot;
          if (data?.alternative_slots) targetAppointment.alternative_slots = data.alternative_slots;
        } else if (action === 'cancel') {
          newStatus = 'canceled';
          targetAppointment.status = 'canceled';
        } else if (action === 'cancel_reschedule') {
          newStatus = 'confirmed';
          targetAppointment.status = 'confirmed';
        } else if (action === 'add_compte_rendu') {
          targetAppointment.compte_rendu = data?.compte_rendu;
          targetAppointment.compte_rendu_updated_at = new Date().toISOString();
        }
        
        // Ajouter le rendez-vous dans le nouveau statut
        allAppointments[newStatus].push(targetAppointment);
        
        setAppointments(allAppointments);
      } else {
        // Mode normal avec Supabase
        // Préparer les données selon l'action
        let updateData: any = {};
        
        if (action === 'accept') {
          updateData.status = 'confirmed';
        } else if (action === 'reject') {
          updateData.status = 'rejected';
        } else if (action === 'reschedule') {
          updateData.status = 'rescheduled';
          if (data?.main_slot) updateData.main_slot = data.main_slot;
          if (data?.alternative_slots) updateData.alternative_slots = data.alternative_slots;
        } else if (action === 'cancel') {
          updateData.status = 'canceled';
        } else if (action === 'cancel_reschedule') {
          updateData.status = 'confirmed';
        } else if (action === 'add_compte_rendu') {
          updateData.compte_rendu = data?.compte_rendu;
        }
        
        // Récupérer le token d'authentification depuis Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('❌ Aucune session active');
          showToast('Erreur d\'authentification. Veuillez vous reconnecter.', 'error');
          return;
        }

        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Erreur API:', result.error);
          showToast(result.error || 'Erreur lors de la mise à jour', 'error');
          return;
        }

        // Mettre à jour localement
        await fetchAppointments();
      }
      
      if (action === 'accept') {
        showToast('Rendez-vous accepté avec succès', 'success');
      } else if (action === 'reject') {
        showToast('Rendez-vous refusé', 'success');
      } else if (action === 'reschedule') {
        showToast('Demande de replanification envoyée au client', 'success');
      } else if (action === 'cancel') {
        showToast('Rendez-vous annulé avec succès', 'success');
      } else if (action === 'cancel_reschedule') {
        showToast('Demande de replanification annulée', 'success');
      } else if (action === 'add_compte_rendu') {
        showToast('Compte rendu ajouté avec succès', 'success');
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Une erreur est survenue', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'pending', label: 'En attente', count: appointments.pending.length },
    { id: 'confirmed', label: 'À venir', count: appointments.confirmed.length },
    { id: 'rescheduled', label: 'Replanifiés', count: appointments.rescheduled.length },
    { id: 'rejected', label: 'Refusés', count: appointments.rejected.length },
    { id: 'completed', label: 'Terminés', count: appointments.completed.length + appointments.canceled.length }
  ];

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'À venir',
      'rescheduled': 'Replanifié',
      'rejected': 'Refusé',
      'completed': 'Terminé',
      'canceled': 'Annulé'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadge = (appointment: Appointment) => {
    if (appointment.status === 'completed') {
      // Tous les rendez-vous completed s'affichent comme "Terminé"
      return {
        text: 'Terminé',
        variant: 'success'
      };
    } else if (appointment.status === 'canceled') {
      // Nouveau statut pour les rendez-vous annulés
      return {
        text: 'Annulé',
        variant: 'warning'
      };
    }
    return null;
  };

  const formatDateTime = (dateTime: string) => {
    return formatDateTimeForDisplay(dateTime);
  };

  // Fonction pour détecter si un rendez-vous a été replanifié
  const isRescheduled = (appointment: Appointment) => {
    return appointment.status === 'pending' && 
           appointment.updated_at && 
           appointment.created_at &&
           new Date(appointment.updated_at) > new Date(appointment.created_at);
  };

  // Fonction pour formater l'affichage des dates replanifiées
  const formatRescheduledDateTime = (appointment: Appointment) => {
    const { date: newDate, time: newTime } = formatDateTime(appointment.main_slot);
    
    // Si c'est un rendez-vous replanifié, on affiche l'ancienne et la nouvelle date
    if (isRescheduled(appointment)) {
      // Pour l'instant, on affiche juste la nouvelle date
      // TODO: Récupérer l'ancienne date depuis l'historique si disponible
      return {
        newDate,
        newTime,
        showRescheduled: true
      };
    }
    
    return {
      newDate: newDate,
      newTime: newTime,
      showRescheduled: false
    };
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleViewCompteRendu = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCompteRenduModalOpen(true);
  };

  const handleReplanifier = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsReplanificationModalOpen(true);
    closeMenu();
  };

  const handleConfirmReplanification = async (newDateTime: string, alternativeSlots: string[] = []) => {
    if (!selectedAppointment) return;
    
    await updateAppointmentStatus(selectedAppointment.id, 'reschedule', {
      main_slot: newDateTime,
      alternative_slots: alternativeSlots
    });
      
      setIsReplanificationModalOpen(false);
  };

  const handleEditCompteRendu = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCompteRenduEditModalOpen(true);
    closeMenu();
  };

  const handleSaveCompteRendu = async (reportText: string) => {
    if (!selectedAppointment) return;
    
    await updateAppointmentStatus(selectedAppointment.id, 'add_compte_rendu', {
      compte_rendu: reportText
    });
    
      setIsCompteRenduEditModalOpen(false);
  };

  const handleViewClient = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsClientModalOpen(true);
    closeMenu();
  };

  const handleCallClient = (appointment: Appointment) => {
    if (appointment.proprio_profiles?.telephone) {
      window.open(`tel:${appointment.proprio_profiles.telephone}`, '_self');
    } else {
      showToast('Numéro de téléphone non disponible', 'error');
    }
    closeMenu();
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
    closeMenu();
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointmentStatus(selectedAppointment.id, 'cancel');
      setIsCancelModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      showToast('Une erreur est survenue lors de l\'annulation', 'error');
    }
  };

  const handleCancelReschedule = async (appointment: Appointment) => {
    if (!appointment) return;
    
    try {
      // Remettre le statut à "confirmed" pour annuler la replanification
      await updateAppointmentStatus(appointment.id, 'cancel_reschedule');
      showToast('Demande de replanification annulée', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la replanification:', error);
      showToast('Une erreur est survenue', 'error');
    }
    closeMenu();
  };

  const handleOpenGPS = (appointment: Appointment) => {
    // Priorité 1 : Coordonnées GPS exactes si disponibles
    if (appointment.address_lat && appointment.address_lng) {
      console.log('📍 Ouverture GPS avec coordonnées exactes:', appointment.address_lat, appointment.address_lng);
      // Utiliser les coordonnées exactes pour l'itinéraire
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${appointment.address_lat},${appointment.address_lng}&travelmode=driving`, '_blank');
    }
    // Priorité 2 : Adresse exacte du rendez-vous
    else if (appointment.address) {
      console.log('📍 Ouverture GPS avec l\'adresse du RDV:', appointment.address);
      const encodedAddress = encodeURIComponent(appointment.address);
      // Utiliser l'API Directions pour ouvrir directement l'itinéraire
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`, '_blank');
    } 
    // Priorité 3 : Fallback avec adresse du profil
    else {
      const fallbackAddress = appointment.proprio_profiles?.adresse || 
        (appointment.proprio_profiles?.prenom && appointment.proprio_profiles?.nom 
          ? `${appointment.proprio_profiles.prenom} ${appointment.proprio_profiles.nom}`
          : 'Adresse du client');
      
      console.log('📍 Ouverture GPS avec l\'adresse de fallback:', fallbackAddress);
      const encodedAddress = encodeURIComponent(fallbackAddress);
      // Utiliser l'API Directions pour ouvrir directement l'itinéraire
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`, '_blank');
    }
    closeMenu();
  };

  const toggleMenu = (appointmentId: string) => {
    setActiveMenuId(activeMenuId === appointmentId ? null : appointmentId);
  };

  const closeMenu = () => {
    setActiveMenuId(null);
  };

  const getMenuActions = (appointment: Appointment) => {
    const actions = [
      {
        label: 'Voir détail',
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {
          handleViewDetails(appointment);
          closeMenu();
        }
      }
    ];

    switch (appointment.status) {
      case 'pending':
        // En attente : Le pro peut accepter, refuser ou replanifier
        actions.push(
          {
            label: 'Accepter',
            icon: <CheckCircle className="w-4 h-4" />,
            onClick: () => {
              updateAppointmentStatus(appointment.id, 'accept');
              closeMenu();
            }
          },
          {
            label: 'Refuser',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              updateAppointmentStatus(appointment.id, 'reject');
              closeMenu();
            }
          },
          {
            label: 'Replanifier',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => {
              handleReplanifier(appointment);
            }
          }
        );
        break;
      
      case 'confirmed':
        // À venir : Annuler ou demander une replanification
        actions.push(
          {
            label: 'Appeler',
            icon: <Phone className="w-4 h-4" />,
            onClick: () => {
              handleCallClient(appointment);
            }
          },
          {
            label: 'Ouvrir GPS',
            icon: <MapPin className="w-4 h-4" />,
            onClick: () => {
              handleOpenGPS(appointment);
            }
          },
          {
            label: 'Replanifier',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => {
              handleReplanifier(appointment);
            }
          },
          {
            label: 'Annuler le rendez-vous',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              handleCancelAppointment(appointment);
            }
          }
        );
        break;
      
      case 'rescheduled':
        // Replanifiés : Annuler sa demande de replanification
        actions.push({
          label: 'Annuler la replanification',
          icon: <X className="w-4 h-4" />,
          onClick: () => {
            handleCancelReschedule(appointment);
          }
        });
        break;
      
      case 'rejected':
        // Refusés : Affichage en lecture seule
        break;
      
      case 'completed':
        // Terminés : Ajouter/modifier compte-rendu
        actions.push({
          label: appointment.compte_rendu ? 'Modifier le compte-rendu' : 'Ajouter un compte-rendu',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: () => {
            handleEditCompteRendu(appointment);
          }
        });
        
        if (appointment.compte_rendu) {
          actions.push({
            label: 'Voir le compte-rendu',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => {
              handleViewCompteRendu(appointment);
              closeMenu();
            }
          });
        }
        break;
    }

    return actions;
  };

  // Pour le tab "Terminés", inclure aussi les rendez-vous "canceled" (annulés)
  const filteredAppointments = activeTab === 'completed'
    ? [...(appointments.completed || []), ...(appointments.canceled || [])]
    : (appointments[activeTab as keyof OrganizedAppointments] || []);

  if (loading) {
    return (
      <div className="space-y-8 overflow-x-hidden">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Mes rendez-vous</h1>
          <p className="text-[#6b7280] text-lg">Gérez vos rendez-vous avec vos clients</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="elevated" className="min-h-[120px] animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-x-hidden min-h-[90vh]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Mes rendez-vous</h1>
        <p className="text-[#6b7280] text-lg">Gérez vos rendez-vous avec vos clients</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="gap-1"
      />

      {/* Rendez-vous List */}
      <div className="space-y-3 relative">
        {filteredAppointments.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 min-h-[120px] flex items-center justify-center">
            <div>
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-[#6b7280]" />
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucun rendez-vous</h3>
              <p className="text-[#6b7280]">Aucun rendez-vous trouvé pour cette catégorie.</p>
            </div>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => {
            const { newDate, newTime, showRescheduled } = formatRescheduledDateTime(appointment);
            const isActionLoading = actionLoading === appointment.id;
            const statusBadge = getStatusBadge(appointment);
            
            return (
              <div key={appointment.id} className="relative">
              <Card variant="elevated" hover={false} className="min-h-[120px] group relative z-0">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-[#f86f4d]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-[#111827]">
                            {appointment.comment.length > 50 
                              ? `${appointment.comment.substring(0, 50)}...` 
                              : appointment.comment}
                          </h3>
                          {statusBadge && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              statusBadge.variant === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {statusBadge.text}
                            </span>
                          )}
                        </div>
                      <p className="text-sm text-[#6b7280] mb-1">
                          {appointment.proprio_profiles?.prenom} {appointment.proprio_profiles?.nom}
                          {appointment.equides && appointment.equides.length > 0 && ` • ${appointment.equides.map((e: any) => e.nom).join(', ')}`}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                          {showRescheduled ? (
                            <span className="flex items-center gap-2">
                              <span className="text-gray-400 line-through text-xs">
                                Replanifié
                              </span>
                              <span className="text-[#6b7280] font-medium">
                                {newDate} à {newTime}
                              </span>
                            </span>
                          ) : (
                            `${newDate} à ${newTime}`
                          )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                      {isActionLoading && (
                        <div className="w-5 h-5 border-2 border-[#f86f4d] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    <button
                        onClick={() => toggleMenu(appointment.id)}
                      className="menu-container p-2 text-[#6b7280] hover:text-[#f86f4d] transition-colors duration-200 rounded-lg hover:bg-[#f9fafb]"
                      title="Actions"
                        disabled={isActionLoading}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Menu contextuel */}
                {activeMenuId === appointment.id && (
                <div className="menu-container absolute top-12 right-2 bg-white border border-[#e5e7eb] rounded-lg shadow-xl min-w-[200px] py-1 z-[99999]">
                    {getMenuActions(appointment).map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-[#111827] hover:bg-[#f9fafb] transition-colors duration-150"
                    >
                      <span className="text-[#6b7280]">{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Détails du rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Client</label>
                <p className="text-[#111827]">
                  {selectedAppointment.proprio_profiles?.prenom} {selectedAppointment.proprio_profiles?.nom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Téléphone</label>
                <p className="text-[#111827]">{selectedAppointment.proprio_profiles?.telephone || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Statut</label>
                <p className="text-[#111827]">{getStatusLabel(selectedAppointment.status)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Durée</label>
                <p className="text-[#111827]">{selectedAppointment.duration_minutes} minutes</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Date et heure</label>
              <p className="text-[#111827]">{formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}</p>
            </div>

            {selectedAppointment.address && (
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Adresse</label>
                <p className="text-[#111827]">{selectedAppointment.address}</p>
              </div>
            )}

            {selectedAppointment.alternative_slots && selectedAppointment.alternative_slots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Créneaux alternatifs proposés</label>
                <div className="space-y-1">
                  {selectedAppointment.alternative_slots.map((slot, index) => {
                    const { date, time } = formatDateTime(slot);
                    return (
                      <p key={index} className="text-[#111827] text-sm">{date} à {time}</p>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Motif de consultation</label>
              <p className="text-[#111827]">{selectedAppointment.comment}</p>
            </div>

              <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Équidés concernés</label>
              <p className="text-[#111827]">
                {selectedAppointment.equides && selectedAppointment.equides.length > 0 
                  ? selectedAppointment.equides.map((e: any) => e.nom).join(', ')
                  : 'Aucun équidé renseigné'
                }
              </p>
              </div>
          </div>
        )}
      </Modal>

      {/* Modal Compte-rendu */}
      <Modal
        isOpen={isCompteRenduModalOpen}
        onClose={() => setIsCompteRenduModalOpen(false)}
        title="Compte-rendu du rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-[#f9fafb] p-4 rounded-lg">
              <h4 className="font-medium text-[#111827] mb-2">Rendez-vous</h4>
              <p className="text-sm text-[#6b7280]">
                {selectedAppointment.proprio_profiles?.prenom} {selectedAppointment.proprio_profiles?.nom}
                {selectedAppointment.equides && selectedAppointment.equides.length > 0 && ` • ${selectedAppointment.equides.map((e: any) => e.nom).join(', ')}`}
              </p>
              <p className="text-sm text-[#6b7280]">
                {formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-[#111827] mb-2">Compte-rendu</h4>
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
                <p className="text-[#111827] whitespace-pre-wrap">{selectedAppointment.compte_rendu}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de replanification */}
      <Modal
        isOpen={isReplanificationModalOpen}
        onClose={() => setIsReplanificationModalOpen(false)}
        title="Replanifier le rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-[#f9fafb] p-4 rounded-lg">
              <h4 className="font-medium text-[#111827] mb-2">Rendez-vous actuel</h4>
              <p className="text-sm text-[#6b7280]">
                {formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}
              </p>
            </div>

            {selectedAppointment.alternative_slots && selectedAppointment.alternative_slots.length > 0 && (
              <div>
                <h4 className="font-medium text-[#111827] mb-2">Créneaux alternatifs proposés par le client</h4>
                <div className="space-y-2">
                  {selectedAppointment.alternative_slots.map((slot, index) => {
                    const { date, time } = formatDateTime(slot);
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-[#e5e7eb] rounded-lg">
                        <Calendar className="w-4 h-4 text-[#6b7280]" />
                        <span className="text-sm text-[#111827]">{date} à {time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-[#111827] mb-2">Proposer une nouvelle date</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Date</label>
                  <input
                    type="date"
                    id="new-date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Heure</label>
                  <input
                    type="time"
                    id="new-time"
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsReplanificationModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const dateInput = document.getElementById('new-date') as HTMLInputElement;
                  const timeInput = document.getElementById('new-time') as HTMLInputElement;
                  
                  if (!dateInput.value || !timeInput.value) {
                    showToast('Veuillez sélectionner une date et une heure', 'error');
                    return;
                  }
                  
                  const newDateTime = createUTCDateTime(dateInput.value, timeInput.value);
                  handleConfirmReplanification(newDateTime);
                }}
              >
                Confirmer la replanification
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal d'édition du compte-rendu */}
      <Modal
        isOpen={isCompteRenduEditModalOpen}
        onClose={() => setIsCompteRenduEditModalOpen(false)}
        title={selectedAppointment?.compte_rendu ? "Modifier le compte-rendu" : "Ajouter un compte-rendu"}
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-[#f9fafb] p-4 rounded-lg">
              <h4 className="font-medium text-[#111827] mb-2">Rendez-vous</h4>
              <p className="text-sm text-[#6b7280]">
                {selectedAppointment.proprio_profiles?.prenom} {selectedAppointment.proprio_profiles?.nom}
                {selectedAppointment.equides && selectedAppointment.equides.length > 0 && ` • ${selectedAppointment.equides.map((e: any) => e.nom).join(', ')}`}
              </p>
              <p className="text-sm text-[#6b7280]">
                {formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Compte-rendu</label>
              <textarea
                id="compte-rendu-text"
                defaultValue={selectedAppointment.compte_rendu || ''}
                placeholder="Décrivez le déroulement du rendez-vous, les observations, les recommandations..."
                rows={8}
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150 placeholder-[#9ca3af]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsCompteRenduEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const textarea = document.getElementById('compte-rendu-text') as HTMLTextAreaElement;
                  const reportText = textarea.value.trim();
                  
                  if (reportText.length < 10) {
                    showToast('Le compte-rendu doit contenir au moins 10 caractères', 'error');
                    return;
                  }
                  
                  handleSaveCompteRendu(reportText);
                }}
              >
                {selectedAppointment.compte_rendu ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Fiche client */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Fiche client"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Nom complet</label>
                <p className="text-[#111827]">
                  {selectedAppointment.proprio_profiles?.prenom} {selectedAppointment.proprio_profiles?.nom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Téléphone</label>
                <p className="text-[#111827]">{selectedAppointment.proprio_profiles?.telephone || 'Non renseigné'}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Rendez-vous</label>
              <p className="text-[#111827]">
                {formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Motif de consultation</label>
              <p className="text-[#111827]">{selectedAppointment.comment}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-1">Équidés concernés</label>
              <p className="text-[#111827]">
                {selectedAppointment.equides && selectedAppointment.equides.length > 0 
                  ? selectedAppointment.equides.map((e: any) => e.nom).join(', ')
                  : 'Aucun équidé renseigné'
                }
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsClientModalOpen(false)}
              >
                Fermer
              </Button>
              {selectedAppointment.proprio_profiles?.telephone && (
                <Button
                  variant="primary"
                  onClick={() => handleCallClient(selectedAppointment)}
                  className="flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appeler</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation d'annulation */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Annuler le rendez-vous"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="bg-[#f9fafb] p-4 rounded-lg">
              <h4 className="font-medium text-[#111827] mb-2">Rendez-vous à annuler</h4>
              <p className="text-sm text-[#6b7280]">
                {selectedAppointment.proprio_profiles?.prenom} {selectedAppointment.proprio_profiles?.nom}
                {selectedAppointment.equides && selectedAppointment.equides.length > 0 && ` • ${selectedAppointment.equides.map((e: any) => e.nom).join(', ')}`}
              </p>
              <p className="text-sm text-[#6b7280]">
                {formatDateTime(selectedAppointment.main_slot).date} à {formatDateTime(selectedAppointment.main_slot).time}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[#111827] mb-4">
                Êtes-vous sûr de vouloir annuler ce rendez-vous ?
              </p>
              <p className="text-sm text-[#6b7280]">
                Le client sera informé de l'annulation.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}