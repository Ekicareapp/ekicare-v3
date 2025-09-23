'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';

interface Professionnel {
  id: string;
  nom: string;
  specialite: string;
  localisation: string;
  note: number;
  avis: number;
  distance: number;
  disponibilite: string;
  photo?: string;
  description: string;
  services: string[];
}

export default function RechercheProPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [localisation, setLocalisation] = useState('');

  const specialites = [
    { value: '', label: 'Toutes les spécialités' },
    { value: 'veterinaire', label: 'Vétérinaire généraliste' },
    { value: 'dentiste', label: 'Dentiste équin' },
    { value: 'osteopathe', label: 'Ostéopathe équin' },
    { value: 'maréchal-ferrant', label: 'Maréchal-ferrant' },
    { value: 'physiotherapeute', label: 'Physiothérapeute équin' },
    { value: 'comportementaliste', label: 'Comportementaliste équin' }
  ];

  const professionnels: Professionnel[] = [
    {
      id: '1',
      nom: 'Dr. Martin',
      specialite: 'Vétérinaire généraliste',
      localisation: 'Paris 15ème',
      note: 4.8,
      avis: 127,
      distance: 2.3,
      disponibilite: 'Disponible cette semaine',
      description: 'Vétérinaire spécialisé dans les soins des équidés avec plus de 15 ans d\'expérience.',
      services: ['Vaccination', 'Chirurgie', 'Urgences', 'Contrôles']
    },
    {
      id: '2',
      nom: 'Dr. Dubois',
      specialite: 'Dentiste équin',
      localisation: 'Boulogne-Billancourt',
      note: 4.9,
      avis: 89,
      distance: 4.1,
      disponibilite: 'Disponible dans 2 semaines',
      description: 'Spécialiste en dentisterie équine, formé aux techniques les plus récentes.',
      services: ['Détartrage', 'Extractions', 'Contrôles dentaires', 'Urgences dentaires']
    },
    {
      id: '3',
      nom: 'Dr. Lefebvre',
      specialite: 'Ostéopathe équin',
      localisation: 'Issy-les-Moulineaux',
      note: 4.7,
      avis: 156,
      distance: 3.7,
      disponibilite: 'Disponible demain',
      description: 'Ostéopathe certifié, spécialisé dans les troubles musculo-squelettiques des chevaux.',
      services: ['Ostéopathie', 'Rééducation', 'Massages', 'Bilan postural']
    },
    {
      id: '4',
      nom: 'M. Durand',
      specialite: 'Maréchal-ferrant',
      localisation: 'Vanves',
      note: 4.6,
      avis: 203,
      distance: 5.2,
      disponibilite: 'Disponible cette semaine',
      description: 'Maréchal-ferrant expérimenté, spécialisé dans la ferrure orthopédique.',
      services: ['Ferrure traditionnelle', 'Ferrure orthopédique', 'Parage', 'Urgences']
    },
    {
      id: '5',
      nom: 'Dr. Moreau',
      specialite: 'Physiothérapeute équin',
      localisation: 'Clamart',
      note: 4.8,
      avis: 94,
      distance: 6.1,
      disponibilite: 'Disponible dans 3 jours',
      description: 'Physiothérapeute spécialisé dans la rééducation des chevaux de sport.',
      services: ['Rééducation', 'Hydrothérapie', 'Électrothérapie', 'Massages thérapeutiques']
    }
  ];

  const filteredProfessionnels = professionnels.filter(pro => {
    const matchesSearch = pro.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.localisation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialite = !specialite || pro.specialite.toLowerCase().includes(specialite.toLowerCase());
    const matchesLocalisation = !localisation || pro.localisation.toLowerCase().includes(localisation.toLowerCase());
    
    return matchesSearch && matchesSpecialite && matchesLocalisation;
  });

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(note) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Recherche professionnel
        </h1>
        <p className="text-gray-600">
          Trouvez le professionnel idéal pour vos équidés
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Recherche"
            placeholder="Nom, spécialité, localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Select
            label="Spécialité"
            value={specialite}
            onChange={(e) => setSpecialite(e.target.value)}
            options={specialites}
            placeholder="Toutes les spécialités"
          />
          
          <Input
            label="Localisation"
            placeholder="Ville, code postal..."
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
          />
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredProfessionnels.length} professionnel{filteredProfessionnels.length > 1 ? 's' : ''} trouvé{filteredProfessionnels.length > 1 ? 's' : ''}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Trier par:</span>
            <Select
              value="distance"
              onChange={() => {}}
              options={[
                { value: 'distance', label: 'Distance' },
                { value: 'note', label: 'Note' },
                { value: 'disponibilite', label: 'Disponibilité' }
              ]}
            />
          </div>
        </div>

        {filteredProfessionnels.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Aucun professionnel ne correspond à vos critères de recherche.</p>
          </Card>
        ) : (
          filteredProfessionnels.map((pro) => (
            <Card key={pro.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{pro.nom}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-[#f86f4d] bg-opacity-10 text-[#f86f4d] rounded-full">
                        {pro.specialite}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{pro.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{pro.localisation} • {pro.distance} km</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <div className="flex">{renderStars(pro.note)}</div>
                        <span>{pro.note} ({pro.avis} avis)</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {pro.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-sm text-green-600 font-medium">{pro.disponibilite}</p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button variant="primary" size="sm">
                    Prendre RDV
                  </Button>
                  <Button variant="secondary" size="sm">
                    Voir profil
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
