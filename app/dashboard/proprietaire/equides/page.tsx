'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Equide {
  id: string;
  nom: string;
  age: number;
  sexe: string;
  race: string;
  robe: string;
  description?: string;
  dateAjout: string;
}

export default function EquidesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      description: 'Jument très douce et calme, parfaite pour les débutants. Excellente en dressage.',
      dateAjout: '2024-01-10'
    },
    {
      id: '2',
      nom: 'Thunder',
      age: 12,
      sexe: 'Étalon',
      race: 'Quarter Horse',
      robe: 'Noir',
      description: 'Étalon puissant et énergique, idéal pour le travail du bétail et les compétitions.',
      dateAjout: '2024-01-05'
    },
    {
      id: '3',
      nom: 'Luna',
      age: 6,
      sexe: 'Jument',
      race: 'Friesian',
      robe: 'Noir',
      description: 'Jument élégante et gracieuse, très appréciée pour les spectacles et le dressage.',
      dateAjout: '2024-01-15'
    }
  ]);

  const [formData, setFormData] = useState({
    nom: '',
    age: '',
    sexe: '',
    race: '',
    robe: '',
    description: ''
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
      description: formData.description,
      dateAjout: new Date().toISOString().split('T')[0]
    };

    setEquides(prev => [newEquide, ...prev]);
    setFormData({
      nom: '',
      age: '',
      sexe: '',
      race: '',
      robe: '',
      description: ''
    });
    setIsModalOpen(false);
  };


  const handleEditEquide = (equide: Equide) => {
    setSelectedEquide(equide);
    setFormData({
      nom: equide.nom,
      age: equide.age.toString(),
      sexe: equide.sexe,
      race: equide.race,
      robe: equide.robe,
      description: equide.description || ''
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
      robe: formData.robe,
      description: formData.description
    };

    setEquides(prev => prev.map(equide => 
      equide.id === selectedEquide.id ? updatedEquide : equide
    ));
    
    setFormData({
      nom: '',
      age: '',
      sexe: '',
      race: '',
      robe: '',
      description: ''
    });
    setSelectedEquide(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteEquide = (equideId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet équidé ?')) {
      setEquides(prev => prev.filter(equide => equide.id !== equideId));
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mes équidés
          </h1>
          <p className="text-[#6b7280] text-lg">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {equides.map((equide) => (
          <Card key={equide.id} variant="elevated" className="relative">
            {/* Icônes d'action en haut à droite */}
            <div className="absolute top-4 right-4 flex space-x-1">
              {/* Icône crayon (modifier) */}
              <button
                onClick={() => handleEditEquide(equide)}
                className="p-2 text-gray-400 hover:text-[#f86f4d] hover:bg-[#fef2f2] rounded-lg transition-all duration-200"
                title="Modifier l'équidé"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              {/* Icône poubelle (supprimer) */}
              <button
                onClick={() => handleDeleteEquide(equide.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Supprimer l'équidé"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="pr-20">
              {/* Nom en titre (gras, plus visible) */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{equide.nom}</h3>
              
              {/* Race + âge + sexe dans une ligne compacte */}
              <p className="text-sm text-gray-600 mb-2">{equide.race} • {equide.age} ans • {equide.sexe}</p>
              
              {/* Couleur (robe) */}
              <p className="text-sm text-gray-500 mb-3">Robe: {equide.robe}</p>
              
              {/* Description en bas (texte plus petit, italique) */}
              {equide.description && (
                <p className="text-xs text-gray-500 italic leading-relaxed">{equide.description}</p>
              )}
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
          
          <div>
            <Input
              label="Description (optionnel)"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez l'équidé, son caractère, ses particularités..."
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
          
          <div>
            <Input
              label="Description (optionnel)"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez l'équidé, son caractère, ses particularités..."
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
