'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import Link from 'next/link'

const professions = [
  'Vétérinaire équin',
  'Ostéopathe équin',
  'Dentiste équin',
  'Maréchal-ferrant',
  'Shiatsu équin',
  'Naturopathe équin',
  'Masseur équin',
  'Comportementaliste équin',
  'Kinésithérapeute équin',
]

export default function SignupPage() {
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fields, setFields] = useState<any>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [justifFile, setJustifFile] = useState<File | null>(null)
  const [villeAutocomplete, setVilleAutocomplete] = useState<any>(null)
  const [villeNom, setVilleNom] = useState('')
  const [villeLat, setVilleLat] = useState<number | null>(null)
  const [villeLng, setVilleLng] = useState<number | null>(null)
  const [rayonKm, setRayonKm] = useState(30)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  // Fonction de validation des champs
  const isFormValid = () => {
    // Champs obligatoires de base
    if (!email || !password || !confirmPassword || !role) {
      return false
    }

    // Validation du mot de passe
    if (password !== confirmPassword) {
      return false
    }

    // Validation selon le rôle
    if (role === 'PRO') {
      const requiredFields = ['prenom', 'nom', 'telephone', 'profession', 'siret']
      return requiredFields.every(field => fields[field] && fields[field].trim() !== '') && 
             villeNom && villeLat && villeLng && photoFile && justifFile
    }

    if (role === 'PROPRIETAIRE') {
      const requiredFields = ['prenom', 'nom']
      return requiredFields.every(field => fields[field] && fields[field].trim() !== '')
    }

    return false
  }

  // Fonction principale d'inscription
  const handleSignup = async () => {
    if (!isFormValid()) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    setError('')
    setFieldErrors({})
    
    try {
      // Créer l'utilisateur via l'API signup
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('role', role)
      
      // Ajouter les champs spécifiques au rôle
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string)
        }
      })

      if (role === 'PRO') {
        formData.append('ville_nom', villeNom)
        formData.append('ville_lat', villeLat?.toString() || '')
        formData.append('ville_lng', villeLng?.toString() || '')
        formData.append('rayon_km', rayonKm.toString())
      }

      if (photoFile) formData.append('photo', photoFile)
      if (justifFile) formData.append('justificatif', justifFile)

      console.log('🚀 Création du compte utilisateur...')
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      })
      
      const signupData = await signupResponse.json()
      
      if (signupData.error) {
        // Gestion des erreurs spécifiques
        let apiFieldErrors: { [key: string]: string } = {}
        if (signupData.error.includes('User already registered')) {
          apiFieldErrors.email = 'Cet email est déjà utilisé'
        } else if (signupData.error.includes('Password should be at least 6 characters')) {
          apiFieldErrors.password = 'Mot de passe trop court'
        }
        
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors)
          setLoading(false)
          return
        } else {
          setError(signupData.error)
          setLoading(false)
          return
        }
      }

      console.log('✅ Compte créé avec succès:', signupData.user?.id)

      // Redirection conditionnelle selon le rôle
      if (role === 'PROPRIETAIRE') {
        // Redirection vers la page de succès propriétaire
        console.log('🏠 Redirection vers page de succès propriétaire')
        window.location.href = '/success-proprio'
      } else if (role === 'PRO') {
        // Redirection vers Stripe Checkout
        console.log('💳 Redirection vers Stripe Checkout')
        const stripeResponse = await fetch('/api/checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: signupData.user.id
          })
        })
        
        const stripeData = await stripeResponse.json()
        
        if (stripeData.url) {
          console.log('🔗 Redirection vers Stripe:', stripeData.url)
          window.location.href = stripeData.url
        } else {
          console.error('❌ Erreur Stripe:', stripeData.error)
          setError('Erreur lors de la redirection vers Stripe: ' + (stripeData.error || 'Erreur inconnue'))
        }
      }
      
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'inscription:', err)
      setError('Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFields({ ...fields, [e.target.name]: e.target.value })
  }

  // Forcer la re-validation du formulaire quand les champs changent
  const [formValid, setFormValid] = useState(false)
  
  useEffect(() => {
    setFormValid(isFormValid())
  }, [email, password, confirmPassword, role, fields, villeNom, villeLat, villeLng, photoFile, justifFile])

  // Google Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  function onVilleLoad(autocomplete: any) {
    setVilleAutocomplete(autocomplete)
  }
  function onVillePlaceChanged() {
    if (villeAutocomplete) {
      const place = villeAutocomplete.getPlace()
      setVilleNom(place.formatted_address || '')
      setVilleLat(place.geometry?.location?.lat() || null)
      setVilleLng(place.geometry?.location?.lng() || null)
    }
  }



  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8 overflow-x-hidden">
      <div className="w-full max-w-md sm:max-w-lg">

        {/* Card */}
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] mb-2">
              Inscription
            </h2>
            <p className="text-sm sm:text-base text-[#6b7280]">
              Créez votre compte EkiCare
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
            />
            {fieldErrors.email && <span className="text-[#ef4444] text-sm mt-1">{fieldErrors.email}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
            />
            {fieldErrors.password && (
              <span className="text-[#ef4444] text-sm mt-1">{fieldErrors.password}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
            />
            {fieldErrors.confirmPassword && (
              <span className="text-[#ef4444] text-sm mt-1">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Rôle</label>
            <select
              name="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setFields({})
                setRoleError('')
              }}
              required
              className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] bg-white text-base"
            >
              <option value="" disabled>
                Sélectionner un profil
              </option>
              <option value="PROPRIETAIRE">Propriétaire</option>
              <option value="PRO">Professionnel</option>
            </select>
            {roleError && <span className="text-[#ef4444] text-sm mt-1">{roleError}</span>}
          </div>
          {role === 'PROPRIETAIRE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Prénom</label>
                <input
                  name="prenom"
                  onChange={handleFieldChange}
                  required
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Nom</label>
                <input
                  name="nom"
                  onChange={handleFieldChange}
                  required
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Téléphone</label>
                <input
                  name="telephone"
                  onChange={handleFieldChange}
                  required
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
                {fieldErrors.telephone && (
                  <span className="text-[#ef4444] text-sm mt-1">{fieldErrors.telephone}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Adresse</label>
                <input
                  name="adresse"
                  onChange={handleFieldChange}
                  required
                  placeholder="123 rue de la Paix"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Ville</label>
                <input
                  name="ville"
                  onChange={handleFieldChange}
                  required
                  placeholder="Paris"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Code postal</label>
                <input
                  name="code_postal"
                  onChange={handleFieldChange}
                  required
                  placeholder="75001"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
            </>
          )}
          {role === 'PRO' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Prénom</label>
                <input
                  name="prenom"
                  onChange={handleFieldChange}
                  required
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Nom</label>
                <input
                  name="nom"
                  onChange={handleFieldChange}
                  required
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Téléphone</label>
                <input
                  name="telephone"
                  onChange={handleFieldChange}
                  required
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Profession</label>
                <select
                  name="profession"
                  onChange={handleFieldChange}
                  required
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] bg-white text-base"
                >
                  <option value="">Sélectionner</option>
                  {professions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Ville de référence</label>
                {isLoaded && (
                  <Autocomplete
                    onLoad={onVilleLoad}
                    onPlaceChanged={onVillePlaceChanged}
                    options={{ componentRestrictions: { country: 'fr' } }}
                  >
                    <input
                      name="ville_nom"
                      placeholder="Commencez à taper une ville..."
                      value={villeNom}
                      onChange={(e) => setVilleNom(e.target.value)}
                      required
                      className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                    />
                  </Autocomplete>
                )}
                {!isLoaded && (
                  <input
                    disabled
                    placeholder="Chargement..."
                    className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg bg-[#f9fafb] text-[#9ca3af] text-base"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Rayon d'intervention : {rayonKm} km</label>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={rayonKm}
                  onChange={(e) => setRayonKm(Number(e.target.value))}
                  className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #f86f4d 0%, #f86f4d ${(rayonKm - 5) / (200 - 5) * 100}%, #e5e7eb ${(rayonKm - 5) / (200 - 5) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Numéro SIRET</label>
                <input
                  name="siret"
                  onChange={handleFieldChange}
                  required
                  placeholder="12345678901234"
                  className="w-full px-4 py-3 min-h-[44px] border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] placeholder-[#9ca3af] text-base"
                />
                {fieldErrors.siret && (
                  <span className="text-[#ef4444] text-sm mt-1">{fieldErrors.siret}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Photo de profil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f86f4d] file:text-white hover:file:bg-[#fa8265]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 break-words">Justificatif (PDF ou image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setJustifFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:border-[#F86F4D] transition-all duration-150 text-[#111827] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f86f4d] file:text-white hover:file:bg-[#fa8265]"
                />
              </div>
            </>
          )}
          {error && (
            <div className="text-[#ef4444] text-sm bg-[#fee2e2] border border-[#fecaca] rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading || !formValid}
            className={`w-full py-3 px-4 min-h-[44px] rounded-lg font-medium transition-all duration-150 text-base ${
              loading || !formValid
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-[#f86f4d] text-white hover:bg-[#fa8265]'
            }`}
          >
            {loading ? 'Chargement...' : "S'inscrire"}
          </button>

          <div className="text-center mt-6">
            <p className="text-[#6b7280] text-sm sm:text-base">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-[#f86f4d] hover:text-[#fa8265] hover:underline font-medium transition-colors duration-150"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
