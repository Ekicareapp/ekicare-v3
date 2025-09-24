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
  statut: 'a-venir' | 'en-attente' | 'confirme' | 'termine' | 'replanifie';
  notes?: string;
  lieu?: string;
  specialite?: string;
  compteRendu?: string;
}

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('a-venir');
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompteRenduModalOpen, setIsCompteRenduModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const tabs = [
    { id: 'a-venir', label: 'À venir', count: 3 },
    { id: 'en-attente', label: 'En attente', count: 1 },
    { id: 'confirme', label: 'Confirmés', count: 2 },
    { id: 'replanifie', label: 'Replanifiés', count: 1 },
    { id: 'termine', label: 'Terminés', count: 8 }
  ];

  const rendezVous: RendezVous[] = [
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
      lieu: 'Cabinet Lefebvre',
      specialite: 'Ostéopathie équine'
    },
    {
      id: '5',
      equide: 'Thunder',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-15',
      heure: '11:00',
      statut: 'confirme',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale'
    },
    {
      id: '6',
      equide: 'Luna',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle général',
      date: '2024-01-10',
      heure: '14:00',
      statut: 'confirme',
      lieu: 'Cabinet Dubois',
      specialite: 'Médecine générale'
    },
    {
      id: '7',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-30',
      heure: '10:30',
      statut: 'replanifie',
      notes: 'Reprogrammé à la demande du propriétaire',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale'
    },
    {
      id: '8',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2023-12-20',
      heure: '10:30',
      statut: 'termine',
      lieu: 'Clinique vétérinaire Martin',
      specialite: 'Médecine générale',
      compteRendu: 'Vaccination réalisée avec succès. Bella a bien réagi au vaccin. Aucune réaction secondaire observée. Prochaine vaccination prévue dans 6 mois.'
    },
    {
      id: '9',
      equide: 'Thunder',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2023-12-15',
      heure: '15:45',
      statut: 'termine',
      lieu: 'Cabinet Lefebvre',
      specialite: 'Ostéopathie équine'
    }
  ];

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'a-venir':
        return 'À venir';
      case 'en-attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmé';
      case 'replanifie':
        return 'Replanifié';
      case 'termine':
        return 'Terminé';
      default:
        return statut;
    }
  };

  const handleViewDetails = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsModalOpen(true);
  };

  const handleViewCompteRendu = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsCompteRenduModalOpen(true);
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
      case 'a-venir':
      case 'en-attente':
        actions.push({
          label: 'Annuler',
          icon: <X className="w-4 h-4" />,
          onClick: () => {
            // TODO: Implémenter l'annulation
            closeMenu();
          }
        });
        break;
      
      case 'confirme':
        actions.push(
          {
            label: 'Demander une replanification',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => {
              // TODO: Implémenter la replanification
              closeMenu();
            }
          },
          {
            label: 'Annuler',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              // TODO: Implémenter l'annulation
              closeMenu();
            }
          }
        );
        break;
      
      case 'replanifie':
        actions.push(
          {
            label: 'Accepter la nouvelle date',
            icon: <CheckCircle className="w-4 h-4" />,
            onClick: () => {
              // TODO: Implémenter l'acceptation
              closeMenu();
            }
          },
          {
            label: 'Proposer un autre créneau',
            icon: <Clock className="w-4 h-4" />,
            onClick: () => {
              // TODO: Implémenter la contre-proposition
              closeMenu();
            }
          },
          {
            label: 'Refuser',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              // TODO: Implémenter le refus
              closeMenu();
            }
          }
        );
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
    <div className="space-y-8">
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
                    <div className="w-12 h-12 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
}
