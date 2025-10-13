'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { MapPin, Building2 } from 'lucide-react';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { getProfessionalWorkingHours, WorkingHours, isDateWorkingDay } from '../utils/workingHours';
import WorkingHoursCalendar from '../components/WorkingHoursCalendar';
import Toast from '../../pro/components/Toast';
import { createUTCDateTime } from '@/lib/dateUtils';

// Types pour Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface Professionnel {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  profession: string;
  localisation: string;
  distance: number;
  experience_years: number;
  average_consultation_duration?: number | null;
  bio: string;
  ville_nom: string;
  ville_lat: number;
  ville_lng: number;
  rayon_km: number;
  price_range: string;
  payment_methods: string[];
  photo_url?: string;
  telephone: string;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface Equide {
  id: string;
  nom: string;
}

export default function RechercheProPage() {
  const [specialite, setSpecialite] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [selectedProfessionnel, setSelectedProfessionnel] = useState<Professionnel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [professionnels, setProfessionnels] = useState<Professionnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [equides, setEquides] = useState<Equide[]>([]);
  
  const [rdvFormData, setRdvFormData] = useState({
    equides: [] as string[],
    motif: '',
    adresse: '',
    adresse_lat: null as number | null, // Coordonnées GPS de l'adresse
    adresse_lng: null as number | null, // Coordonnées GPS de l'adresse
    creneauxAlternatifs: [] as { date: string; heure: string }[]
  });
  const [selectedProfWorkingHours, setSelectedProfWorkingHours] = useState<WorkingHours | null>(null);
  const [availableTimes, setAvailableTimes] = useState<{time: string, isBooked: boolean}[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fonction pour afficher les toasts
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // États pour la géolocalisation
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  // États pour l'autocomplétion d'adresse
  const [addressAutocomplete, setAddressAutocomplete] = useState<any>(null);
  const [addressLocation, setAddressLocation] = useState<LocationData | null>(null);
  const [distanceValidation, setDistanceValidation] = useState<{ isValid: boolean; distance: number; message: string } | null>(null);

  // Charger les équidés du propriétaire
  useEffect(() => {
    const fetchEquides = async () => {
      try {
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          return;
        }

        const { data, error } = await supabase!
          .from('equides')
          .select('id, nom')
          .eq('proprio_id', user.id);

        if (error) {
          console.error('Erreur lors du chargement des équidés:', error);
        } else {
          setEquides(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchEquides();
  }, []);

  // Fonction pour calculer la distance entre deux points (formule haversine)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fonction pour valider si l'adresse du RDV est dans le rayon de chalandise du PRO
  const validateAppointmentDistance = (appointmentLat: number, appointmentLng: number, proLat: number, proLng: number, proRayonKm: number): { isValid: boolean; distance: number; message: string } => {
    const distance = calculateDistance(appointmentLat, appointmentLng, proLat, proLng);
    const isValid = distance <= proRayonKm;
    
    let message = '';
    if (isValid) {
      message = `✅ L'adresse est dans votre zone de chalandise (${distance.toFixed(1)} km / ${proRayonKm} km)`;
    } else {
      message = `❌ L'adresse dépasse votre zone de chalandise (${distance.toFixed(1)} km / ${proRayonKm} km)`;
    }
    
    return { isValid, distance, message };
  };

  // Fonction pour initialiser l'autocomplete Google Maps
  const initializeAutocomplete = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const input = document.getElementById('city-input') as HTMLInputElement;
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['(cities)'],
          componentRestrictions: { country: 'fr' },
          fields: ['place_id', 'name', 'geometry', 'formatted_address', 'address_components']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.place_id && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Utiliser formatted_address pour avoir le libellé complet (ex: "Paris, France")
            const fullAddress = place.formatted_address || place.name || '';
            
            setUserLocation({ lat, lng, address: fullAddress });
            setLocalisation(fullAddress);
          }
        });
      }
    }
  };

  // Fonction pour initialiser l'autocomplete d'adresse
  const initializeAddressAutocomplete = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      console.log('🔍 Initialisation de l\'autocomplétion d\'adresse...');
      
      const input = document.getElementById('address-input') as HTMLInputElement;
      if (input) {
        console.log('✅ Input trouvé, création de l\'autocomplétion...');
        
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['establishment', 'geocode'], // Établissements + adresses géocodées
          componentRestrictions: { country: 'fr' },
          fields: ['place_id', 'name', 'geometry', 'formatted_address', 'address_components', 'types', 'vicinity']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('📍 Lieu sélectionné:', place);
          
          if (place.place_id && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            // Construire une adresse plus précise
            let fullAddress = '';
            
            if (place.formatted_address) {
              fullAddress = place.formatted_address;
            } else if (place.name && place.vicinity) {
              // Pour les établissements : nom + zone
              fullAddress = `${place.name}, ${place.vicinity}`;
            } else if (place.name) {
              fullAddress = place.name;
            }
            
            // Ajouter des détails supplémentaires si disponibles
            if (place.address_components) {
              const streetNumber = place.address_components.find((comp: any) => comp.types.includes('street_number'))?.long_name;
              const route = place.address_components.find((comp: any) => comp.types.includes('route'))?.long_name;
              const city = place.address_components.find((comp: any) => comp.types.includes('locality'))?.long_name;
              const postalCode = place.address_components.find((comp: any) => comp.types.includes('postal_code'))?.long_name;
              
              if (streetNumber && route && !fullAddress.includes(streetNumber)) {
                fullAddress = `${streetNumber} ${route}, ${postalCode} ${city}, France`;
              }
            }
            
            console.log('✅ Adresse sélectionnée:', fullAddress);
            console.log('📍 Coordonnées:', lat, lng);
            console.log('🏢 Types:', place.types);
            console.log('🏢 Nom:', place.name);
            console.log('🏢 Zone:', place.vicinity);
            
            setAddressLocation({ lat, lng, address: fullAddress });
            setRdvFormData(prev => ({
              ...prev,
              adresse: fullAddress,
              adresse_lat: lat, // Stocker les coordonnées GPS exactes
              adresse_lng: lng  // Stocker les coordonnées GPS exactes
            }));

            // Valider la distance si un professionnel est sélectionné
            if (selectedProfessionnel) {
              const validation = validateAppointmentDistance(
                lat, lng,
                selectedProfessionnel.ville_lat,
                selectedProfessionnel.ville_lng,
                selectedProfessionnel.rayon_km
              );
              setDistanceValidation(validation);
              console.log('📍 Validation distance RDV:', validation);
            }
          }
        });
        
        console.log('✅ Autocomplétion d\'adresse initialisée');
      } else {
        console.log('❌ Input address-input non trouvé');
      }
    } else {
      console.log('❌ Google Maps ou Places API non disponible');
    }
  };

  // Initialiser l'autocomplete quand Google Maps est chargé
  useEffect(() => {
    if (isGoogleLoaded) {
      initializeAutocomplete();
    }
  }, [isGoogleLoaded]);

  // Réinitialiser l'autocomplétion d'adresse quand la modal RDV s'ouvre
  useEffect(() => {
    if (isRdvModalOpen && isGoogleLoaded) {
      // Petit délai pour s'assurer que le DOM est rendu
      const timer = setTimeout(() => {
        initializeAddressAutocomplete();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isRdvModalOpen, isGoogleLoaded]);

  // Fonction pour gérer la recherche
  const handleSearch = async () => {
    if (!userLocation && !localisation) {
      showToast('Veuillez sélectionner une ville', 'error');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Récupérer tous les professionnels vérifiés avec leur profession
      const { data, error } = await supabase!
        .from('pro_profiles')
        .select('*')
        .eq('is_verified', true)
        .eq('is_subscribed', true);

      if (error) {
        console.error('Erreur lors de la recherche:', error);
        setProfessionnels([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('Aucun professionnel trouvé');
        setProfessionnels([]);
        return;
      }

      // Filtrer par spécialité si sélectionnée
      let filtered = data;
      if (specialite) {
        filtered = data.filter(pro => 
          pro.profession && pro.profession.toLowerCase().includes(specialite.toLowerCase())
        );
      }

      // Filtrer par distance si localisation fournie
      if (userLocation) {
        filtered = filtered.filter(pro => {
          if (!pro.ville_lat || !pro.ville_lng || !pro.rayon_km) {
            return false;
          }

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            pro.ville_lat,
            pro.ville_lng
          );

          console.log(`Pro ${pro.prenom} ${pro.nom}: distance=${distance.toFixed(1)}km, rayon=${pro.rayon_km}km`);
          
          return distance <= pro.rayon_km;
        });

        // Ajouter la distance calculée à chaque professionnel
        filtered = filtered.map(pro => ({
          ...pro,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            pro.ville_lat,
            pro.ville_lng
          )
        }));

        // Trier par distance croissante
        filtered.sort((a, b) => a.distance - b.distance);
      }

      setProfessionnels(filtered as any);
      console.log(`${filtered.length} professionnel(s) trouvé(s)`);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setProfessionnels([]);
    } finally {
      setLoading(false);
    }
  };

  const specialites = [
    { value: '', label: 'Toutes les spécialités' },
    { value: 'vétérinaire', label: 'Vétérinaire équin' },
    { value: 'dentiste', label: 'Dentiste équin' },
    { value: 'ostéopathe', label: 'Ostéopathe équin' },
    { value: 'maréchal-ferrant', label: 'Maréchal-ferrant' },
    { value: 'kinésithérapeute', label: 'Kinésithérapeute équin' },
    { value: 'comportementaliste', label: 'Comportementaliste équin' },
    { value: 'shiatsu', label: 'Shiatsu équin' },
    { value: 'naturopathe', label: 'Naturopathe équin' },
    { value: 'masseur', label: 'Masseur équin' }
  ];

  const handleViewProfile = (professionnel: Professionnel) => {
    setSelectedProfessionnel(professionnel);
    setIsProfileModalOpen(true);
  };

  const handleTakeRdv = async (professionnel: Professionnel) => {
    setSelectedProfessionnel(professionnel);
    setIsRdvModalOpen(true);
    
    // Charger les horaires de travail du professionnel
    console.log('🔍 Chargement des horaires pour user_id:', professionnel.user_id);
    const workingHours = await getProfessionalWorkingHours(professionnel.user_id);
    console.log('📅 Horaires récupérés:', workingHours);
    
    // Debug: Vérifier le statut de chaque jour
    if (workingHours) {
      console.log('📋 Détail des horaires par jour:');
      const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      days.forEach((day, index) => {
        const dayHours = workingHours[day];
        console.log(`  ${day} (${index}):`, dayHours?.active ? `✅ ${dayHours.start}-${dayHours.end}` : '❌ fermé');
      });
    } else {
      console.warn('⚠️ Aucun horaire défini pour ce professionnel');
    }
    
    setSelectedProfWorkingHours(workingHours);
    
    // Réinitialiser les créneaux disponibles
    setAvailableTimes([]);
    setSelectedTime('');
    
    // Initialiser l'autocomplétion d'adresse après l'ouverture de la modal
    setTimeout(() => {
      if (isGoogleLoaded) {
        initializeAddressAutocomplete();
      }
    }, 100);
  };

  const handleRdvFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRdvFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquideChange = (equideId: string, checked: boolean) => {
    setRdvFormData(prev => ({
      ...prev,
      equides: checked 
        ? [...prev.equides, equideId]
        : prev.equides.filter(id => id !== equideId)
    }));
  };

  const addCreneauAlternatif = () => {
    setRdvFormData(prev => ({
      ...prev,
      creneauxAlternatifs: [...prev.creneauxAlternatifs, { date: '', heure: '' }]
    }));
  };

  const removeCreneauAlternatif = (index: number) => {
    setRdvFormData(prev => ({
      ...prev,
      creneauxAlternatifs: prev.creneauxAlternatifs.filter((_, i) => i !== index)
    }));
  };

  const updateCreneauAlternatif = async (index: number, field: 'date' | 'heure', value: string) => {
    setRdvFormData(prev => ({
      ...prev,
      creneauxAlternatifs: prev.creneauxAlternatifs.map((creneau, i) => 
        i === index ? { ...creneau, [field]: value } : creneau
      )
    }));
    
    // Si on change la date, charger les créneaux disponibles
    if (field === 'date' && value) {
      // Note: Pour les créneaux alternatifs, on ne charge pas automatiquement
      // car cela nécessiterait un état séparé pour chaque créneau
    }
  };

  const handleRdvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!selectedProfessionnel || !selectedDate || !selectedTime || rdvFormData.equides.length === 0) {
      showToast('Veuillez remplir tous les champs obligatoires et sélectionner au moins un cheval', 'error');
      return;
    }

    // Validation de la règle J+1 (pas de réservation pour le jour même)
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDateObj.getTime() === today.getTime()) {
      showToast('Les rendez-vous doivent être pris au moins 1 jour à l\'avance. Veuillez sélectionner une date à partir de demain.', 'error');
      return;
    }

    // Validation de l'adresse (obligatoire)
    if (!rdvFormData.adresse || rdvFormData.adresse.trim() === '') {
      showToast('L\'adresse du rendez-vous est obligatoire. Veuillez indiquer où se déroulera la consultation.', 'error');
      return;
    }

    // Validation du motif (obligatoire)
    if (!rdvFormData.motif || rdvFormData.motif.trim() === '') {
      showToast('Le motif de consultation est obligatoire. Veuillez décrire la raison de votre rendez-vous.', 'error');
      return;
    }

    // Validation de la distance si l'adresse a des coordonnées GPS
    if (rdvFormData.adresse_lat && rdvFormData.adresse_lng && selectedProfessionnel) {
      const validation = validateAppointmentDistance(
        rdvFormData.adresse_lat,
        rdvFormData.adresse_lng,
        selectedProfessionnel.ville_lat,
        selectedProfessionnel.ville_lng,
        selectedProfessionnel.rayon_km
      );
      
      if (!validation.isValid) {
        showToast(`L'adresse du rendez-vous dépasse la zone de chalandise du professionnel (${validation.distance.toFixed(1)} km / ${selectedProfessionnel.rayon_km} km). Veuillez choisir une adresse plus proche ou un autre professionnel.`, 'error');
        return;
      }
    }

    // La vérification des créneaux disponibles se fait maintenant côté serveur dans l'API
    // Plus besoin de vérification côté client car l'API empêche les doubles réservations

    try {
      // DEBUG: Vérifier l'état de l'authentification
      console.log('🔍 DEBUG: Vérification de l\'authentification...');
      
      const { data: { user }, error: authError } = await supabase!.auth.getUser();
      
      if (authError) {
        console.error('❌ DEBUG: Erreur auth:', authError);
        showToast('Erreur d\'authentification. Veuillez vous reconnecter.', 'error');
        return;
      }
      
      if (!user) {
        console.error('❌ DEBUG: Aucun utilisateur connecté');
        showToast('Vous n\'êtes pas connecté. Veuillez vous reconnecter.', 'error');
        return;
      }
      
      console.log('✅ DEBUG: Utilisateur connecté:', user.id, user.email);
      
      // DEBUG: Vérifier la session
      const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
      
      if (sessionError) {
        console.error('❌ DEBUG: Erreur session:', sessionError);
      } else if (!session) {
        console.error('❌ DEBUG: Aucune session active');
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        return;
      } else {
        console.log('✅ DEBUG: Session active trouvée');
        console.log('📋 DEBUG: Access token:', session.access_token?.substring(0, 20) + '...');
      }
      // Créer la date/heure principale (en UTC pour éviter les décalages)
      const mainSlot = createUTCDateTime(selectedDate, selectedTime);
      
      // Créer les créneaux alternatifs (en UTC pour éviter les décalages)
      const alternativeSlots = rdvFormData.creneauxAlternatifs
        .filter(creneau => creneau.date && creneau.heure)
        .map(creneau => createUTCDateTime(creneau.date, creneau.heure));

      // Préparer les données pour l'API
      const appointmentData = {
        pro_id: selectedProfessionnel.user_id,
        equide_ids: rdvFormData.equides,
        main_slot: mainSlot,
        alternative_slots: alternativeSlots,
        comment: rdvFormData.motif.trim(),
        address: rdvFormData.adresse.trim(),
        address_lat: rdvFormData.adresse_lat, // Coordonnées GPS exactes de l'établissement
        address_lng: rdvFormData.adresse_lng, // Coordonnées GPS exactes de l'établissement
        duration_minutes: selectedProfessionnel.average_consultation_duration || 60
      };

      // Appeler l'API normale pour créer le rendez-vous
      console.log('📡 Création de rendez-vous via API normale');
      console.log('📋 Données à envoyer:', appointmentData);
      
      // Récupérer le token depuis Supabase
      const { data: { session: authSession } } = await supabase!.auth.getSession();
      const token = authSession?.access_token;
      
      if (!token) {
        console.error('❌ TEST: Pas de token d\'accès');
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        return;
      }
      
      console.log('✅ TEST: Token récupéré, longueur:', token.length);
      
      console.log('🚀 Envoi de la requête vers /api/appointments');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
      });

      console.log('📡 TEST: Réponse reçue, status:', response.status);
      
      const result = await response.json();
      console.log('📋 TEST: Résultat de l\'API:', result);

      if (!response.ok) {
        console.error('❌ TEST: Erreur API:', result.error);
        showToast(result.error || 'Erreur lors de la création du rendez-vous', 'error');
        return;
      }

      console.log('Rendez-vous créé avec succès:', result.data);
      showToast('Demande de rendez-vous envoyée avec succès', 'success');
      
      // Réinitialiser le formulaire
      setRdvFormData({
        equides: [],
        motif: '',
        adresse: '',
        adresse_lat: null, // Réinitialiser les coordonnées GPS
        adresse_lng: null, // Réinitialiser les coordonnées GPS
        creneauxAlternatifs: []
      });
      setDistanceValidation(null); // Réinitialiser la validation de distance
      setSelectedDate('');
      setSelectedTime('');
      setIsRdvModalOpen(false);

    } catch (error) {
      console.error('Erreur:', error);
      showToast('Une erreur est survenue lors de l\'envoi de votre demande', 'error');
    }
  };

  // Vérifier si une date est un jour de travail
  const isWorkingDate = (dateString: string): boolean => {
    if (!selectedProfWorkingHours) {
      return false; // Si pas d'horaires définis, on considère que tous les jours sont NON travaillés (sécurité)
    }
    
    // Créer la date locale (pas UTC) pour correspondre au calendrier
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    
    return isDateWorkingDay(selectedProfWorkingHours, date);
  };

  // Charger les créneaux disponibles pour une date donnée
  const loadAvailableTimes = async (date: string) => {
    setLoadingTimes(true);
    
    try {
      if (!selectedProfessionnel || !selectedProfWorkingHours) {
        setAvailableTimes([]);
        return;
      }

      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      dateObj.setHours(0, 0, 0, 0);
      
      // Vérifier si la date est aujourd'hui (règle J+1 minimum)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateObj.getTime() === today.getTime()) {
        console.log('❌ Réservation impossible pour le jour même (règle J+1)');
        setAvailableTimes([]);
        return;
      }
      
      const consultationDuration = selectedProfessionnel?.average_consultation_duration || 30;
      
      // Récupérer les horaires du jour en utilisant getDay() (0=dimanche, 1=lundi, etc.)
      const dayOfWeek = dateObj.getDay();
      const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = days[dayOfWeek];
      const dayHours = selectedProfWorkingHours?.[dayName];
      
      console.log('🔍 Jour:', dayName, '(index:', dayOfWeek, '), Horaires:', dayHours);
      
      // Si pas d'horaires ou jour non actif, pas de créneaux
      if (!dayHours || !dayHours.active) {
        console.log('❌ Pas d\'horaires pour ce jour');
        setAvailableTimes([]);
        return;
      }
      
      // Générer tous les créneaux
      const allSlots: string[] = [];
      const [startHour, startMinute] = dayHours.start.split(':').map(Number);
      const [endHour, endMinute] = dayHours.end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      let currentMinutes = startMinutes;
      while (currentMinutes + consultationDuration <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        allSlots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        currentMinutes += consultationDuration;
      }
      
      console.log('📅 Créneaux générés:', allSlots.length, allSlots);
      
      // Récupérer les créneaux réservés via l'API admin
      const dateString = dateObj.toISOString().split('T')[0];
      let bookedSlots: string[] = [];
      
      try {
        const response = await fetch(`/api/professional-booked-slots?pro_id=${selectedProfessionnel.id}&date=${dateString}`);
        
        if (response.ok) {
          const data = await response.json();
          bookedSlots = data.bookedSlots || [];
          console.log('📋 Créneaux réservés récupérés:', bookedSlots);
          console.log('📊 Total rendez-vous pro:', data.totalAppointments);
          console.log('📅 Rendez-vous pour cette date:', data.appointmentsForDate);
        } else {
          console.error('❌ Erreur API professional-booked-slots:', response.status);
        }
      } catch (error) {
        console.error('❌ Erreur récupération créneaux réservés:', error);
      }
      
      // Créer la liste avec statut
      const slotsWithStatus = allSlots.map(slot => ({
        time: slot,
        isBooked: bookedSlots.includes(slot)
      }));
      
      setAvailableTimes(slotsWithStatus);
    } catch (error) {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  return (
    <div className="space-y-3 overflow-x-hidden">
      {/* Script Google Maps */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setIsGoogleLoaded(true)}
        onError={() => console.error('Erreur de chargement Google Maps')}
      />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Trouver un pro
        </h1>
        <p className="text-[#6b7280] text-lg">
          Trouvez le professionnel idéal pour vos équidés
        </p>
      </div>

      {/* Search Filters */}
      <Card variant="elevated">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 space-y-2 md:space-y-0">
          <div className="space-y-1 md:space-y-2">
            <label className="block text-sm font-medium text-[#111827]">
              Localisation
            </label>
            <div className="relative">
              <input
                id="city-input"
                type="text"
                placeholder="Rechercher une ville..."
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                className="w-full h-12 px-3 py-2.5 pl-10 border border-[#e5e7eb] rounded-lg text-sm placeholder-[#9ca3af] focus:outline-none focus:border-[#ff6b35] transition-all duration-150 bg-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 md:space-y-2">
            <label className="block text-sm font-medium text-[#111827]">
              Spécialité
            </label>
            <select
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              className="w-full h-12 px-3 py-2.5 text-base border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] sm:text-sm transition-all duration-150 bg-white"
            >
              {specialites.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1 md:space-y-2">
            <label className="block text-sm font-medium text-gray-900 opacity-0">
              Rechercher
            </label>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full h-12 text-base font-medium mt-0 md:mt-0"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        {!hasSearched ? (
          // Empty state par défaut
          <Card variant="elevated" className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] mb-2">Recherchez un professionnel</h3>
            <p className="text-gray-600">Entrez une ville pour trouver des professionnels près de chez vous.</p>
          </Card>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                {professionnels.length} professionnel{professionnels.length > 1 ? 's' : ''} trouvé{professionnels.length > 1 ? 's' : ''}
              </h2>
            </div>

            {professionnels.length === 0 ? (
              // Empty state pour aucun résultat
              <Card variant="elevated" className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucun professionnel trouvé dans cette zone</h3>
                <p className="text-gray-600">Essayez de modifier vos critères de recherche ou d'élargir la zone géographique.</p>
              </Card>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {professionnels.map((pro) => (
              <Card key={pro.id} variant="elevated">
                {/* Mobile Layout */}
                <div className="block md:hidden">
                  <div className="flex items-start space-x-3 mb-2">
                    <Avatar
                      src={pro.photo_url}
                      alt={`Photo de ${pro.prenom} ${pro.nom}`}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#111827] break-words">{pro.prenom} {pro.nom}</h3>
                      <p className="text-sm text-gray-600 break-words">{pro.profession}</p>
                      <p className="text-sm text-gray-500 break-words">{pro.ville_nom}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{pro.distance?.toFixed(1) || '—'} km</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{pro.experience_years || 0} ans d'expérience</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-1">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full bg-[#ffe5de] text-[#f86f4d] border-[#ffe5de] hover:bg-[#f86f4d] hover:text-white hover:border-[#f86f4d] transition-all duration-200"
                      onClick={() => handleTakeRdv(pro)}
                    >
                      Demander un rendez-vous
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleViewProfile(pro)}
                    >
                      Voir profil
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar
                        src={pro.photo_url}
                        alt={`Photo de ${pro.prenom} ${pro.nom}`}
                        size="md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-[#111827] truncate">{pro.prenom} {pro.nom}</h3>
                          <p className="text-sm text-gray-600 truncate">{pro.profession}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{pro.ville_nom} • {pro.distance?.toFixed(1) || '—'} km</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{pro.experience_years || 0} ans d'expérience</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full bg-[#ffe5de] text-[#f86f4d] border-[#ffe5de] hover:bg-[#f86f4d] hover:text-white hover:border-[#f86f4d] transition-all duration-200"
                        onClick={() => handleTakeRdv(pro)}
                      >
                        Prendre RDV
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewProfile(pro)}
                      >
                        Voir profil
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Profil du professionnel"
        size="lg"
      >
        {selectedProfessionnel && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-6">
              <h3 className="text-2xl font-semibold text-[#111827] mb-2">{selectedProfessionnel.prenom} {selectedProfessionnel.nom}</h3>
              <p className="text-lg text-gray-600 mb-2">{selectedProfessionnel.profession}</p>
              <p className="text-sm text-gray-500">
                {selectedProfessionnel.ville_nom} • {selectedProfessionnel.distance?.toFixed(1) || '—'} km
              </p>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Zone de chalandise</h4>
                <p className="text-sm text-[#111827]">{selectedProfessionnel.ville_nom} (rayon {selectedProfessionnel.rayon_km} km)</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Années d'expérience</h4>
                <p className="text-sm text-gray-900">{selectedProfessionnel.experience_years || 0} ans</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Tarifs</h4>
                <div className="flex items-center gap-1 text-lg">
                  {['€', '€€', '€€€', '€€€€'].map((category) => (
                    <span
                      key={category}
                      className={`font-medium ${
                        selectedProfessionnel.price_range === category
                          ? 'text-[#111827]'
                          : 'text-gray-300'
                      }`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProfessionnel.payment_methods && selectedProfessionnel.payment_methods.length > 0 && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Moyens de paiement acceptés</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfessionnel.payment_methods.map((moyen, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {moyen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfessionnel.bio && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Bio</h4>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedProfessionnel.bio}</p>
                </div>
              )}

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact</h4>
                <p className="text-sm text-gray-900">{selectedProfessionnel.telephone || 'Non renseigné'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setIsProfileModalOpen(false)}
              >
                Fermer
              </Button>
              <Button
                variant="secondary"
                className="bg-[#ffe5de] text-[#f86f4d] border-[#ffe5de] hover:bg-[#f86f4d] hover:text-white hover:border-[#f86f4d] transition-all duration-200"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  handleTakeRdv(selectedProfessionnel);
                }}
              >
                Prendre RDV
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RDV Modal - Design validé */}
      <Modal
        isOpen={isRdvModalOpen}
        onClose={() => setIsRdvModalOpen(false)}
        title="Demande de rendez-vous"
        size="lg"
      >
        {selectedProfessionnel && (
          <form onSubmit={handleRdvSubmit} className="space-y-6">
            
            {/* En-tête avec infos du pro */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-base font-medium text-[#111827]">
                {selectedProfessionnel.prenom} {selectedProfessionnel.nom} — {selectedProfessionnel.profession}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProfessionnel.ville_nom}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProfessionnel.average_consultation_duration !== null && selectedProfessionnel.average_consultation_duration !== undefined
                  ? `Durée moyenne : ${selectedProfessionnel.average_consultation_duration} minutes`
                  : 'Durée moyenne non renseignée'}
              </p>
            </div>

            {/* Créneau principal (obligatoire) */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-[#111827]">Créneau principal</h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Date</label>
                  <WorkingHoursCalendar
                    value={selectedDate}
                    onChange={async (date) => {
                      console.log('🗓️ CALENDRIER: Date sélectionnée:', date);
                      setSelectedDate(date);
                      setSelectedTime('');
                      console.log('🚀 CALENDRIER: Appel loadAvailableTimes...');
                      await loadAvailableTimes(date);
                      console.log('✅ CALENDRIER: loadAvailableTimes terminé');
                    }}
                    workingHours={selectedProfWorkingHours}
                    minDate={(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1); // J+1 minimum
                      return d.toISOString().split('T')[0];
                    })()}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Heure</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={!selectedDate || loadingTimes}
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150 disabled:bg-gray-50 disabled:text-gray-400"
                    required
                  >
                    <option value="">
                      {loadingTimes ? 'Chargement...' : 'Sélectionner une heure'}
                    </option>
                    {availableTimes.map(slot => (
                      <option 
                        key={slot.time} 
                        value={slot.time}
                        disabled={slot.isBooked}
                        style={{ 
                          color: slot.isBooked ? '#9CA3AF' : '#000000',
                          backgroundColor: slot.isBooked ? '#F3F4F6' : '#FFFFFF'
                        }}
                      >
                        {slot.time} {slot.isBooked ? '(Réservé)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedDate && !loadingTimes && availableTimes.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Aucun créneau disponible pour cette date
                    </p>
                  )}
                  {selectedDate && !loadingTimes && availableTimes.length > 0 && availableTimes.every(slot => slot.isBooked) && (
                    <p className="text-xs text-orange-500 mt-1">
                      Tous les créneaux sont réservés pour cette date
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sélection des chevaux */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-[#111827]">Sélection du ou des chevaux</h4>
              
              {equides.length === 0 ? (
                // Empty state si aucun cheval
                <div className="border border-[#e5e7eb] rounded-lg p-6 text-center bg-gray-50">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Vous n'avez pas encore ajouté de cheval
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/dashboard/proprietaire/equides';
                    }}
                  >
                    Ajouter un équidé
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 border border-[#e5e7eb] rounded-lg p-4">
                  {equides.map(equide => (
                    <label key={equide.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={rdvFormData.equides.includes(equide.id)}
                        onChange={(e) => handleEquideChange(equide.id, e.target.checked)}
                        className="w-4 h-4 text-[#f86f4d] border-[#e5e7eb] rounded focus:ring-[#ff6b35] focus:ring-2"
                      />
                      <span className="text-sm text-[#111827] font-medium">{equide.nom}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Motif de consultation */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-[#111827]">
                Motif de consultation <span className="text-[#ef4444]">*</span>
              </h4>
              
              <textarea
                name="motif"
                value={rdvFormData.motif}
                onChange={handleRdvFormChange}
                placeholder="Décrivez le motif de votre rendez-vous (ex : Mon cheval est sensible aux postérieurs...)"
                rows={3}
                required
                className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150 placeholder-[#9ca3af]"
              />
            </div>

            {/* Adresse du rendez-vous */}
            <div className="space-y-4">
              <h4 className="text-base font-medium text-[#111827]">
                Adresse du rendez-vous <span className="text-[#ef4444]">*</span>
              </h4>
              
              <div className="relative">
                <input
                  id="address-input"
                  type="text"
                  value={rdvFormData.adresse}
                  onChange={(e) => setRdvFormData(prev => ({ ...prev, adresse: e.target.value }))}
                  placeholder="Saisissez une adresse exacte (ex: 123 Rue de la Paix, Paris ou Centre équestre Les Écuries...)"
                  required
                  className="w-full px-3 py-2.5 pl-10 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150 placeholder-[#9ca3af]"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Validation de la distance - Afficher seulement si hors zone */}
              {distanceValidation && !distanceValidation.isValid && (
                <p className="text-sm text-red-600 mt-1">
                  L'adresse dépasse la zone de chalandise du professionnel
                </p>
              )}
            </div>

            {/* Créneaux alternatifs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium text-[#111827]">Créneaux alternatifs (facultatif)</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addCreneauAlternatif}
                >
                  Ajouter un créneau
                </Button>
              </div>
              
              {rdvFormData.creneauxAlternatifs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Proposez des créneaux supplémentaires au professionnel pour faciliter la prise de rendez-vous
                </p>
              ) : (
                <div className="space-y-3">
                  {rdvFormData.creneauxAlternatifs.map((creneau, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-[#e5e7eb] rounded-lg bg-gray-50">
                      <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">Date</label>
                        <input
                          type="date"
                          value={creneau.date}
                          onChange={(e) => updateCreneauAlternatif(index, 'date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all duration-150 bg-white ${
                            creneau.date && !isWorkingDate(creneau.date) 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-[#e5e7eb] focus:border-[#ff6b35]'
                          }`}
                        />
                        {creneau.date && !isWorkingDate(creneau.date) && (
                          <p className="text-xs text-red-500 mt-1">
                            Ce professionnel ne travaille pas ce jour-là
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#111827] mb-2">Heure</label>
                        <select
                          value={creneau.heure}
                          onChange={(e) => updateCreneauAlternatif(index, 'heure', e.target.value)}
                          className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#ff6b35] transition-all duration-150 bg-white"
                        >
                          <option value="">Sélectionner</option>
                          {/* Pour les créneaux alternatifs, on utilise les créneaux de base sans vérification des réservations */}
                          {creneau.date && selectedProfWorkingHours && (() => {
                            const dateObj = new Date(creneau.date);
                            const dayOfWeek = dateObj.getDay();
                            const dayHours = selectedProfWorkingHours[['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dayOfWeek]];
                            
                            if (!dayHours || !dayHours.active) return [];
                            
                            const slots = [];
                            const [startHour, startMinute] = dayHours.start.split(':').map(Number);
                            const [endHour, endMinute] = dayHours.end.split(':').map(Number);
                            const consultationDuration = selectedProfessionnel?.average_consultation_duration || 30;
                            
                            const startMinutes = startHour * 60 + startMinute;
                            const endMinutes = endHour * 60 + endMinute;
                            
                            let currentMinutes = startMinutes;
                            while (currentMinutes + consultationDuration <= endMinutes) {
                              const hours = Math.floor(currentMinutes / 60);
                              const minutes = currentMinutes % 60;
                              const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                              slots.push(timeString);
                              currentMinutes += consultationDuration;
                            }
                            
                            return slots;
                          })().map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeCreneauAlternatif(index)}
                          className="w-full"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRdvModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Envoyer la demande
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
