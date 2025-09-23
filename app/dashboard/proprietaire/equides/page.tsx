'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';

interface Equide {
  id: string;
  nom: string;
  age: number;
  sexe: string;
  race: string;
  robe: string;
  dateAjout: string;
}

export default function EquidesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equides, setEquides] = useState<Equide[]>([
    {
      id: '1',
      nom: 'Bella',
      age: 8,
      sexe: 'Jument',
      race: 'Pur-sang arabe',
      robe: 'Bai',
      dateAjout: '2024-01-10'
    },
    {
      id: '2',
      nom: 'Thunder',
      age: 12,
      sexe: 'Étalon',
      race: 'Quarter Horse',
      robe: 'Noir',
      dateAjout: '2024-01-05'
    },
    {
      id: '3',
      nom: 'Luna',
      age: 6,
      sexe: 'Jument',
      race: 'Friesian',
      robe: 'Noir',
      dateAjout: '2024-01-15'
    }
  ]);

  const [formData, setFormData] = useState({
    nom: '',
    age: '',
    sexe: '',
    race: '',
    robe: ''
  });

  const sexeOptions = [
    { value: 'Jument', label: 'Jument' },
    { value: 'Étalon', label: 'Étalon' },
    { value: 'Hongre', label: 'Hongre' }
  ];

  const raceOptions = [
    { value: 'Pur-sang arabe', label: 'Pur-sang arabe' },
    { value: 'Quarter Horse', label: 'Quarter Horse' },
    { value: 'Friesian', label: 'Friesian' },
    { value: 'Appaloosa', label: 'Appaloosa' },
    { value: 'Paint Horse', label: 'Paint Horse' },
    { value: 'Autre', label: 'Autre' }
  ];

  const robeOptions = [
    { value: 'Bai', label: 'Bai' },
    { value: 'Noir', label: 'Noir' },
    { value: 'Blanc', label: 'Blanc' },
    { value: 'Gris', label: 'Gris' },
    { value: 'Alezan', label: 'Alezan' },
    { value: 'Pie', label: 'Pie' },
    { value: 'Autre', label: 'Autre' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.age || !formData.sexe || !formData.race || !formData.robe) {
      return;
    }

    const newEquide: Equide = {
      id: Date.now().toString(),
      nom: formData.nom,
      age: parseInt(formData.age),
      sexe: formData.sexe,
      race: formData.race,
      robe: formData.robe,
      dateAjout: new Date().toISOString().split('T')[0]
    };

    setEquides(prev => [newEquide, ...prev]);
    setFormData({
      nom: '',
      age: '',
      sexe: '',
      race: '',
      robe: ''
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Mes équidés
          </h1>
          <p className="text-gray-600">
            Gérez vos équidés et leurs informations
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          variant="primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un équidé
        </Button>
      </div>

      {/* Equides List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equides.map((equide) => (
          <Card key={equide.id} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[#f86f4d] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#f86f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{equide.nom}</h3>
                  <p className="text-sm text-gray-500">{equide.age} ans • {equide.sexe}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Race:</span>
                <span className="text-sm font-medium text-gray-900">{equide.race}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Robe:</span>
                <span className="text-sm font-medium text-gray-900">{equide.robe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Ajouté le:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(equide.dateAjout).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  Voir les soins
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  Prendre RDV
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Equide Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un équidé"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom de l'équidé"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            placeholder="Ex: Bella"
            required
          />
          
          <Input
            label="Âge"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Ex: 8"
            min="0"
            max="50"
            required
          />
          
          <Select
            label="Sexe"
            name="sexe"
            value={formData.sexe}
            onChange={handleInputChange}
            options={sexeOptions}
            placeholder="Sélectionner le sexe"
            required
          />
          
          <Select
            label="Race"
            name="race"
            value={formData.race}
            onChange={handleInputChange}
            options={raceOptions}
            placeholder="Sélectionner la race"
            required
          />
          
          <Select
            label="Robe"
            name="robe"
            value={formData.robe}
            onChange={handleInputChange}
            options={robeOptions}
            placeholder="Sélectionner la robe"
            required
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Ajouter l'équidé
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
