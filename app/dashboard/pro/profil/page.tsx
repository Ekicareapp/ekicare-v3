'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Input from '@/app/dashboard/pro/components/Input';
import { User, Save, AlertTriangle, Upload, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FeedbackModal from '@/components/FeedbackModal';
import { useDeleteAccount, DeleteConfirmModal } from '@/components/DeleteAccount';
import SubscriptionCard from './SubscriptionCard';
 

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

const timeSlots = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

const daysOfWeek = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' }
];

export default function ProfilPage() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    profession: '',
    villeReference: '',
    rayonIntervention: 30,
    siret: '',
    photo: null as File | null,
    photoPreview: null as string | null,
    bio: '',
    moyensPaiement: ['CB', 'Espèces', 'Chèque', 'Virement'],
    priceRange: '€€',
    experienceYears: '',
    averageConsultationDuration: ''
  });

  const [workingHours, setWorkingHours] = useState<Record<string, { active: boolean; start: string; end: string }>>({
    lundi: { active: false, start: '08:00', end: '17:00' },
    mardi: { active: false, start: '08:00', end: '17:00' },
    mercredi: { active: false, start: '08:00', end: '17:00' },
    jeudi: { active: false, start: '08:00', end: '17:00' },
    vendredi: { active: false, start: '08:00', end: '17:00' },
    samedi: { active: false, start: '08:00', end: '17:00' },
    dimanche: { active: false, start: '08:00', end: '17:00' }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isOpen, open, close, confirm } = useDeleteAccount();
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fonctions pour gérer les horaires de travail
  const handleWorkingDayToggle = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active
      }
    }));
  };

  const handleWorkingTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const validateWorkingHours = () => {
    for (const day of daysOfWeek) {
      const dayHours = workingHours[day.key];
      if (dayHours.active && dayHours.start >= dayHours.end) {
        return false;
      }
    }
    return true;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Charger les données du profil au montage du composant
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setLoading(false);
          setIsLoading(false);
          return;
        }

        // 2. Vérifier le rôle dans la table users
        const { data: userRow, error: userRowError } = await supabase!
          .from('users')
          .select('role, email')
          .eq('id', user.id)
          .single();

        if (userRowError || !userRow) {
          console.error('Erreur lors de la récupération du rôle:', userRowError);
          setLoading(false);
          setIsLoading(false);
          return;
        }

        // 3. Charger les infos depuis pro_profiles si PROFESSIONNEL
        if (userRow.role === 'PRO') {
          const { data: proProfile, error: proError } = await supabase!
            .from('pro_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (proError) {
            console.error('Erreur lors du chargement du profil professionnel:', proError);
            setLoading(false);
            setIsLoading(false);
            return;
          }

          if (proProfile) {
            setFormData({
              prenom: proProfile.prenom || '',
              nom: proProfile.nom || '',
              telephone: proProfile.telephone || '',
              profession: proProfile.profession || 'Vétérinaire',
              villeReference: proProfile.ville_nom || '',
              rayonIntervention: proProfile.rayon_km || 30,
              siret: proProfile.siret || '',
              photo: null,
              photoPreview: proProfile.photo_url ? `${proProfile.photo_url}?t=${Date.now()}` : null,
              bio: proProfile.bio || '',
              moyensPaiement: proProfile.payment_methods || ['CB', 'Espèces', 'Chèque', 'Virement'],
              priceRange: proProfile.price_range || '€€',
              experienceYears: (proProfile.experience_years !== null && proProfile.experience_years !== undefined)
                ? String(proProfile.experience_years)
                : '',
              averageConsultationDuration: (proProfile.average_consultation_duration !== null && proProfile.average_consultation_duration !== undefined)
                ? String(proProfile.average_consultation_duration)
                : ''
            });

            // Charger les horaires de travail
            if (proProfile.working_hours && typeof proProfile.working_hours === 'object') {
              // Fusionner avec les valeurs par défaut pour s'assurer que tous les jours sont présents
              const defaultHours = {
                lundi: { active: false, start: '08:00', end: '17:00' },
                mardi: { active: false, start: '08:00', end: '17:00' },
                mercredi: { active: false, start: '08:00', end: '17:00' },
                jeudi: { active: false, start: '08:00', end: '17:00' },
                vendredi: { active: false, start: '08:00', end: '17:00' },
                samedi: { active: false, start: '08:00', end: '17:00' },
                dimanche: { active: false, start: '08:00', end: '17:00' }
              };
              setWorkingHours({ ...defaultHours, ...proProfile.working_hours });
            }
            console.log('✅ Profil professionnel chargé:', proProfile);
            console.log('✅ Années d\'expérience chargées:', proProfile.experience_years);
          }
        } else {
          console.error('Rôle non reconnu:', userRow.role);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: any = value;
    
    // Spécifique aux champs numériques saisis librement: autoriser la valeur vide pour permettre la saisie
    if (name === 'experienceYears' || name === 'averageConsultationDuration') {
      finalValue = value; // conserver la chaîne telle quelle (y compris '')
    } else if (type === 'number' || type === 'range') {
      // Conversion stricte en nombre pour les autres champs numériques
      finalValue = value === '' ? 0 : Number(value);
    }
    
    console.log(`Modification du champ ${name}:`, value, '→', finalValue);
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
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
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Créer le chemin de fichier: pro_photo/${userId}/profile.jpg
      const filePath = `${user.id}/profile.jpg`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from('pro_photo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permet de remplacer l'image existante
        });
      
      if (uploadError) {
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }
      
      // Récupérer l'URL publique de l'image avec cache buster
      const { data: urlData } = supabase!.storage
        .from('pro_photo')
        .getPublicUrl(filePath);
      
      // Ajouter un timestamp pour forcer le rechargement de l'image
      const urlWithCacheBuster = `${urlData.publicUrl}?t=${Date.now()}`;
      
      // Mettre à jour la base de données avec l'URL de la photo
      const { error: updateError } = await supabase!
        .from('pro_profiles')
        .update({ photo_url: urlWithCacheBuster })
        .eq('user_id', user.id);
      
      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }
      
      // Mettre à jour le state React avec l'URL publique (remplace la preview locale)
      setFormData(prev => ({
        ...prev,
        photo: file,
        photoPreview: urlWithCacheBuster
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
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Supprimer l'image du Storage
      const filePath = `${user.id}/profile.jpg`;
      const { error: deleteError } = await supabase!.storage
        .from('pro_photo')
        .remove([filePath]);
      
      if (deleteError) {
        console.warn('Erreur lors de la suppression du fichier:', deleteError.message);
        // On continue même si la suppression du fichier échoue
      }
      
      // Mettre à jour la base de données pour supprimer l'URL
      const { error: updateError } = await supabase!
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
      // Validation des horaires de travail
      if (!validateWorkingHours()) {
        alert('Erreur : L\'heure de début doit être antérieure à l\'heure de fin pour les jours actifs.');
        return;
      }

      // Préparer les horaires de travail (seulement les jours actifs)
      const activeWorkingHours: Record<string, { active: boolean; start: string; end: string }> = {};
      Object.entries(workingHours).forEach(([day, hours]) => {
        if (hours.active) {
          activeWorkingHours[day] = hours;
        }
      });

      // Préparer les données pour la sauvegarde (sans photo_url car géré séparément)
      const profileData = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        profession: formData.profession,
        ville_nom: formData.villeReference,
        rayon_km: Number(formData.rayonIntervention),
        siret: formData.siret,
        bio: formData.bio,
        payment_methods: formData.moyensPaiement,
        price_range: formData.priceRange,
        experience_years: Number(formData.experienceYears || 0),
        average_consultation_duration: formData.averageConsultationDuration === '' ? null : Number(formData.averageConsultationDuration),
        working_hours: activeWorkingHours
      };
      
      console.log('💾 Sauvegarde du profil:', profileData);
      
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Sauvegarder en base de données
      const { data, error } = await supabase!
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
      console.log('✅ Profil sauvegardé avec succès !');
      showToast('Horaires de travail enregistrés avec succès', 'success');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setPhotoError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
      showToast('Erreur lors de la sauvegarde du profil', 'error');
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Supprimer le compte
    setShowDeleteConfirm(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSave = async () => {
    try {
      setPasswordLoading(true);
      setPasswordStatus({ type: null, message: '' });

      // Validation des champs
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordStatus({ 
          type: 'error', 
          message: 'Veuillez remplir tous les champs' 
        });
        return;
      }

      // Vérification que les mots de passe correspondent
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordStatus({ 
          type: 'error', 
          message: 'Les mots de passe ne correspondent pas' 
        });
        return;
      }

      // Vérification de la longueur du mot de passe
      if (passwordData.newPassword.length < 6) {
        setPasswordStatus({ 
          type: 'error', 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
        return;
      }

      // Mise à jour du mot de passe via Supabase Auth
      const { error } = await supabase!.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        setPasswordStatus({ 
          type: 'error', 
          message: error.message || 'Erreur lors du changement de mot de passe' 
        });
      } else {
        setPasswordStatus({ 
          type: 'success', 
          message: 'Mot de passe mis à jour avec succès ✅' 
        });
        
        // Vider les champs
        setPasswordData({
          newPassword: '',
          confirmPassword: ''
        });

        // Masquer le message de succès après 3 secondes
        setTimeout(() => {
          setPasswordStatus({ type: null, message: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      setPasswordStatus({ 
        type: 'error', 
        message: 'Erreur de connexion lors du changement de mot de passe' 
      });
    } finally {
      setPasswordLoading(false);
    }
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

      {/* Bouton feedback sous le header */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          className="text-[#f86f4d] hover:text-[#fa8265] hover:underline font-medium transition-colors"
        >
          Donner mon avis
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <Input
              label="Durée moyenne des consultations (minutes)"
              name="averageConsultationDuration"
              type="number"
              value={formData.averageConsultationDuration}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="30"
              min="5"
              max="240"
            />
          </div>
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

      {/* Horaires de travail */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Horaires de travail</h2>
        
        <div className="space-y-3">
          {daysOfWeek.map((day) => {
            const dayHours = workingHours[day.key] || { active: false, start: '08:00', end: '17:00' };
            return (
              <div key={day.key} className="flex items-center justify-between py-3 px-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                {/* Case à cocher et label du jour */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`work-${day.key}`}
                    checked={dayHours.active}
                    onChange={() => handleWorkingDayToggle(day.key)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-[#ff6b35] bg-white border-neutral-300 rounded focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-0 disabled:bg-neutral-100 disabled:border-neutral-200"
                  />
                  <label htmlFor={`work-${day.key}`} className="text-sm font-medium text-neutral-900 cursor-pointer">
                    {day.label}
                  </label>
                </div>

                {/* Dropdowns pour les heures */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <select
                      value={dayHours.start}
                      onChange={(e) => handleWorkingTimeChange(day.key, 'start', e.target.value)}
                      disabled={!isEditing || !dayHours.active}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-neutral-400 text-sm">—</span>

                  <div className="flex items-center space-x-2">
                    <select
                      value={dayHours.end}
                      onChange={(e) => handleWorkingTimeChange(day.key, 'end', e.target.value)}
                      disabled={!isEditing || !dayHours.active}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Abonnement */}
      <SubscriptionCard />

      {/* Password Change */}
      <Card variant="elevated">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Changer le mot de passe</h2>
        
        {/* Messages de feedback pour le mot de passe */}
        {passwordStatus.type && (
          <div className={`p-4 rounded-lg border flex items-center space-x-3 mb-6 ${
            passwordStatus.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {passwordStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{passwordStatus.message}</p>
          </div>
        )}
        
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
            <Button 
              variant="primary" 
              onClick={handlePasswordSave}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
            </Button>
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
              onClick={open}
              className="bg-[#fee2e2] text-[#b91c1c] border-[#fecaca] hover:bg-[#fecaca]"
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </Card>

      <DeleteConfirmModal isOpen={isOpen} onCancel={close} onConfirm={confirm} />

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal feedback */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
