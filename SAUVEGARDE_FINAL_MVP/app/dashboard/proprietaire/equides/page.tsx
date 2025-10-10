'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Equide {
  id: string;
  nom: string;
  age: number;
  sexe: string;
  race: string;
  robe: string;
  description?: string;
  proprio_id: string;
  created_at?: string;
}

export default function EquidesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquide, setSelectedEquide] = useState<Equide | null>(null);
  const [equides, setEquides] = useState<Equide[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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


  // Charger les équidés au montage du composant
  useEffect(() => {
    const loadEquides = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Charger les équidés du propriétaire
        const { data, error } = await supabase
          .from('equides')
          .select('*')
          .eq('proprio_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des équidés:', error);
          alert('Erreur lors du chargement des équidés');
        } else {
          setEquides(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEquides();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.age || !formData.sexe || !formData.race || !formData.robe) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!userId) {
      alert('Utilisateur non authentifié');
      return;
    }

    try {
      // Insérer le nouvel équidé dans Supabase
      const { data, error } = await supabase
        .from('equides')
        .insert([
          {
            nom: formData.nom,
            age: parseInt(formData.age),
            sexe: formData.sexe,
            race: formData.race,
            robe: formData.robe,
            description: formData.description || null,
            proprio_id: userId
          }
        ])
        .select();

      if (error) {
        console.error('Erreur lors de l\'ajout de l\'équidé:', error);
        alert('Erreur lors de l\'ajout de l\'équidé');
        return;
      }

      // Ajouter le nouvel équidé à la liste locale
      if (data && data.length > 0) {
        setEquides(prev => [data[0], ...prev]);
      }

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        age: '',
        sexe: '',
        race: '',
        robe: '',
        description: ''
      });
      setIsModalOpen(false);

      console.log('✅ Équidé ajouté avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
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

  const handleUpdateEquide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.age || !formData.sexe || !formData.race || !formData.robe || !selectedEquide) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Mettre à jour l'équidé dans Supabase
      const { error } = await supabase
        .from('equides')
        .update({
          nom: formData.nom,
          age: parseInt(formData.age),
          sexe: formData.sexe,
          race: formData.race,
          robe: formData.robe,
          description: formData.description || null
        })
        .eq('id', selectedEquide.id);

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'équidé:', error);
        alert('Erreur lors de la mise à jour de l\'équidé');
        return;
      }

      // Mettre à jour la liste locale
      setEquides(prev => prev.map(equide => 
        equide.id === selectedEquide.id ? {
          ...equide,
          nom: formData.nom,
          age: parseInt(formData.age),
          sexe: formData.sexe,
          race: formData.race,
          robe: formData.robe,
          description: formData.description || undefined
        } : equide
      ));
      
      // Réinitialiser le formulaire
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

      console.log('✅ Équidé modifié avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
  };

  const handleDeleteEquide = async (equideId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet équidé ?')) {
      return;
    }

    try {
      // Supprimer l'équidé de Supabase
      const { error } = await supabase
        .from('equides')
        .delete()
        .eq('id', equideId);

      if (error) {
        console.error('Erreur lors de la suppression de l\'équidé:', error);
        alert('Erreur lors de la suppression de l\'équidé');
        return;
      }

      // Retirer de la liste locale
      setEquides(prev => prev.filter(equide => equide.id !== equideId));

      console.log('✅ Équidé supprimé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6b7280]">Chargement de vos équidés...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Empty state */}
      {equides.length === 0 ? (
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucun équidé enregistré</h3>
          <p className="text-gray-600 mb-6">Commencez par ajouter votre premier équidé</p>
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Ajouter un équidé
          </Button>
        </Card>
      ) : (
        /* Equides List */
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
      )}

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
            
            <Input
              label="Race"
              name="race"
              value={formData.race}
              onChange={handleInputChange}
              placeholder="Ex: Pur-sang arabe"
              required
            />
            
            <Input
              label="Robe"
              name="robe"
              value={formData.robe}
              onChange={handleInputChange}
              placeholder="Ex: Bai"
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
            
            <Input
              label="Race"
              name="race"
              value={formData.race}
              onChange={handleInputChange}
              placeholder="Ex: Pur-sang arabe"
              required
            />
            
            <Input
              label="Robe"
              name="robe"
              value={formData.robe}
              onChange={handleInputChange}
              placeholder="Ex: Bai"
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
