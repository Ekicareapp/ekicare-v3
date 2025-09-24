'use client';

import { useState } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Tabs from '@/app/dashboard/pro/components/Tabs';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Eye, X, CheckCircle, RotateCcw, Clock, FileText, MoreVertical } from 'lucide-react';

interface RendezVous {
  id: string;
  client: string;
  equide: string;
  type: string;
  date: string;
  heure: string;
  statut: 'a-venir' | 'en-attente' | 'confirme' | 'termine' | 'replanifie';
  notes?: string;
  lieu?: string;
  compteRendu?: string;
}

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('a-venir');
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompteRenduModalOpen, setIsCompteRenduModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const tabs = [
    { id: 'a-venir', label: 'À venir', count: 8 },
    { id: 'en-attente', label: 'En attente', count: 3 },
    { id: 'confirme', label: 'Confirmés', count: 5 },
    { id: 'replanifie', label: 'Replanifiés', count: 2 },
    { id: 'termine', label: 'Terminés', count: 12 }
  ];

  const rendezVous: RendezVous[] = [
    {
      id: '1',
      client: 'Marie Dubois',
      equide: 'Bella',
      type: 'Consultation générale',
      date: '2024-01-15',
      heure: '09:00',
      statut: 'a-venir',
      lieu: 'Écurie Dubois, 123 rue de la Paix, 75001 Paris'
    },
    {
      id: '2',
      client: 'Pierre Martin',
      equide: 'Thunder',
      type: 'Vaccination',
      date: '2024-01-15',
      heure: '11:30',
      statut: 'en-attente',
      lieu: 'Centre équestre Martin, 456 avenue des Champs, 75008 Paris'
    },
    {
      id: '3',
      client: 'Sophie Laurent',
      equide: 'Luna',
      type: 'Contrôle dentaire',
      date: '2024-01-16',
      heure: '14:00',
      statut: 'confirme',
      lieu: 'Haras Laurent, 789 boulevard Saint-Germain, 75007 Paris'
    },
    {
      id: '4',
      client: 'Jean Dupont',
      equide: 'Storm',
      type: 'Chirurgie',
      date: '2024-01-18',
      heure: '10:00',
      statut: 'replanifie',
      lieu: 'Clinique vétérinaire Dupont, 321 rue de Rivoli, 75001 Paris',
      notes: 'Rendez-vous reporté à la demande du client'
    },
    {
      id: '5',
      client: 'Claire Moreau',
      equide: 'Spirit',
      type: 'Consultation',
      date: '2024-01-10',
      heure: '15:30',
      statut: 'termine',
      lieu: 'Écurie Moreau, 654 rue de la République, 75011 Paris',
      compteRendu: 'Examen complet effectué. L\'équidé présente une bonne santé générale. Recommandations : continuer le suivi régulier.'
    }
  ];

  const getStatusLabel = (statut: string) => {
    const labels = {
      'a-venir': 'À venir',
      'en-attente': 'En attente',
      'confirme': 'Confirmé',
      'replanifie': 'Replanifié',
      'termine': 'Terminé'
    };
    return labels[statut as keyof typeof labels] || statut;
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
  useState(() => {
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
        {filteredRendezVous.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 min-h-[120px] flex items-center justify-center">
            <div>
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {rdv.client} • {rdv.equide}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        {new Date(rdv.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} à {rdv.heure}
                      </p>
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
        size="lg"
      >
        {selectedRendezVous && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Client</label>
                <p className="text-[#111827]">{selectedRendezVous.client}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Équidé</label>
                <p className="text-[#111827]">{selectedRendezVous.equide}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Type</label>
                <p className="text-[#111827]">{selectedRendezVous.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Statut</label>
                <p className="text-[#111827]">{getStatusLabel(selectedRendezVous.statut)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Date</label>
                <p className="text-[#111827]">
                  {new Date(selectedRendezVous.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Heure</label>
                <p className="text-[#111827]">{selectedRendezVous.heure}</p>
              </div>
            </div>
            
            {selectedRendezVous.lieu && (
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Lieu</label>
                <p className="text-[#111827]">{selectedRendezVous.lieu}</p>
              </div>
            )}
            
            {selectedRendezVous.notes && (
              <div>
                <label className="block text-sm font-medium text-[#6b7280] mb-1">Notes</label>
                <p className="text-[#111827]">{selectedRendezVous.notes}</p>
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
            <div className="bg-[#f9fafb] p-4 rounded-lg">
              <h4 className="font-medium text-[#111827] mb-2">Rendez-vous</h4>
              <p className="text-sm text-[#6b7280]">
                {selectedRendezVous.client} • {selectedRendezVous.equide} • {selectedRendezVous.type}
              </p>
              <p className="text-sm text-[#6b7280]">
                {new Date(selectedRendezVous.date).toLocaleDateString('fr-FR')} à {selectedRendezVous.heure}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-[#111827] mb-2">Compte-rendu</h4>
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
                <p className="text-[#111827] whitespace-pre-wrap">{selectedRendezVous.compteRendu}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
