'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Tabs from '../components/Tabs';

interface RendezVous {
  id: string;
  equide: string;
  professionnel: string;
  type: string;
  date: string;
  heure: string;
  statut: 'a-venir' | 'en-attente' | 'confirme' | 'termine';
  notes?: string;
}

export default function RendezVousPage() {
  const [activeTab, setActiveTab] = useState('a-venir');

  const tabs = [
    { id: 'a-venir', label: 'À venir', count: 3 },
    { id: 'en-attente', label: 'En attente', count: 1 },
    { id: 'confirme', label: 'Confirmés', count: 2 },
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
      notes: 'Rappel vaccin grippe'
    },
    {
      id: '2',
      equide: 'Thunder',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle dentaire',
      date: '2024-01-28',
      heure: '10:00',
      statut: 'a-venir'
    },
    {
      id: '3',
      equide: 'Luna',
      professionnel: 'Dr. Martin',
      type: 'Vermifuge',
      date: '2024-02-02',
      heure: '16:15',
      statut: 'a-venir'
    },
    {
      id: '4',
      equide: 'Bella',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2024-01-20',
      heure: '09:30',
      statut: 'en-attente'
    },
    {
      id: '5',
      equide: 'Thunder',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2024-01-15',
      heure: '11:00',
      statut: 'confirme'
    },
    {
      id: '6',
      equide: 'Luna',
      professionnel: 'Dr. Dubois',
      type: 'Contrôle général',
      date: '2024-01-10',
      heure: '14:00',
      statut: 'confirme'
    },
    {
      id: '7',
      equide: 'Bella',
      professionnel: 'Dr. Martin',
      type: 'Vaccination',
      date: '2023-12-20',
      heure: '10:30',
      statut: 'termine'
    },
    {
      id: '8',
      equide: 'Thunder',
      professionnel: 'Dr. Lefebvre',
      type: 'Ostéopathie',
      date: '2023-12-15',
      heure: '15:45',
      statut: 'termine'
    }
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'a-venir':
        return 'bg-blue-100 text-blue-800';
      case 'en-attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirme':
        return 'bg-green-100 text-green-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'a-venir':
        return 'À venir';
      case 'en-attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmé';
      case 'termine':
        return 'Terminé';
      default:
        return statut;
    }
  };

  const filteredRendezVous = rendezVous.filter(rdv => rdv.statut === activeTab);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Mes rendez-vous
          </h1>
          <p className="text-gray-600">
            Gérez vos rendez-vous vétérinaires et soins
          </p>
        </div>
        <Button variant="primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Prendre rendez-vous
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Rendez-vous List */}
      <div className="space-y-4">
        {filteredRendezVous.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
            <p className="text-gray-500">Aucun rendez-vous trouvé pour cette catégorie.</p>
          </Card>
        ) : (
          filteredRendezVous.map((rdv) => (
            <Card key={rdv.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{rdv.type}</h3>
                    <p className="text-sm text-gray-600">
                      {rdv.equide} • {rdv.professionnel}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(rdv.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} à {rdv.heure}
                    </p>
                    {rdv.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Note: {rdv.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(rdv.statut)}`}>
                    {getStatusLabel(rdv.statut)}
                  </span>
                  
                  <div className="flex space-x-2">
                    {rdv.statut === 'a-venir' && (
                      <>
                        <Button variant="secondary" size="sm">
                          Modifier
                        </Button>
                        <Button variant="secondary" size="sm">
                          Annuler
                        </Button>
                      </>
                    )}
                    {rdv.statut === 'en-attente' && (
                      <Button variant="primary" size="sm">
                        Confirmer
                      </Button>
                    )}
                    {rdv.statut === 'confirme' && (
                      <Button variant="secondary" size="sm">
                        Voir détails
                      </Button>
                    )}
                    {rdv.statut === 'termine' && (
                      <Button variant="secondary" size="sm">
                        Voir rapport
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
