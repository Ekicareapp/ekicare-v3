'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import Modal from '../components/Modal';
import { Eye, X, CheckCircle, RotateCcw, Clock, FileText, MoreVertical } from 'lucide-react';

interface RendezVous {
  id: string;
  equide: string;
  professionnel: string;
  type: string;
  date: string;
  heure: string;
  statut: 'en-attente' | 'a-venir' | 'termine' | 'refuse';
  notes?: string;
  lieu?: string;
  specialite?: string;
  compteRendu?: string;
  dateCreation?: string;
  dateModification?: string;
}

interface ReplanificationFormProps {
  rendezVous: RendezVous;
  onSubmit: (newDate: string, newTime: string) => void;
  onCancel: () => void;
}

function ReplanificationForm({ rendezVous, onSubmit, onCancel }: ReplanificationFormProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && newTime) {
      onSubmit(newDate, newTime);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations actuelles */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Rendez-vous actuel</h4>
        <p className="text-sm text-gray-600">
          {rendezVous.equide} - {rendezVous.type}
        </p>
        <p className="text-sm text-gray-600">
          {rendezVous.date} à {rendezVous.heure}
        </p>
        <p className="text-sm text-gray-600">
          {rendezVous.professionnel} - {rendezVous.lieu}
        </p>
      </div>

      {/* Nouvelle date */}
      <div>
        <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 mb-2">
          Nouvelle date *
        </label>
        <input
          type="date"
          id="newDate"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#ff6b35]"
          required
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Nouvelle heure */}
      <div>
        <label htmlFor="newTime" className="block text-sm font-medium text-gray-700 mb-2">
          Nouvelle heure *
        </label>
        <input
          type="time"
          id="newTime"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#ff6b35]"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!newDate || !newTime}
        >
          Proposer la replanification
        </Button>
      </div>
    </form>
  );
}

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompteRenduModalOpen, setIsCompteRenduModalOpen] = useState(false);
  const [isReplanificationModalOpen, setIsReplanificationModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [rendezVous, setRendezVous] = useState<RendezVous[]>([
    {
      id: '1',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-25',
      heure: '14:30',
      statut: 'a-venir',
      notes: 'Rappel vaccin grippe',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale'
    },
    {
      id: '2',
      equide: 'Thunder',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle dentaire',
      date: '2024-01-28',
      heure: '10:00',
      statut: 'a-venir',
      lieu: 'Cabinet Dubois',
      specialite: 'Dentisterie équine'
    },
    {
      id: '3',
      equide: 'Luna',
      professionnel: 'Dr. Martin',
      type: 'Vermifuge',
      date: '2024-02-02',
      heure: '16:15',
      statut: 'a-venir',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale'
    },
    {
      id: '4',
      equide: 'Bella',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2024-01-20',
      heure: '09:30',
      statut: 'en-attente',
      notes: 'Nouvelle demande de soin - en cours de négociation',
      lieu: 'Cabinet Lefebvre',
      specialite: 'Ostéopathie équine',
      dateCreation: '2024-01-12',
      dateModification: '2024-01-12'
    },
    {
      id: '11',
      equide: 'Luna',
      professionnel: 'Dr. Martin',
      type: 'Consultation',
      date: '2024-02-05',
      heure: '14:00',
      statut: 'en-attente',
      notes: 'Replanification proposée par le propriétaire - en attente de validation du pro',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      dateCreation: '2024-01-15',
      dateModification: '2024-01-18'
    },
    {
      id: '5',
      equide: 'Thunder',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-15',
      heure: '11:00',
      statut: 'termine',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      compteRendu: 'Vaccination réalisée avec succès. Thunder a bien réagi au vaccin.',
      dateCreation: '2024-01-05',
      dateModification: '2024-01-15'
    },
    {
      id: '6',
      equide: 'Luna',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle général',
      date: '2024-01-10',
      heure: '14:00',
      statut: 'termine',
      lieu: 'Cabinet Dubois',
      specialite: 'Médecine générale',
      compteRendu: 'Contrôle général effectué. Luna est en bonne santé.',
      dateCreation: '2024-01-02',
      dateModification: '2024-01-10'
    },
    {
      id: '7',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-30',
      heure: '10:30',
      statut: 'en-attente',
      notes: 'Replanification proposée par le professionnel - en attente de validation',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      dateCreation: '2024-01-08',
      dateModification: '2024-01-14'
    },
    {
      id: '8',
      equide: 'Thunder',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2024-01-25',
      heure: '15:45',
      statut: 'refuse',
      notes: 'Rendez-vous refusé par le professionnel - créneau non disponible',
      lieu: 'Cabinet Lefebvre',
      specialite: 'Ostéopathie équine',
      dateCreation: '2024-01-11',
      dateModification: '2024-01-11'
    },
    {
      id: '13',
      equide: 'Luna',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle dentaire',
      date: '2024-02-10',
      heure: '09:30',
      statut: 'refuse',
      notes: 'Rendez-vous refusé par le propriétaire - changement de planning',
      lieu: 'Cabinet Dubois',
      specialite: 'Dentisterie équine',
      dateCreation: '2024-01-20',
      dateModification: '2024-01-22'
    },
    {
      id: '9',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2023-12-20',
      heure: '10:30',
      statut: 'termine',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      compteRendu: 'Vaccination réalisée avec succès. Bella a bien réagi au vaccin. Aucune réaction secondaire observée. Prochaine vaccination prévue dans 6 mois.',
      dateCreation: '2023-12-10',
      dateModification: '2023-12-20'
    },
    {
      id: '10',
      equide: 'Thunder',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2023-12-15',
      heure: '15:45',
      statut: 'termine',
      lieu: 'Cabinet Lefebvre',
      specialite: 'Ostéopathie équine',
      compteRendu: 'Séance d\'ostéopathie réalisée. Thunder présente une bonne mobilité. Prochaine séance recommandée dans 3 mois.',
      dateCreation: '2023-12-05',
      dateModification: '2023-12-15'
    },
    {
      id: '12',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Consultation',
      date: '2024-01-05',
      heure: '11:00',
      statut: 'termine',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      compteRendu: 'Consultation de routine effectuée. Bella est en excellente santé. Aucun problème détecté. Prochaine visite recommandée dans 6 mois.',
      dateCreation: '2023-12-20',
      dateModification: '2024-01-05'
    }
  ]);

  // Calculer les compteurs dynamiquement
  const getTabCounts = () => {
    return {
      'en-attente': rendezVous.filter(rdv => rdv.statut === 'en-attente').length,
      'a-venir': rendezVous.filter(rdv => rdv.statut === 'a-venir').length,
      'refuse': rendezVous.filter(rdv => rdv.statut === 'refuse').length,
      'termine': rendezVous.filter(rdv => rdv.statut === 'termine').length
    };
  };

  const tabCounts = getTabCounts();
  
  const tabs = [
    { id: 'en-attente', label: 'En attente', count: tabCounts['en-attente'] },
    { id: 'a-venir', label: 'À venir', count: tabCounts['a-venir'] },
    { id: 'refuse', label: 'Refusés', count: tabCounts['refuse'] },
    { id: 'termine', label: 'Terminés', count: tabCounts['termine'] }
  ];

  const getStatusLabel = (statut: string) => {
    const labels = {
      'en-attente': 'En attente',
      'a-venir': 'À venir',
      'refuse': 'Refusé',
      'termine': 'Terminé'
    };
    return labels[statut as keyof typeof labels] || statut;
  };

  // Fonction pour vérifier et mettre à jour automatiquement les rendez-vous passés
  const checkAndUpdatePastRendezVous = () => {
    const today = new Date().toISOString().split('T')[0];
    
    setRendezVous(prev => prev.map(rdv => {
      if (rdv.statut === 'a-venir' && rdv.date < today) {
        return { 
          ...rdv, 
          statut: 'termine' as any, 
          notes: (rdv.notes || '') + (rdv.notes ? ' | ' : '') + 'Passé automatiquement en terminé',
          dateModification: today
        };
      }
      return rdv;
    }));
  };

  // Fonction pour mettre à jour le statut d'un rendez-vous
  const updateRendezVousStatus = async (rdvId: string, newStatus: string, notes?: string) => {
    try {
      // TODO: Implémenter la mise à jour en base Supabase
      console.log(`Mise à jour du rendez-vous ${rdvId} vers le statut ${newStatus}`);
      
      // Mise à jour locale pour l'instant
      setRendezVous(prev => prev.map(rdv => 
        rdv.id === rdvId 
          ? { 
              ...rdv, 
              statut: newStatus as any, 
              dateModification: new Date().toISOString().split('T')[0],
              notes: notes ? `${rdv.notes || ''}${rdv.notes ? ' | ' : ''}${notes}` : rdv.notes
            }
          : rdv
      ));
      
      // Vérifier les rendez-vous passés après chaque mise à jour
      checkAndUpdatePastRendezVous();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Vérifier automatiquement les rendez-vous "À venir" qui sont passés
  useEffect(() => {
    checkAndUpdatePastRendezVous();
  }, []);

  useEffect(() => {
    const checkPastAppointments = () => {
      const today = new Date().toISOString().split('T')[0];
      
      setRendezVous(prev => prev.map(rdv => {
        if (rdv.statut === 'a-venir' && rdv.date < today) {
          return {
            ...rdv,
            statut: 'termine' as any,
            dateModification: new Date().toISOString().split('T')[0],
            notes: `${rdv.notes || ''}${rdv.notes ? ' | ' : ''}Rendez-vous automatiquement marqué comme terminé (date passée)`
          };
        }
        return rdv;
      }));
    };

    // Vérifier immédiatement
    checkPastAppointments();

    // Vérifier toutes les heures
    const interval = setInterval(checkPastAppointments, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsModalOpen(true);
  };

  const handleViewCompteRendu = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsCompteRenduModalOpen(true);
  };

  const handleOpenReplanificationModal = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsReplanificationModalOpen(true);
  };

  const handleSubmitReplanification = (newDate: string, newTime: string) => {
    if (selectedRendezVous) {
      // Mettre à jour le rendez-vous avec la nouvelle date/heure proposée
      setRendezVous(prev => prev.map(rdv => 
        rdv.id === selectedRendezVous.id 
          ? { 
              ...rdv, 
              date: newDate,
              heure: newTime,
              notes: (rdv.notes || '') + (rdv.notes ? ' | ' : '') + `Replanification proposée par le propriétaire: ${newDate} à ${newTime}`,
              dateModification: new Date().toISOString().split('T')[0]
            }
          : rdv
      ));
      
      // Fermer la popup
      setIsReplanificationModalOpen(false);
      setSelectedRendezVous(null);
    }
  };

  const toggleMenu = (rdvId: string) => {
    setActiveMenuId(activeMenuId === rdvId ? null : rdvId);
  };

  const closeMenu = () => {
    setActiveMenuId(null);
  };

  const getMenuActions = (rdv: RendezVous) => {
    const actions = [
      {
        label: 'Voir détail',
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {
          handleViewDetails(rdv);
          closeMenu();
        }
      }
    ];

    switch (rdv.statut) {
      case 'en-attente':
        // Le propriétaire peut accepter, refuser ou proposer une replanification
        actions.push(
          {
            label: 'Accepter',
            icon: <CheckCircle className="w-4 h-4" />,
            onClick: () => {
              updateRendezVousStatus(rdv.id, 'a-venir', 'Demande acceptée par le propriétaire');
              closeMenu();
            }
          },
          {
            label: 'Refuser',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              updateRendezVousStatus(rdv.id, 'refuse', 'Demande refusée par le propriétaire');
              closeMenu();
            }
          },
          {
            label: 'Proposer une replanification',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => {
              handleOpenReplanificationModal(rdv);
              closeMenu();
            }
          }
        );
        break;
      
      case 'a-venir':
        // Pas d'actions possibles - le rendez-vous passe automatiquement en Terminés quand la date est dépassée
        break;
      
      
      case 'refuse':
        // Aucune action spécifique pour les rendez-vous refusés
        break;
      
      case 'termine':
        if (rdv.compteRendu) {
          actions.push({
            label: 'Voir le compte-rendu',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => {
              handleViewCompteRendu(rdv);
              closeMenu();
            }
          });
        }
        break;
    }

    return actions;
  };

  const filteredRendezVous = rendezVous.filter(rdv => rdv.statut === activeTab);

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

  return (
    <div className="space-y-8 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Mes rendez-vous
        </h1>
        <p className="text-gray-600 text-lg">
          Gérez vos rendez-vous vétérinaires et soins
        </p>
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
      <div className="space-y-4">
        {filteredRendezVous.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 min-h-[120px] flex items-center justify-center">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucun rendez-vous</h3>
              <p className="text-[#6b7280]">Aucun rendez-vous trouvé pour cette catégorie.</p>
            </div>
          </Card>
        ) : (
          filteredRendezVous.map((rdv) => (
            <div key={rdv.id} className="relative">
              <Card variant="elevated" hover={false} className="min-h-[120px] group">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#111827] mb-1">{rdv.type}</h3>
                      <p className="text-sm text-[#6b7280] mb-1">
                        {rdv.equide} • {rdv.professionnel}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        {new Date(rdv.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} à {rdv.heure}
                      </p>
                      {rdv.notes && (
                        <p className="text-sm text-[#6b7280] mt-2 italic">
                          Note: {rdv.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => toggleMenu(rdv.id)}
                      className="p-2 text-[#6b7280] hover:text-[#f86f4d] transition-colors duration-200 rounded-lg hover:bg-[#f9fafb]"
                      title="Actions"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Menu contextuel */}
              {activeMenuId === rdv.id && (
                <div className="absolute top-2 right-2 z-10 bg-white border border-[#e5e7eb] rounded-lg shadow-lg min-w-[200px] py-1">
                  {getMenuActions(rdv).map((action, index) => (
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
          ))
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Détails du rendez-vous"
        size="md"
      >
        {selectedRendezVous && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Équidé</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRendezVous.equide}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Professionnel</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRendezVous.professionnel}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Type de soin</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRendezVous.type}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Spécialité</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRendezVous.specialite}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Date et heure</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedRendezVous.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} à {selectedRendezVous.heure}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Lieu</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedRendezVous.lieu}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Statut</h4>
                <p className="text-lg font-semibold text-gray-900">{getStatusLabel(selectedRendezVous.statut)}</p>
              </div>
            </div>
            
            {selectedRendezVous.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedRendezVous.notes}</p>
              </div>
            )}
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
        {selectedRendezVous && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-[#111827] mb-2">
                {selectedRendezVous.type} - {selectedRendezVous.equide}
              </h3>
              <p className="text-sm text-[#6b7280]">
                {selectedRendezVous.professionnel} • {new Date(selectedRendezVous.date).toLocaleDateString('fr-FR')} à {selectedRendezVous.heure}
              </p>
            </div>

            {/* Compte-rendu */}
            <div>
              <h4 className="text-sm font-medium text-[#6b7280] mb-3">Compte-rendu du professionnel</h4>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
                <p className="text-[#111827] leading-relaxed whitespace-pre-line">
                  {selectedRendezVous.compteRendu}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsCompteRenduModalOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Replanification */}
      <Modal
        isOpen={isReplanificationModalOpen}
        onClose={() => setIsReplanificationModalOpen(false)}
        title="Proposer une replanification"
        size="md"
      >
        {selectedRendezVous && (
          <ReplanificationForm
            rendezVous={selectedRendezVous}
            onSubmit={handleSubmitReplanification}
            onCancel={() => setIsReplanificationModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
