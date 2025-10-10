'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import NouvelleTourneeModal from '@/app/dashboard/pro/components/NouvelleTourneeModal';
import ClientDetailModal from '@/app/dashboard/pro/components/ClientDetailModal';
import { Calendar, Users, Phone, Navigation, Plus, ChevronDown, Loader2, Trash2, X, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import DeleteTourModal from '@/app/dashboard/pro/components/DeleteTourModal';
import Toast from '@/app/dashboard/pro/components/Toast';

interface RendezVous {
  id: string;
  main_slot: string;
  status: string;
  comment: string;
  duration_minutes: number;
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

// Interface pour les rendez-vous mockés (design uniquement)
interface MockRendezVous {
  id: string;
  heure: string;
  client: string;
  cheval: string;
  telephone: string;
  adresse: string;
}

interface Tournee {
  id: string;
  name: string;
  date: string;
  notes?: string;
  created_at: string;
  appointments: RendezVous[];
}

export default function TourneesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tournee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [openTours, setOpenTours] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);


  // Supprimer automatiquement les tournées expirées
  const deleteExpiredTours = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Récupérer les tournées expirées
      const { data: expiredTours, error: expiredError } = await supabase!
        .from('tours')
        .select('id, name, date')
        .eq('pro_id', userId)
        .lt('date', today);

      if (expiredError) {
        console.error('❌ Erreur récupération tournées expirées:', expiredError);
        return;
      }

      if (expiredTours && expiredTours.length > 0) {
        console.log(`🧹 Suppression de ${expiredTours.length} tournée(s) expirée(s)`);

        // Mettre à NULL les tour_id des appointments associés
        for (const tour of expiredTours) {
          const { error: updateError } = await supabase!
            .from('appointments')
            .update({ tour_id: null })
            .eq('tour_id', tour.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour appointments pour tour ${tour.id}:`, updateError);
          } else {
            console.log(`✅ Appointments libérés pour tournée: ${tour.name}`);
          }
        }

        // Supprimer les tournées expirées
        const { error: deleteError } = await supabase!
          .from('tours')
          .delete()
          .eq('pro_id', userId)
          .lt('date', today);

        if (deleteError) {
          console.error('❌ Erreur suppression tournées expirées:', deleteError);
        } else {
          console.log(`✅ ${expiredTours.length} tournée(s) expirée(s) supprimée(s)`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur suppression automatique:', error);
    }
  };

  // Charger les tournées depuis Supabase
  useEffect(() => {
    const fetchTournees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { user }, error: authError } = await supabase!.auth.getUser();
        if (authError || !user) {
          throw new Error('Vous devez être connecté pour voir vos tournées');
        }
        
        console.log('✅ Utilisateur connecté pour tournées:', user.id);

        // Supprimer automatiquement les tournées expirées
        await deleteExpiredTours(user.id);
        
        // Récupérer les tournées avec leurs rendez-vous
        const { data: toursData, error: toursError } = await supabase!
          .from('tours')
          .select(`
            id,
            name,
            date,
            notes,
            created_at,
            appointments (
              id,
              main_slot,
              status,
              comment,
              duration_minutes,
              address,
              proprio_id
            )
          `)
          .eq('pro_id', user.id)
          .order('date', { ascending: true });

        if (toursError) {
          console.error('❌ Erreur tournées:', toursError);
          throw new Error('Erreur lors de la récupération des tournées');
        }
        
        console.log('📅 Tournées trouvées:', toursData?.length || 0);
        console.log('📋 Détail des tournées:', toursData);
        
        // Enrichir les données des propriétaires pour chaque appointment
        const enrichedTours = await Promise.all(
          (toursData || []).map(async (tour) => {
            const enrichedAppointments = await Promise.all(
              (tour.appointments || []).map(async (appointment) => {
                let proprioData = {};
                
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
                
                return {
                  ...appointment,
                  ...proprioData
                };
              })
            );
            
            return {
              ...tour,
              appointments: enrichedAppointments
            };
          })
        );
        
        console.log('✅ Tournées enrichies:', enrichedTours);
        setTournees(enrichedTours as any);
        
        
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchTournees();
  }, []);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as Element).closest('.menu-container')) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  // Fonction pour ouvrir la popup de suppression
  const handleDeleteClick = (tour: Tournee) => {
    setTourToDelete(tour);
    setDeleteModalOpen(true);
  };

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;

    try {
      setDeleting(true);

      // Mettre à jour les appointments pour retirer le tour_id
      const { error: updateAppointmentsError } = await supabase!
        .from('appointments')
        .update({ tour_id: null })
        .eq('tour_id', tourToDelete.id);

      if (updateAppointmentsError) {
        console.error('❌ Erreur mise à jour appointments:', updateAppointmentsError);
        throw new Error('Erreur lors de la mise à jour des rendez-vous');
      }

      // Supprimer la tournée
      const { error: deleteTourError } = await supabase!
        .from('tours')
        .delete()
        .eq('id', tourToDelete.id);

      if (deleteTourError) {
        console.error('❌ Erreur suppression tournée:', deleteTourError);
        throw new Error('Erreur lors de la suppression de la tournée');
      }

      // Rafraîchir la liste
      setTournees(prev => prev.filter(tour => tour.id !== tourToDelete.id));
      
      // Fermer la popup et afficher la notification
      setDeleteModalOpen(false);
      setTourToDelete(null);
      setToast({ message: 'Tournée supprimée avec succès.', type: 'success' });
      
      console.log('✅ Tournée supprimée avec succès');
      
    } catch (err) {
      console.error('Error deleting tour:', err);
      setToast({ 
        message: err instanceof Error ? err.message : 'Erreur lors de la suppression', 
        type: 'error' 
      });
    } finally {
      setDeleting(false);
    }
  };

  // Fonction pour fermer la popup de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setTourToDelete(null);
  };

  // Fonctions utilitaires
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClientName = (rdv: RendezVous) => {
    return `${rdv.proprio_profiles.prenom} ${rdv.proprio_profiles.nom}`;
  };


  const getAppointmentAddress = (rdv: RendezVous) => {
    // Priorité à l'adresse spécifique du rendez-vous
    if (rdv.address && rdv.address.trim() !== '') {
      return rdv.address;
    }
    // Fallback sur l'adresse du propriétaire
    return rdv.proprio_profiles.adresse;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalDuration = (appointments: RendezVous[]) => {
    return appointments.reduce((total, rdv) => total + (rdv.duration_minutes || 0), 0);
  };

  // Fonctions utilitaires pour les statistiques des tournées
  const calculateTourStats = (appointments: RendezVous[]) => {
    const totalDuration = calculateTotalDuration(appointments);
    const totalDistance = appointments.length * 5; // Estimation 5km par RDV
    const firstAppointment = appointments.length > 0 ? appointments[0] : null;
    
    return {
      totalDuration,
      totalDistance,
      firstAppointment
    };
  };

  const getFirstClientPhone = (appointments: RendezVous[]) => {
    if (appointments.length === 0) return null;
    return appointments[0].proprio_profiles.telephone;
  };

  const getFirstClientAddress = (appointments: RendezVous[]) => {
    if (appointments.length === 0) return null;
    // Utiliser l'adresse spécifique du rendez-vous en priorité
    const firstAppointment = appointments[0];
    if (firstAppointment.address && firstAppointment.address.trim() !== '') {
      return firstAppointment.address;
    }
    // Fallback sur l'adresse du propriétaire
    return firstAppointment.proprio_profiles.adresse;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };


  const handleCallClient = (telephone: string) => {
    window.open(`tel:${telephone}`, '_self');
  };

  const handleOpenGPS = (adresse: string) => {
    const address = encodeURIComponent(adresse);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const handleOpenMaps = (appointments: RendezVous[]) => {
    if (appointments.length === 0) return;
    const firstAddress = getFirstClientAddress(appointments);
    if (firstAddress) {
      handleOpenGPS(firstAddress);
    }
  };

  const handleCallFirstClient = (appointments: RendezVous[]) => {
    if (appointments.length === 0) return;
    const firstPhone = getFirstClientPhone(appointments);
    if (firstPhone) {
      handleCallClient(firstPhone);
    }
  };


  // Fonctions pour gérer les dropdowns
  const toggleTour = (tourId: string) => {
    setOpenTours(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tourId)) {
        newSet.delete(tourId);
      } else {
        newSet.add(tourId);
      }
      return newSet;
    });
  };

  const isTourOpen = (tourId: string) => openTours.has(tourId);

  const toggleMenu = (appointmentId: string) => {
    setActiveMenuId(activeMenuId === appointmentId ? null : appointmentId);
  };

  const closeMenu = () => {
    setActiveMenuId(null);
  };

  const getMenuActions = (rdv: RendezVous) => {
    const actions = [
      {
        label: 'Voir détail',
        icon: <Users className="w-4 h-4" />,
        onClick: () => {
          handleViewClient(rdv);
          closeMenu();
        }
      },
      {
        label: 'Itinéraire GPS',
        icon: <Navigation className="w-4 h-4" />,
        onClick: () => {
          handleOpenGPS(getAppointmentAddress(rdv));
          closeMenu();
        }
      },
      {
        label: 'Appeler',
        icon: <Phone className="w-4 h-4" />,
        onClick: () => {
          handleCallClient(rdv.proprio_profiles.telephone);
          closeMenu();
        }
      }
    ];
    return actions;
  };


  const handleViewClient = (rdv: RendezVous) => {
    setSelectedClient({
      prenom: rdv.proprio_profiles.prenom,
      nom: rdv.proprio_profiles.nom,
      email: rdv.proprio_profiles.users.email,
      telephone: rdv.proprio_profiles.telephone,
      adresse: getAppointmentAddress(rdv),
      equides: [],
    });
    setIsClientModalOpen(true);
  };

  // Affichage du loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              Mes tournées
            </h1>
            <p className="text-[#6b7280] text-lg">
              Gérez vos déplacements et rendez-vous
            </p>
          </div>
        </div>
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-[#6b7280] animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Chargement...</h3>
          <p className="text-[#6b7280]">
            Récupération de vos tournées en cours
          </p>
        </Card>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              Mes tournées
            </h1>
            <p className="text-[#6b7280] text-lg">
              Gérez vos déplacements et rendez-vous
            </p>
          </div>
        </div>
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Erreur</h3>
          <p className="text-[#6b7280] mb-4">{error}</p>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mes tournées
          </h1>
          <p className="text-[#6b7280] text-lg">
            Gérez vos déplacements et rendez-vous
          </p>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nouvelle tournée
        </Button>
      </div>

      {/* Liste des tournées */}
      <div className="space-y-3">
        {tournees.map((tournee) => {
          const stats = calculateTourStats(tournee.appointments);
          const isOpen = isTourOpen(tournee.id);
          
          return (
            <div key={tournee.id} className="bg-white rounded-xl border border-neutral-200">
              {/* Header cliquable */}
              <div 
                className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => toggleTour(tournee.id)}
            >
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div>
                      <h3 className="text-lg font-medium text-neutral-900">
                        {tournee.name || formatDate(tournee.date)}
                    </h3>
                      <div className="flex items-center space-x-2 text-sm text-neutral-500">
                        <span>{formatDate(tournee.date)}</span>
                        <span>•</span>
                        <span>{tournee.appointments.length} rendez-vous</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteClick(tournee)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer la tournée"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                <ChevronDown 
                      className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                  }`} 
                />
                  </div>
              </div>
            </div>

              {/* Contenu du dropdown */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-neutral-200">
                  <div className={`p-4 space-y-3 ${
                    tournee.appointments.length > 4 ? 'max-h-60 overflow-y-auto' : ''
                  }`}>
                    {tournee.appointments.map((rdv, index) => (
                  <div 
                    key={rdv.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-neutral-600">
                              {formatTime(rdv.main_slot)}
                            </span>
                            <span className="text-sm font-medium text-neutral-900">
                              {getClientName(rdv)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-neutral-500">
                              {getAppointmentAddress(rdv)?.split(',')[0]}
                            </span>
                      </div>
                        </div>
                        <div className="flex items-center">
                      <div className="relative menu-container">
                        <button
                          onClick={() => toggleMenu(rdv.id)}
                          className="menu-container p-2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200 rounded-lg hover:bg-neutral-100"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Menu contextuel */}
                        {activeMenuId === rdv.id && (
                          <div className="menu-container absolute top-10 right-0 bg-white border border-neutral-200 rounded-lg shadow-xl min-w-[160px] py-1 z-[99999]">
                            {getMenuActions(rdv).map((action, index) => (
                              <button
                                key={index}
                                onClick={action.onClick}
                                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150"
                              >
                                <span className="text-neutral-500">{action.icon}</span>
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {tournees.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 text-center py-16">
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Aucune tournée planifiée
          </h3>
          <p className="text-neutral-500 mb-6">
            Créez votre première tournée à partir de vos rendez-vous à venir.
          </p>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nouvelle tournée
          </Button>
        </div>
      )}

      {/* Modal Nouvelle tournée */}
      <NouvelleTourneeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTourCreated={() => {
          // Rafraîchir la liste des tournées
          window.location.reload();
        }}
      />

      {/* Modal Détail client */}
      <ClientDetailModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
      />

      {/* Modal Suppression tournée */}
      <DeleteTourModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        tourName={tourToDelete?.name || ''}
        loading={deleting}
      />

      {/* Toast de notification */}
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
