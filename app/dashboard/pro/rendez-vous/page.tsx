'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Tabs from '@/app/dashboard/pro/components/Tabs';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Eye, X, CheckCircle, RotateCcw, Clock, FileText, MoreVertical, Edit3, Calendar, MapPin, Phone } from 'lucide-react';

interface Appointment {
  id: string;
  pro_id: string;
  proprio_id: string;
  equide_ids: string[];
  main_slot: string;
  alternative_slots: string[];
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'rescheduled' | 'completed';
  comment: string;
  compte_rendu?: string;
  compte_rendu_updated_at?: string;
  created_at: string;
  updated_at: string;
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
  };
}

interface OrganizedAppointments {
  pending: Appointment[];
  confirmed: Appointment[];
  rescheduled: Appointment[];
  completed: Appointment[];
  rejected: Appointment[];
}

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
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Charger les rendez-vous
  useEffect(() => {
    fetchAppointments();
    checkPastAppointments();
    
    // Vérifier automatiquement les statuts toutes les 5 minutes
    const interval = setInterval(() => {
      fetchAppointments();
      checkPastAppointments();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
          console.log('🧪 TEST: Utilisation de l\'API de test pour récupérer les appointments');
          const response = await fetch('/api/appointments/test');
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
        rejected: []
      };

      (result.data || []).forEach((appointment: Appointment) => {
        organizedAppointments[appointment.status].push(appointment);
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
      } else if (action === 'add_compte_rendu') {
        updateData.compte_rendu = data?.compte_rendu;
      }
      
      console.log('🧪 TEST: Utilisation de l\'API de test pour la mise à jour');
      const response = await fetch(`/api/appointments/test/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Erreur API:', result.error);
        alert(result.error || 'Erreur lors de la mise à jour');
        return;
      }

      // Mettre à jour localement
      await fetchAppointments();
      
      if (action === 'accept') {
        alert('Rendez-vous accepté avec succès');
      } else if (action === 'reject') {
        alert('Rendez-vous refusé');
      } else if (action === 'reschedule') {
        alert('Rendez-vous replanifié avec succès');
      } else if (action === 'add_compte_rendu') {
        alert('Compte rendu ajouté avec succès');
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'pending', label: 'En attente', count: appointments.pending.length },
    { id: 'confirmed', label: 'À venir', count: appointments.confirmed.length },
    { id: 'rescheduled', label: 'Replanifiés', count: appointments.rescheduled.length },
    { id: 'rejected', label: 'Refusés', count: appointments.rejected.length },
    { id: 'completed', label: 'Terminés', count: appointments.completed.length }
  ];

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'À venir',
      'rescheduled': 'Replanifié',
      'rejected': 'Refusé',
      'completed': 'Terminé'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
          return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
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
      new_slot: newDateTime,
      new_alternative_slots: alternativeSlots
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
        // Nouvelles demandes - Le pro a 3 choix
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
        // Rendez-vous acceptés - Pas d'action manuelle nécessaire
        break;
      
      case 'rescheduled':
        // Replanifications faites par le pro - En attente d'acceptation côté propriétaire
        break;
      
      case 'rejected':
        // Rendez-vous refusés - Aucune action possible
        break;
      
      case 'completed':
        // Rendez-vous terminés - Ajouter/modifier compte-rendu
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

  const filteredAppointments = appointments[activeTab as keyof OrganizedAppointments] || [];

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId) {
        closeMenu();
      }
    };

    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

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
    <div className="space-y-8 overflow-x-hidden">
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
      <div className="space-y-3">
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
            const { date, time } = formatDateTime(appointment.main_slot);
            const isActionLoading = actionLoading === appointment.id;
            
            return (
              <div key={appointment.id} className="relative">
              <Card variant="elevated" hover={false} className="min-h-[120px] group">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-[#f86f4d]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#111827] mb-1">
                          {appointment.comment.length > 50 
                            ? `${appointment.comment.substring(0, 50)}...` 
                            : appointment.comment}
                        </h3>
                      <p className="text-sm text-[#6b7280] mb-1">
                          {appointment.proprio_profiles?.prenom} {appointment.proprio_profiles?.nom}
                          {appointment.equides && appointment.equides.length > 0 && ` • ${appointment.equides.map((e: any) => e.nom).join(', ')}`}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                          {date} à {time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                      {isActionLoading && (
                        <div className="w-5 h-5 border-2 border-[#f86f4d] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    <button
                        onClick={() => toggleMenu(appointment.id)}
                      className="p-2 text-[#6b7280] hover:text-[#f86f4d] transition-colors duration-200 rounded-lg hover:bg-[#f9fafb]"
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
                <div className="absolute top-2 right-2 z-10 bg-white border border-[#e5e7eb] rounded-lg shadow-lg min-w-[200px] py-1">
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
        size="lg"
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
        size="lg"
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
        size="lg"
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
                    alert('Veuillez sélectionner une date et une heure');
                    return;
                  }
                  
                  const newDateTime = new Date(`${dateInput.value}T${timeInput.value}:00`).toISOString();
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
        size="lg"
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
                    alert('Le compte-rendu doit contenir au moins 10 caractères');
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
    </div>
  );
}