'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Tabs from '@/app/dashboard/pro/components/Tabs';
import Modal from '@/app/dashboard/pro/components/Modal';
import ReplanificationModal from '@/app/dashboard/pro/components/ReplanificationModal';
import CompteRenduModal from '@/app/dashboard/pro/components/CompteRenduModal';
import { Eye, X, CheckCircle, RotateCcw, Clock, FileText, MoreVertical, Edit3 } from 'lucide-react';

interface RendezVous {
  id: string;
  client: string;
  equide: string;
  type: string;
  date: string;
  heure: string;
  statut: 'en-attente' | 'a-venir' | 'replanifie' | 'termine' | 'refuse';
  notes?: string;
  lieu?: string;
  compteRendu?: string;
  dateCreation?: string;
  dateModification?: string;
  alternateSlots?: string[]; // créneaux alternatifs proposés par le propriétaire
}

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompteRenduModalOpen, setIsCompteRenduModalOpen] = useState(false);
  const [isReplanificationModalOpen, setIsReplanificationModalOpen] = useState(false);
  const [isCompteRenduEditModalOpen, setIsCompteRenduEditModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [rendezVous, setRendezVous] = useState<RendezVous[]>([
    // En attente - Nouvelles demandes
    {
      id: '1',
      client: 'Marie Dubois',
      equide: 'Bella',
      type: 'Consultation générale',
      date: '2024-01-20',
      heure: '09:00',
      statut: 'en-attente',
      lieu: 'Écurie Dubois, 123 rue de la Paix, 75001 Paris',
      dateCreation: '2024-01-15',
      dateModification: '2024-01-15'
    },
    {
      id: '2',
      client: 'Pierre Martin',
      equide: 'Thunder',
      type: 'Vaccination',
      date: '2024-01-22',
      heure: '11:30',
      statut: 'en-attente',
      lieu: 'Centre équestre Martin, 456 avenue des Champs, 75008 Paris',
      dateCreation: '2024-01-16',
      dateModification: '2024-01-16'
    },
    
    // À venir - Rendez-vous acceptés
    {
      id: '3',
      client: 'Sophie Laurent',
      equide: 'Luna',
      type: 'Contrôle dentaire',
      date: '2024-01-25',
      heure: '14:00',
      statut: 'a-venir',
      lieu: 'Haras Laurent, 789 boulevard Saint-Germain, 75007 Paris',
      dateCreation: '2024-01-10',
      dateModification: '2024-01-12'
    },
    {
      id: '4',
      client: 'Jean Dupont',
      equide: 'Storm',
      type: 'Chirurgie',
      date: '2024-01-28',
      heure: '10:00',
      statut: 'a-venir',
      lieu: 'Clinique vétérinaire Dupont, 321 rue de Rivoli, 75001 Paris',
      dateCreation: '2024-01-08',
      dateModification: '2024-01-10'
    },
    
    // Replanifiés - Replanifications faites par le pro
    {
      id: '5',
      client: 'Claire Moreau',
      equide: 'Spirit',
      type: 'Consultation',
      date: '2024-01-30',
      heure: '15:30',
      statut: 'replanifie',
      lieu: 'Écurie Moreau, 654 rue de la République, 75011 Paris',
      notes: 'Replanifié par le professionnel - créneau initial indisponible',
      dateCreation: '2024-01-12',
      dateModification: '2024-01-18',
      alternateSlots: [
        '2024-01-31T09:00:00',
        '2024-01-31T14:00:00',
        '2024-02-01T10:30:00'
      ]
    },
    
    // Refusés - Rendez-vous refusés par le pro
    {
      id: '6',
      client: 'Marc Durand',
      equide: 'Flash',
      type: 'Vaccination',
      date: '2024-01-25',
      heure: '16:00',
      statut: 'refuse',
      lieu: 'Écurie Durand, 789 avenue de la République, 75012 Paris',
      notes: 'Rendez-vous refusé - créneau non disponible',
      dateCreation: '2024-01-14',
      dateModification: '2024-01-14'
    },
    {
      id: '7',
      client: 'Isabelle Petit',
      equide: 'Nina',
      type: 'Contrôle dentaire',
      date: '2024-01-28',
      heure: '10:30',
      statut: 'refuse',
      lieu: 'Centre équestre Petit, 321 rue de la Paix, 75013 Paris',
      notes: 'Rendez-vous refusé - date incompatible',
      dateCreation: '2024-01-15',
      dateModification: '2024-01-15'
    },
    
    // Terminés - Rendez-vous passés
    {
      id: '8',
      client: 'Alice Bernard',
      equide: 'Max',
      type: 'Vaccination',
      date: '2024-01-10',
      heure: '10:00',
      statut: 'termine',
      lieu: 'Écurie Bernard, 456 rue de la Paix, 75014 Paris',
      compteRendu: 'Vaccination réalisée avec succès. Max a bien réagi au vaccin. Aucune réaction secondaire observée.',
      dateCreation: '2024-01-05',
      dateModification: '2024-01-10'
    },
    {
      id: '9',
      client: 'Thomas Leroy',
      equide: 'Jazz',
      type: 'Consultation',
      date: '2024-01-08',
      heure: '14:30',
      statut: 'termine',
      lieu: 'Centre équestre Leroy, 789 avenue des Champs, 75015 Paris',
      compteRendu: 'Examen complet effectué. Jazz présente une bonne santé générale. Recommandations : continuer le suivi régulier.',
      dateCreation: '2024-01-03',
      dateModification: '2024-01-08'
    }
  ]);
  
  // Calculer les compteurs dynamiquement
  const getTabCounts = () => {
    return {
      'en-attente': rendezVous.filter(rdv => rdv.statut === 'en-attente').length,
      'a-venir': rendezVous.filter(rdv => rdv.statut === 'a-venir').length,
      'replanifie': rendezVous.filter(rdv => rdv.statut === 'replanifie').length,
      'refuse': rendezVous.filter(rdv => rdv.statut === 'refuse').length,
      'termine': rendezVous.filter(rdv => rdv.statut === 'termine').length
    };
  };

  const tabs = [
    { id: 'en-attente', label: 'En attente', count: 0 },
    { id: 'a-venir', label: 'À venir', count: 0 },
    { id: 'replanifie', label: 'Replanifiés', count: 0 },
    { id: 'refuse', label: 'Refusés', count: 0 },
    { id: 'termine', label: 'Terminés', count: 0 }
  ];

  const getStatusLabel = (statut: string) => {
    const labels = {
      'en-attente': 'En attente',
      'a-venir': 'À venir',
      'replanifie': 'Replanifié',
      'refuse': 'Refusé',
      'termine': 'Terminé'
    };
    return labels[statut as keyof typeof labels] || statut;
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
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Vérifier automatiquement les rendez-vous "À venir" qui sont passés
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

  const handleReplanifier = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsReplanificationModalOpen(true);
    closeMenu();
  };

  const handleConfirmReplanification = async (newDateTime: string) => {
    if (!selectedRendezVous) return;
    
    try {
      // TODO: Implémenter l'appel API pour la replanification
      console.log(`Replanification du rendez-vous ${selectedRendezVous.id} vers ${newDateTime}`);
      
      // Mise à jour locale pour l'instant
      const newDate = newDateTime.split('T')[0];
      const newTime = newDateTime.split('T')[1].substring(0, 5);
      
      setRendezVous(prev => prev.map(rdv => 
        rdv.id === selectedRendezVous.id 
          ? { 
              ...rdv, 
              date: newDate,
              heure: newTime,
              statut: 'replanifie' as any,
              dateModification: new Date().toISOString().split('T')[0],
              notes: `${rdv.notes || ''}${rdv.notes ? ' | ' : ''}Rendez-vous replanifié par le professionnel`
            }
          : rdv
      ));
      
      setIsReplanificationModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la replanification:', error);
      alert('Erreur lors de la replanification');
    }
  };

  const handleEditCompteRendu = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    setIsCompteRenduEditModalOpen(true);
    closeMenu();
  };

  const handleSaveCompteRendu = async (reportText: string) => {
    if (!selectedRendezVous) return;
    
    try {
      // TODO: Implémenter l'appel API POST/PUT à /api/appointment-report
      console.log(`Sauvegarde du compte-rendu pour le rendez-vous ${selectedRendezVous.id}:`, reportText);
      
      // Simulation de l'appel API
      const response = await fetch('/api/appointment-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: selectedRendezVous.id,
          report_text: reportText
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      // Mise à jour locale
      setRendezVous(prev => prev.map(rdv => 
        rdv.id === selectedRendezVous.id 
          ? { 
              ...rdv, 
              compteRendu: reportText,
              dateModification: new Date().toISOString().split('T')[0]
            }
          : rdv
      ));
      
      setIsCompteRenduEditModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du compte-rendu:', error);
      // En cas d'erreur API, on sauvegarde quand même localement pour la démo
      setRendezVous(prev => prev.map(rdv => 
        rdv.id === selectedRendezVous.id 
          ? { 
              ...rdv, 
              compteRendu: reportText,
              dateModification: new Date().toISOString().split('T')[0]
            }
          : rdv
      ));
      setIsCompteRenduEditModalOpen(false);
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
        // Nouvelles demandes - Le pro a 3 choix
        actions.push(
          {
            label: 'Accepter',
            icon: <CheckCircle className="w-4 h-4" />,
            onClick: () => {
              updateRendezVousStatus(rdv.id, 'a-venir', 'Rendez-vous accepté par le professionnel');
              closeMenu();
            }
          },
          {
            label: 'Refuser',
            icon: <X className="w-4 h-4" />,
            onClick: () => {
              updateRendezVousStatus(rdv.id, 'refuse', 'Rendez-vous refusé par le professionnel');
              closeMenu();
            }
          },
          {
            label: 'Replanifier',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => {
              handleReplanifier(rdv);
            }
          }
        );
        break;
      
      case 'a-venir':
        // Rendez-vous acceptés - Transition automatique vers Terminés quand la date est passée
        // Pas d'action manuelle nécessaire, la transition est automatique
        break;
      
      case 'replanifie':
        // Replanifications faites par le pro - En attente d'acceptation/refus côté propriétaire
        // Le pro ne peut que consulter, les actions sont côté propriétaire
        break;
      
      case 'refuse':
        // Rendez-vous refusés - Aucune action possible
        break;
      
      case 'termine':
        // Rendez-vous terminés - Ajouter/modifier compte-rendu
        actions.push({
          label: rdv.compteRendu ? 'Modifier le compte-rendu' : 'Ajouter un compte-rendu',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: () => {
            handleEditCompteRendu(rdv);
          }
        });
        
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
    <div className="space-y-8 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Mes rendez-vous</h1>
        <p className="text-[#6b7280] text-lg">Gérez vos rendez-vous avec vos clients</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map(tab => ({
          ...tab,
          count: rendezVous.filter(rdv => rdv.statut === tab.id).length
        }))}
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

      {/* Modal de replanification */}
      <ReplanificationModal
        isOpen={isReplanificationModalOpen}
        onClose={() => setIsReplanificationModalOpen(false)}
        appointmentId={selectedRendezVous?.id || ''}
        alternateSlots={selectedRendezVous?.alternateSlots}
        onConfirm={handleConfirmReplanification}
      />

      {/* Modal d'édition du compte-rendu */}
      <CompteRenduModal
        isOpen={isCompteRenduEditModalOpen}
        onClose={() => setIsCompteRenduEditModalOpen(false)}
        appointmentId={selectedRendezVous?.id || ''}
        existingReport={selectedRendezVous?.compteRendu}
        onSave={handleSaveCompteRendu}
      />
    </div>
  );
}
