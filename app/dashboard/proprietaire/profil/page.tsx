'use client';

import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nom: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    telephone: '06 12 34 56 78',
    adresse: '123 Rue de la Paix',
    ville: 'Paris',
    codePostal: '75001',
    dateNaissance: '1985-03-15',
    profession: 'Propriétaire de chevaux',
    experience: '5-10 ans',
    photo: null as File | null
  });

  const [formData, setFormData] = useState(profileData);

  const experienceOptions = [
    { value: '0-1 ans', label: '0-1 an' },
    { value: '1-3 ans', label: '1-3 ans' },
    { value: '3-5 ans', label: '3-5 ans' },
    { value: '5-10 ans', label: '5-10 ans' },
    { value: '10+ ans', label: '10+ ans' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSave = () => {
    setProfileData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Mon profil
          </h1>
          <p className="text-gray-600">
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
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Photo & Basic Info */}
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  {profileData.photo ? (
                    <img
                      src={URL.createObjectURL(profileData.photo)}
                      alt="Photo de profil"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-[#f86f4d] text-white rounded-full p-2 cursor-pointer hover:bg-[#e55a3a] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {isEditing ? formData.nom : profileData.nom}
              </h2>
              <p className="text-gray-600 mb-4">
                {isEditing ? formData.profession : profileData.profession}
              </p>
              
              <div className="text-sm text-gray-500">
                <p>Membre depuis janvier 2024</p>
                <p>3 équidés enregistrés</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nom complet"
                name="nom"
                value={isEditing ? formData.nom : profileData.nom}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Email"
                name="email"
                type="email"
                value={isEditing ? formData.email : profileData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Téléphone"
                name="telephone"
                value={isEditing ? formData.telephone : profileData.telephone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Date de naissance"
                name="dateNaissance"
                type="date"
                value={isEditing ? formData.dateNaissance : profileData.dateNaissance}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Profession"
                name="profession"
                value={isEditing ? formData.profession : profileData.profession}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Select
                label="Expérience avec les chevaux"
                name="experience"
                value={isEditing ? formData.experience : profileData.experience}
                onChange={handleInputChange}
                options={experienceOptions}
                disabled={!isEditing}
              />
            </div>
          </Card>

          {/* Address */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Adresse</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Adresse"
                  name="adresse"
                  value={isEditing ? formData.adresse : profileData.adresse}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              <Input
                label="Code postal"
                name="codePostal"
                value={isEditing ? formData.codePostal : profileData.codePostal}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Ville"
                name="ville"
                value={isEditing ? formData.ville : profileData.ville}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Paramètres du compte</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications par email</h4>
                  <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f86f4d] peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f86f4d]"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications SMS</h4>
                  <p className="text-sm text-gray-500">Recevoir des notifications par SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f86f4d] peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f86f4d]"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="font-medium text-gray-900">Changer le mot de passe</h4>
                  <p className="text-sm text-gray-500">Modifier votre mot de passe</p>
                </div>
                <Button variant="secondary" size="sm">
                  Modifier
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
