'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { Plus } from 'lucide-react';

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquide, setSelectedEquide] = useState<Equide | null>(null);
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

  const handleViewEquide = (equide: Equide) => {
    setSelectedEquide(equide);
    setIsViewModalOpen(true);
  };

  const handleEditEquide = (equide: Equide) => {
    setSelectedEquide(equide);
    setFormData({
      nom: equide.nom,
      age: equide.age.toString(),
      sexe: equide.sexe,
      race: equide.race,
      robe: equide.robe
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEquide = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.age || !formData.sexe || !formData.race || !formData.robe || !selectedEquide) {
      return;
    }

    const updatedEquide: Equide = {
      ...selectedEquide,
      nom: formData.nom,
      age: parseInt(formData.age),
      sexe: formData.sexe,
      race: formData.race,
      robe: formData.robe
    };

    setEquides(prev => prev.map(equide => 
      equide.id === selectedEquide.id ? updatedEquide : equide
    ));
    
    setFormData({
      nom: '',
      age: '',
      sexe: '',
      race: '',
      robe: ''
    });
    setSelectedEquide(null);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Mes équidés
          </h1>
          <p className="text-gray-600 text-lg">
            Gérez vos équidés et leurs informations
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Ajouter un équidé
        </Button>
      </div>

      {/* Equides List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equides.map((equide) => (
          <Card key={equide.id} variant="elevated">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{equide.nom}</h3>
              <p className="text-sm text-gray-600 mb-4">{equide.age} ans • {equide.sexe}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Race</span>
                  <span className="text-sm font-semibold text-gray-900">{equide.race}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Robe</span>
                  <span className="text-sm font-semibold text-gray-900">{equide.robe}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 cursor-pointer"
                onClick={() => handleViewEquide(equide)}
              >
                Voir l'équidé
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex-1 cursor-pointer"
                onClick={() => handleEditEquide(equide)}
              >
                Modifier
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Equide Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un équidé"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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

      {/* View Equide Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Informations de l'équidé"
        size="md"
      >
        {selectedEquide && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{selectedEquide.nom}</h3>
              <p className="text-lg text-gray-600">{selectedEquide.age} ans • {selectedEquide.sexe}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Race</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedEquide.race}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Robe</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedEquide.robe}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Ajouté le</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedEquide.dateAjout).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Equide Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'équidé"
        size="lg"
      >
        <form onSubmit={handleUpdateEquide} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
