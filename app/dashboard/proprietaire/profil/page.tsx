'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  const [formData, setFormData] = useState(profileData);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Charger les données du profil depuis Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setLoading(false);
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
          return;
        }

        // 3. Charger les infos depuis proprio_profiles si PROPRIETAIRE
        if (userRow.role === 'PROPRIETAIRE') {
          const { data: proprioProfile, error: proprioError } = await supabase!
            .from('proprio_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (proprioError) {
            console.error('Erreur lors du chargement du profil propriétaire:', proprioError);
            setLoading(false);
            return;
          }

          if (proprioProfile) {
            const profile = {
              prenom: proprioProfile.prenom || '',
              nom: proprioProfile.nom || '',
              email: userRow.email || '',
              telephone: proprioProfile.telephone || '',
              adresse: proprioProfile.adresse || ''
            };
            setProfileData(profile);
            setFormData(profile);
            
            
            console.log('✅ Profil propriétaire chargé:', profile);
          }
        } else {
          console.error('Rôle non reconnu:', userRow.role);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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


  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus({ type: null, message: '' });

      // 1. Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      if (userError || !user) {
        setSaveStatus({ 
          type: 'error', 
          message: 'Utilisateur non authentifié' 
        });
        return;
      }

      // 2. Vérifier le rôle dans la table users
      const { data: userRow, error: userRowError } = await supabase!
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userRowError || !userRow) {
        setSaveStatus({ 
          type: 'error', 
          message: 'Erreur lors de la récupération du rôle' 
        });
        return;
      }

      // 3. Mettre à jour proprio_profiles si PROPRIETAIRE
      if (userRow.role === 'PROPRIETAIRE') {
        console.log('🔄 Mise à jour du profil propriétaire:', {
          user_id: user.id,
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          adresse: formData.adresse
        });
        
        const { error: updateError } = await supabase!
          .from('proprio_profiles')
          .update({
            prenom: formData.prenom,
            nom: formData.nom,
            telephone: formData.telephone,
            adresse: formData.adresse
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour:', updateError);
          setSaveStatus({ 
            type: 'error', 
            message: 'Erreur lors de la sauvegarde: ' + updateError.message 
          });
        } else {
          console.log('✅ Profil propriétaire mis à jour avec succès');
          setProfileData(formData);
          setIsEditing(false);
          setSaveStatus({ 
            type: 'success', 
            message: 'Profil mis à jour avec succès ✅' 
          });
          
          // Masquer le message de succès après 3 secondes
          setTimeout(() => {
            setSaveStatus({ type: null, message: '' });
          }, 3000);
        }
      } else {
        setSaveStatus({ 
          type: 'error', 
          message: 'Rôle non reconnu' 
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus({ 
        type: 'error', 
        message: 'Erreur de connexion lors de la sauvegarde' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
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

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        alert('Utilisateur non authentifié');
        return;
      }
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) {
        let message = 'Erreur lors de la suppression du compte';
        try {
          const body = await res.json();
          if (body && body.error) message = body.error;
        } catch {}
        alert(message);
        return;
      }
      await supabase!.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error('Erreur suppression compte:', e);
      alert('Erreur inattendue lors de la suppression du compte');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center py-12">
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
      {/* Messages de feedback */}
      {saveStatus.type && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{saveStatus.message}</p>
        </div>
      )}

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
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
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
              
              {/* Deuxième ligne : Email sur toute la largeur - Toujours en lecture seule */}
              <div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={true}
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>
              
              {/* Troisième ligne : Téléphone et Adresse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Téléphone"
                  name="telephone"
                  value={isEditing ? formData.telephone : profileData.telephone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                
                <Input
                  label="Adresse"
                  name="adresse"
                  value={isEditing ? formData.adresse : profileData.adresse}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Entrez votre adresse"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Ces informations facilitent la recherche de professionnels à proximité.
              </p>
            </div>
          </Card>


          {/* Password Change */}
          <Card variant="elevated">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Changer le mot de passe</h3>
            
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
