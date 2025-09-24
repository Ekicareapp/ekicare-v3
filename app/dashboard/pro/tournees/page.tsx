'use client';

import { useState } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import NouvelleTourneeModal from '@/app/dashboard/pro/components/NouvelleTourneeModal';
import { Calendar, MapPin, Clock, Users, Phone, Navigation, Plus, ChevronDown } from 'lucide-react';

interface RendezVous {
  id: string;
  heure: string;
  client: string;
  adresse: string;
  ville: string;
  type: string;
  equide: string;
  telephone: string;
  statut: 'planifie' | 'en-cours' | 'termine' | 'annule';
}

interface Tournee {
  id: string;
  date: string;
  distance: number;
  duree: number;
  nombreRendezVous: number;
  rendezVous: RendezVous[];
}

export default function TourneesPage() {
  const [selectedTournee, setSelectedTournee] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tournees: Tournee[] = [
    {
      id: '1',
      date: '2024-01-15',
      distance: 25.6,
      duree: 195, // 3h15 en minutes
      nombreRendezVous: 3,
      rendezVous: [
        {
          id: '1-1',
          heure: '09:00',
          client: 'Marie Dubois',
          adresse: '123 rue de la Paix',
          ville: 'Paris 15ème',
          type: 'Consultation générale',
          equide: 'Bella',
          telephone: '06 12 34 56 78',
          statut: 'planifie'
        },
        {
          id: '1-2',
          heure: '11:30',
          client: 'Pierre Martin',
          adresse: '456 avenue des Champs',
          ville: 'Paris 8ème',
          type: 'Vaccination',
          equide: 'Thunder',
          telephone: '06 23 45 67 89',
          statut: 'planifie'
        },
        {
          id: '1-3',
          heure: '14:00',
          client: 'Sophie Laurent',
          adresse: '789 boulevard Saint-Germain',
          ville: 'Paris 7ème',
          type: 'Contrôle dentaire',
          equide: 'Luna',
          telephone: '06 34 56 78 90',
          statut: 'planifie'
        }
      ]
    },
    {
      id: '2',
      date: '2024-01-16',
      distance: 18.2,
      duree: 180, // 3h en minutes
      nombreRendezVous: 2,
      rendezVous: [
        {
          id: '2-1',
          heure: '10:00',
          client: 'Jean Dupont',
          adresse: '321 rue de Rivoli',
          ville: 'Paris 1er',
          type: 'Chirurgie',
          equide: 'Storm',
          telephone: '06 45 67 89 01',
          statut: 'planifie'
        },
        {
          id: '2-2',
          heure: '15:30',
          client: 'Claire Moreau',
          adresse: '654 rue de la République',
          ville: 'Paris 11ème',
          type: 'Consultation',
          equide: 'Spirit',
          telephone: '06 56 78 90 12',
          statut: 'planifie'
        }
      ]
    },
    {
      id: '3',
      date: '2024-01-18',
      distance: 32.1,
      duree: 240, // 4h en minutes
      nombreRendezVous: 4,
      rendezVous: [
        {
          id: '3-1',
          heure: '08:30',
          client: 'Antoine Bernard',
          adresse: '987 rue de la Sorbonne',
          ville: 'Paris 5ème',
          type: 'Vaccination',
          equide: 'Apollo',
          telephone: '06 67 89 01 23',
          statut: 'planifie'
        },
        {
          id: '3-2',
          heure: '11:00',
          client: 'Isabelle Roux',
          adresse: '654 avenue de l\'Opéra',
          ville: 'Paris 9ème',
          type: 'Consultation',
          equide: 'Nova',
          telephone: '06 78 90 12 34',
          statut: 'planifie'
        },
        {
          id: '3-3',
          heure: '14:30',
          client: 'Marc Lefebvre',
          adresse: '321 boulevard Haussmann',
          ville: 'Paris 8ème',
          type: 'Contrôle',
          equide: 'Zeus',
          telephone: '06 89 01 23 45',
          statut: 'planifie'
        },
        {
          id: '3-4',
          heure: '16:45',
          client: 'Catherine Petit',
          adresse: '159 rue de la Roquette',
          ville: 'Paris 11ème',
          type: 'Soins',
          equide: 'Athena',
          telephone: '06 90 12 34 56',
          statut: 'planifie'
        }
      ]
    }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const handleViewTournee = (tourneeId: string) => {
    setSelectedTournee(selectedTournee === tourneeId ? null : tourneeId);
  };

  const handleCallClient = (telephone: string) => {
    window.open(`tel:${telephone}`, '_self');
  };

  const handleOpenGPS = (adresse: string, ville: string) => {
    const address = encodeURIComponent(`${adresse}, ${ville}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

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
        {tournees.map((tournee) => (
          <div key={tournee.id} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
            {/* Header de la tournée */}
            <div 
              className="cursor-pointer hover:bg-[#f9fafb] transition-all duration-200 p-6"
              onClick={() => handleViewTournee(tournee.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#f86f4d]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#111827]">
                      {formatDate(tournee.date)}
                    </h3>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{tournee.distance} km</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(tournee.duree)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{tournee.nombreRendezVous} rendez-vous</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-[#374151] transition-transform duration-200 ${
                    selectedTournee === tournee.id ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>

            {/* Liste des rendez-vous à l'intérieur de la carte */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              selectedTournee === tournee.id 
                ? 'max-h-[1000px] opacity-100' 
                : 'max-h-0 opacity-0'
            }`}>
              <div className="border-t border-[#e5e7eb]">
                {tournee.rendezVous.map((rdv, index) => (
                  <div 
                    key={rdv.id} 
                    className={`flex justify-between items-center py-4 px-6 ${
                      index < tournee.rendezVous.length - 1 ? 'border-b border-[#e5e7eb]' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4 pl-4">
                      <div className="w-8 h-8 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[#f86f4d]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-[#111827]">{rdv.heure}</span>
                          <span className="text-sm text-[#111827] font-medium">{rdv.client}</span>
                        </div>
                        <p className="text-sm text-gray-500">{rdv.type} • {rdv.equide}</p>
                        <p className="text-sm text-gray-500">{rdv.adresse}, {rdv.ville}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Users className="w-4 h-4" />}
                        onClick={() => {/* Voir fiche client */}}
                        className="text-gray-500 hover:text-[#f86f4d]"
                      >
                        Fiche
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Navigation className="w-4 h-4" />}
                        onClick={() => handleOpenGPS(rdv.adresse, rdv.ville)}
                        className="text-gray-500 hover:text-[#f86f4d]"
                      >
                        GPS
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Phone className="w-4 h-4" />}
                        onClick={() => handleCallClient(rdv.telephone)}
                        className="text-gray-500 hover:text-[#f86f4d]"
                      >
                        Appeler
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tournees.length === 0 && (
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#6b7280]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucune tournée</h3>
          <p className="text-[#6b7280] mb-4">
            Vous n'avez pas encore créé de tournée. Commencez par planifier vos déplacements.
          </p>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />}
          >
            Créer ma première tournée
          </Button>
        </Card>
      )}

      {/* Modal Nouvelle tournée */}
      <NouvelleTourneeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
