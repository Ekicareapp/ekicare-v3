'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Input from '@/app/dashboard/pro/components/Input';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, CreditCard, Save, AlertTriangle, Upload, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const professions = [
  'Ostéopathe',
  'Vétérinaire',
  'Maréchal-ferrant',
  'Dentiste',
  'Physiothérapeute',
  'Autre'
];

const moyensPaiementOptions = [
  'CB',
  'Espèces',
  'Chèque',
  'Virement'
];

const priceRangeOptions = [
  { value: '€', label: '€ - Économique' },
  { value: '€€', label: '€€ - Moyen' },
  { value: '€€€', label: '€€€ - Premium' }
];

export default function ProfilPage() {
  const [formData, setFormData] = useState({
    prenom: 'Dr. Jean',
    nom: 'Martin',
    telephone: '06 12 34 56 78',
    profession: 'Vétérinaire',
    villeReference: 'Paris',
    rayonIntervention: 30,
    siret: '12345678901234',
    photo: null as File | null,
    photoPreview: null as string | null,
    bio: 'Vétérinaire spécialisé dans les soins des équidés avec plus de 15 ans d\'expérience. Diplômé de l\'École Nationale Vétérinaire d\'Alfort.',
    moyensPaiement: ['CB', 'Espèces', 'Chèque', 'Virement'],
    priceRange: '€€',
    experienceYears: 15
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les données du profil au montage du composant
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié');
          setIsLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('pro_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Erreur lors du chargement du profil:', profileError);
          setIsLoading(false);
          return;
        }

        if (profile) {
          setFormData({
            prenom: profile.prenom || '',
            nom: profile.nom || '',
            telephone: profile.telephone || '',
            profession: profile.profession || 'Vétérinaire',
            villeReference: profile.ville_nom || '',
            rayonIntervention: profile.rayon_km || 30,
            siret: profile.siret || '',
            photo: null,
            photoPreview: profile.photo_url || null,
            bio: profile.bio || '',
            moyensPaiement: profile.payment_methods || ['CB', 'Espèces', 'Chèque', 'Virement'],
            priceRange: profile.price_range || '€€',
            experienceYears: profile.experience_years || 0
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Reset error state
    setPhotoError(null);
    
    // Si aucun fichier choisi → rien ne se passe
    if (!file) {
      return;
    }
    
    // Validation du format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Format non supporté. Veuillez sélectionner un fichier JPG ou PNG.');
      return;
    }
    
    // Validation de la taille (5 Mo max)
    const maxSize = 5 * 1024 * 1024; // 5 Mo en bytes
    if (file.size > maxSize) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setPhotoError(`Fichier trop volumineux (${sizeInMB} Mo). Taille maximale : 5 Mo.`);
      return;
    }
    
    // Validation de la taille minimale
    if (file.size < 1024) { // 1 Ko minimum
      setPhotoError('Fichier trop petit. Veuillez sélectionner une image valide.');
      return;
    }
    
    // Preview immédiate avant l'upload pour améliorer l'UX
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      photo: file,
      photoPreview: previewUrl
    }));
    
    try {
      setIsUploadingPhoto(true);
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Créer le chemin de fichier: avatars/${userId}/profile.jpg
      const filePath = `${user.id}/profile.jpg`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permet de remplacer l'image existante
        });
      
      if (uploadError) {
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }
      
      // Récupérer l'URL publique de l'image
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Mettre à jour la base de données avec l'URL de la photo
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({ photo_url: urlData.publicUrl })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }
      
      // Mettre à jour le state React avec l'URL publique (remplace la preview locale)
      setFormData(prev => ({
        ...prev,
        photo: file,
        photoPreview: urlData.publicUrl
      }));
      
      // Nettoyer la preview locale
      URL.revokeObjectURL(previewUrl);
      
      console.log('Photo uploadée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
      
      // En cas d'erreur, restaurer l'état précédent
      setFormData(prev => ({
        ...prev,
        photo: null,
        photoPreview: prev.photoPreview // Garder l'ancienne image si elle existait
      }));
      
      // Nettoyer la preview locale en cas d'erreur
      URL.revokeObjectURL(previewUrl);
      
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleMoyensPaiementChange = (moyen: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      moyensPaiement: checked
        ? [...prev.moyensPaiement, moyen]
        : prev.moyensPaiement.filter(m => m !== moyen)
    }));
  };

  const handleRemovePhoto = async () => {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Supprimer l'image du Storage
      const filePath = `${user.id}/profile.jpg`;
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
      
      if (deleteError) {
        console.warn('Erreur lors de la suppression du fichier:', deleteError.message);
        // On continue même si la suppression du fichier échoue
      }
      
      // Mettre à jour la base de données pour supprimer l'URL
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({ photo_url: null })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }
      
      // Mettre à jour le state local
      setFormData(prev => ({
        ...prev,
        photo: null,
        photoPreview: null
      }));
      
      setPhotoError(null);
      console.log('Photo supprimée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const handleSave = async () => {
    try {
      // Préparer les données pour la sauvegarde (sans photo_url car géré séparément)
      const profileData = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        profession: formData.profession,
        ville_nom: formData.villeReference,
        rayon_km: formData.rayonIntervention,
        siret: formData.siret,
        bio: formData.bio,
        payment_methods: formData.moyensPaiement,
        price_range: formData.priceRange,
        experience_years: formData.experienceYears,
        updated_at: new Date().toISOString()
      };
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Sauvegarder en base de données
      const { data, error } = await supabase
        .from('pro_profiles')
        .upsert({
          user_id: user.id,
          ...profileData
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
      
      setIsEditing(false);
      setPhotoError(null);
      
      // Feedback de succès
      console.log('Profil sauvegardé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Supprimer le compte
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6b7280]">Chargement de votre profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mon profil
          </h1>
          <p className="text-[#6b7280] text-lg">
            Gérez vos informations professionnelles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
                Enregistrer
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Photo de profil */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Photo de profil</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative flex-shrink-0">
            {formData.photoPreview ? (
              <div 
                className="rounded-full overflow-hidden border-2 border-[#e5e7eb] bg-white"
                style={{ width: '120px', height: '120px' }}
              >
                <img
                  src={formData.photoPreview}
                  alt="Photo de profil"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ) : (
              <div 
                className="rounded-full bg-[#f3f4f6] flex items-center justify-center border-2 border-[#e5e7eb]"
                style={{ width: '120px', height: '120px' }}
              >
                <User className="w-8 h-8 text-[#6b7280]" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-[#6b7280] mb-3">
              Ajoutez une photo professionnelle pour améliorer votre visibilité auprès des propriétaires.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={!isEditing}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!isEditing || isUploadingPhoto}
                onClick={handlePhotoButtonClick}
                icon={isUploadingPhoto ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              >
                {isUploadingPhoto ? 'Upload en cours...' : (formData.photoPreview ? 'Remplacer la photo' : 'Changer la photo')}
              </Button>
              
              {formData.photoPreview && isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  icon={<AlertTriangle className="w-4 h-4" />}
                >
                  Supprimer
                </Button>
              )}
            </div>
            
            {photoError && (
              <p className="text-xs text-[#ef4444] mt-2 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {photoError}
              </p>
            )}
            
            <p className="text-xs text-[#6b7280] mt-2">
              Formats acceptés: JPG, PNG. Taille max: 5MB
            </p>
          </div>
        </div>
      </Card>

      {/* Informations personnelles */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Informations personnelles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Prénom"
            name="prenom"
            value={formData.prenom}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
            placeholder="Votre prénom"
          />
          <Input
            label="Nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
            placeholder="Votre nom"
          />
          <Input
            label="Téléphone"
            name="telephone"
            type="tel"
            value={formData.telephone}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
            placeholder="06 12 34 56 78"
          />
        </div>
      </Card>

      {/* Informations professionnelles */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Informations professionnelles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Profession</label>
            <select
              name="profession"
              value={formData.profession}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] bg-white disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
            >
              {professions.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Années d'expérience"
            name="experienceYears"
            type="number"
            value={formData.experienceYears}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
            placeholder="15"
            min="0"
            max="60"
          />
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-[#111827] mb-2">Bio / Description</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
            placeholder="Décrivez votre expérience et votre expertise..."
          />
        </div>
      </Card>

      {/* Zone d'intervention */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Zone d'intervention</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Ville de référence</label>
            <input
              type="text"
              name="villeReference"
              value={formData.villeReference}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Commencez à taper une ville..."
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              Rayon d'intervention : {formData.rayonIntervention} km
            </label>
            <input
              type="range"
              name="rayonIntervention"
              min={5}
              max={200}
              step={5}
              value={formData.rayonIntervention}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer slider disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, #f86f4d 0%, #f86f4d ${(formData.rayonIntervention - 5) / (200 - 5) * 100}%, #e5e7eb ${(formData.rayonIntervention - 5) / (200 - 5) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#6b7280] mt-1">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Informations légales */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Informations légales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Numéro SIRET"
            name="siret"
            value={formData.siret}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
            placeholder="12345678901234"
          />
        </div>
      </Card>

      {/* Tarifs et moyens de paiement */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Tarifs et paiement</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Fourchette tarifaire</label>
            <select
              name="priceRange"
              value={formData.priceRange}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] bg-white disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
            >
              {priceRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-[#6b7280] mt-2">
              Cette fourchette tarifaire sera affichée aux propriétaires lors de la consultation de votre profil.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Moyens de paiement acceptés</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {moyensPaiementOptions.map((moyen) => (
                <label key={moyen} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.moyensPaiement.includes(moyen)}
                    onChange={(e) => handleMoyensPaiementChange(moyen, e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-[#f86f4d] border-[#e5e7eb] rounded focus:border-[#ff6b35] disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-[#111827]">{moyen}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Supprimer le compte */}
      <Card variant="elevated" className="border-[#fee2e2]">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-[#fee2e2] rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#111827] mb-2">Supprimer mon compte</h3>
            <p className="text-[#6b7280] mb-4">
              Cette action est irréversible. Votre compte et vos données seront définitivement supprimés.
            </p>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-[#fee2e2] text-[#b91c1c] border-[#fecaca] hover:bg-[#fecaca]"
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg border border-[#e5e7eb] shadow-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-[#fee2e2] rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111827]">Confirmer la suppression</h3>
                </div>
                
                <p className="text-[#6b7280] mb-6">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                    Annuler
                  </Button>
                  <Button variant="danger" onClick={handleDeleteAccount}>
                    Confirmer la suppression
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
