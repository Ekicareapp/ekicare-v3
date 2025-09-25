'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { AlertTriangle } from 'lucide-react';

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie.dupont@email.com',
    telephone: '06 12 34 56 78',
    adresseComplete: '123 Rue de la Paix, 75001 Paris, France'
  });

  const [formData, setFormData] = useState(profileData);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSave = () => {
    setProfileData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const handlePasswordSave = () => {
    // TODO: Implement password change logic
    console.log('Changement de mot de passe:', passwordData);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    // TODO: Implement account deletion logic
    console.log('Suppression du compte confirmée');
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mon profil
          </h1>
          <p className="text-[#6b7280] text-lg">
            Gérez vos informations personnelles
          </p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Enregistrer
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)} icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }>
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
          <Card variant="elevated">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Informations personnelles</h3>
            
            <div className="space-y-6">
              {/* Première ligne : Prénom et Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Prénom"
                  name="prenom"
                  value={isEditing ? formData.prenom : profileData.prenom}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                
                <Input
                  label="Nom"
                  name="nom"
                  value={isEditing ? formData.nom : profileData.nom}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              {/* Deuxième ligne : Email sur toute la largeur */}
              <div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={isEditing ? formData.email : profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              {/* Troisième ligne : Téléphone et Adresse complète */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Téléphone"
                  name="telephone"
                  value={isEditing ? formData.telephone : profileData.telephone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                
                <div>
                  <Input
                    label="Adresse complète"
                    name="adresseComplete"
                    value={isEditing ? formData.adresseComplete : profileData.adresseComplete}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Entrez votre adresse complète"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    L'adresse sera sauvegardée avec les informations de localisation pour faciliter la recherche de professionnels à proximité.
                  </p>
                </div>
              </div>
            </div>
          </Card>


          {/* Password Change */}
          <Card variant="elevated">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Changer le mot de passe</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Nouveau mot de passe"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre nouveau mot de passe"
                />
                
                <Input
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>
              
              <div className="flex justify-start">
                <Button variant="primary" onClick={handlePasswordSave}>
                  Enregistrer le nouveau mot de passe
                </Button>
              </div>
            </div>
          </Card>

          {/* Account Deletion */}
          <Card variant="elevated">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Supprimer mon compte</h3>
            
            <div className="space-y-4">
              <div className="bg-[#fef2f2] border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-[#f86f4d] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#374151]">
                      Cette action est irréversible. Votre compte et vos données seront définitivement supprimés.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-start">
                <Button
                  variant="secondary"
                  onClick={handleDeleteAccount}
                  className="bg-[#fee2e2] text-[#b91c1c] border-[#fee2e2]"
                >
                  Supprimer mon compte
                </Button>
              </div>
            </div>
          </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-[#f86f4d] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement perdues.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={handleCancelDelete}
              className="bg-gray-100 text-gray-700 border-gray-300"
            >
              Annuler
            </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDelete}
                  className="bg-[#f86f4d] text-white border-[#f86f4d]"
                >
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
