'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'

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

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFields({ ...fields, [e.target.name]: e.target.value })
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    let newFieldErrors: { [key: string]: string } = {}
    // Validation frontend
    if (password.length < 6) {
      newFieldErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (fields.telephone && !/^(0\d{9}|(\+33)[1-9]\d{8})$/.test(fields.telephone)) {
      newFieldErrors.telephone = 'Numéro de téléphone invalide'
    }
    if (fields.siret && !/^\d{14}$/.test(fields.siret)) {
      newFieldErrors.siret = 'Le numéro SIRET doit contenir 14 chiffres'
    }
    if (!role) {
      setRoleError('Veuillez sélectionner un profil')
      setLoading(false)
      return
    } else {
      setRoleError('')
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      setLoading(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('role', role)
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value as string)
      })
      if (role === 'PRO') {
        formData.append('ville_nom', villeNom)
        formData.append('ville_lat', villeLat?.toString() || '')
        formData.append('ville_lng', villeLng?.toString() || '')
        formData.append('rayon_km', rayonKm.toString())
      }
      if (photoFile) formData.append('photo', photoFile)
      if (justifFile) formData.append('justificatif', justifFile)

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        let apiFieldErrors: { [key: string]: string } = {}
        if (data.error.includes('User already registered')) {
          apiFieldErrors.email = 'Cet email est déjà utilisé'
        } else if (data.error.includes('Password should be at least 6 characters')) {
          apiFieldErrors.password = 'Mot de passe trop court'
        }
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors)
          setLoading(false)
          return
        } else {
          setError(data.error)
          setLoading(false)
          return
        }
      }
      // Redirection ou message de succès ici
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <h2>Inscription</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <label className="mb-1 text-left">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2"
            />
            {fieldErrors.email && <span className="text-red-500 text-sm">{fieldErrors.email}</span>}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-left">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2"
            />
            {fieldErrors.password && (
              <span className="text-red-500 text-sm">{fieldErrors.password}</span>
            )}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-left">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md p-2"
            />
            {fieldErrors.confirmPassword && (
              <span className="text-red-500 text-sm">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-left">Rôle</label>
            <select
              name="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setFields({})
                setRoleError('')
              }}
              required
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="" disabled selected>
                Sélectionner un profil
              </option>
              <option value="PROPRIETAIRE">Propriétaire</option>
              <option value="PRO">Professionnel</option>
            </select>
            {roleError && <span className="text-red-500 text-sm mt-1">{roleError}</span>}
          </div>
          {role === 'PROPRIETAIRE' && (
            <>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Prénom</label>
                <input
                  name="prenom"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Nom</label>
                <input
                  name="nom"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Téléphone</label>
                <input
                  name="telephone"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
                {fieldErrors.telephone && (
                  <span className="text-red-500 text-sm">{fieldErrors.telephone}</span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Adresse</label>
                <input
                  name="adresse"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Ville</label>
                <input
                  name="ville"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Code postal</label>
                <input
                  name="code_postal"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
            </>
          )}
          {role === 'PRO' && (
            <>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Prénom</label>
                <input
                  name="prenom"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Nom</label>
                <input
                  name="nom"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Téléphone</label>
                <input
                  name="telephone"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Profession</label>
                <select
                  name="profession"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="">Sélectionner</option>
                  {professions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Ville de référence</label>
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
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </Autocomplete>
                )}
                {!isLoaded && (
                  <input
                    disabled
                    placeholder="Chargement..."
                    className="border border-gray-300 rounded-md p-2"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Rayon d'intervention : {rayonKm} km</label>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={rayonKm}
                  onChange={(e) => setRayonKm(Number(e.target.value))}
                  className="border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Numéro SIRET</label>
                <input
                  name="siret"
                  onChange={handleFieldChange}
                  required
                  className="border border-gray-300 rounded-md p-2"
                />
                {fieldErrors.siret && (
                  <span className="text-red-500 text-sm">{fieldErrors.siret}</span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Photo de profil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-left">Justificatif (PDF ou image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setJustifFile(e.target.files?.[0] || null)}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
            </>
          )}
          {error && <div>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="border border-gray-300 rounded-md p-2"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}
