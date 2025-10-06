'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import NouvelleTourneeModal from '@/app/dashboard/pro/components/NouvelleTourneeModal';
import ClientDetailModal from '@/app/dashboard/pro/components/ClientDetailModal';
import { Calendar, MapPin, Clock, Users, Phone, Navigation, Plus, ChevronDown, Loader2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import DeleteTourModal from '@/app/dashboard/pro/components/DeleteTourModal';
import Toast from '@/app/dashboard/pro/components/Toast';
import { calculateTourDistance, formatDistance } from './utils/distanceCalculator';

interface RendezVous {
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
  const [tourDistances, setTourDistances] = useState<Record<string, number | null>>({});


  // Supprimer automatiquement les tournées expirées
  const deleteExpiredTours = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Récupérer les tournées expirées
      const { data: expiredTours, error: expiredError } = await supabase
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
          const { error: updateError } = await supabase
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
        const { error: deleteError } = await supabase
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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Vous devez être connecté pour voir vos tournées');
        }
        
        console.log('✅ Utilisateur connecté pour tournées:', user.id);

        // Supprimer automatiquement les tournées expirées
        await deleteExpiredTours(user.id);
        
        // Récupérer les tournées avec leurs rendez-vous
        const { data: toursData, error: toursError } = await supabase
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
        
        setTournees(toursData || []);
        
        // Calculer les distances après avoir chargé les tournées
        if (toursData && toursData.length > 0) {
          calculateAllDistances(toursData);
        }
        
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchTournees();
  }, []);

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
      const { error: updateAppointmentsError } = await supabase
        .from('appointments')
        .update({ tour_id: null })
        .eq('tour_id', tourToDelete.id);

      if (updateAppointmentsError) {
        console.error('❌ Erreur mise à jour appointments:', updateAppointmentsError);
        throw new Error('Erreur lors de la mise à jour des rendez-vous');
      }

      // Supprimer la tournée
      const { error: deleteTourError } = await supabase
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

  const getEquideName = (rdv: RendezVous) => {
    return rdv.equide_ids && rdv.equide_ids.length > 0 
      ? `Équidé ${rdv.equide_ids[0]}` 
      : 'N/A';
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
    return appointments[0].proprio_profiles.adresse;
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

  // Calculer les distances de toutes les tournées
  const calculateAllDistances = async (tours: Tournee[]) => {
    const distances: Record<string, number | null> = {};
    
    for (const tour of tours) {
      if (tour.appointments && tour.appointments.length > 1) {
        try {
          const result = await calculateTourDistance(tour.appointments, false);
          distances[tour.id] = result.distance;
        } catch (error) {
          console.error(`Erreur calcul distance tour ${tour.id}:`, error);
          distances[tour.id] = null;
        }
      } else {
        distances[tour.id] = 0;
      }
    }
    
    setTourDistances(distances);
  };

  const handleViewClient = (rdv: RendezVous) => {
    setSelectedClient({
      prenom: rdv.proprio_profiles.prenom,
      nom: rdv.proprio_profiles.nom,
      email: rdv.proprio_profiles.users.email,
      telephone: rdv.proprio_profiles.telephone,
      adresse: rdv.proprio_profiles.adresse,
      equides: rdv.equide_ids || [],
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
                      <div className="flex items-center space-x-4 text-sm text-neutral-500">
                        <span>{formatDate(tournee.date)}</span>
                        <span>•</span>
                        <span>{tournee.appointments.length} rendez-vous</span>
                        <span>•</span>
                        <span>{formatDistance(tourDistances[tournee.id])}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(tournee);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    />
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
                            <span className="text-sm font-medium text-neutral-500">
                              {formatTime(rdv.main_slot)}
                            </span>
                            <span className="text-sm font-medium text-neutral-900">
                              {getClientName(rdv)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-neutral-500">
                              {rdv.proprio_profiles?.adresse?.split(',')[0]}
                            </span>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className="text-xs text-neutral-500">
                              {getEquideName(rdv)}
                            </span>
                      </div>
                        </div>
                        <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                            icon={<Users className="w-3 h-3" />}
                        onClick={() => handleViewClient(rdv)}
                            className="text-neutral-400 hover:text-neutral-600"
                          />
                      <Button
                        variant="ghost"
                        size="sm"
                            icon={<Navigation className="w-3 h-3" />}
                            onClick={() => handleOpenGPS(rdv.proprio_profiles.adresse)}
                            className="text-neutral-400 hover:text-neutral-600"
                          />
                      <Button
                        variant="ghost"
                        size="sm"
                            icon={<Phone className="w-3 h-3" />}
                            onClick={() => handleCallClient(rdv.proprio_profiles.telephone)}
                            className="text-neutral-400 hover:text-neutral-600"
                          />
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
