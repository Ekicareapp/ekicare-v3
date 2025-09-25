'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { Search, MapPin, Building2 } from 'lucide-react';
import Script from 'next/script';

// Types pour Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface Professionnel {
  id: string;
  nom: string;
  specialite: string;
  localisation: string;
  distance: number;
  experience: number;
  description: string;
  zoneChalandise: string;
  tarifs: string;
  moyensPaiement: string[];
  bio: string;
  photo?: string;
  // Coordonnées GPS du professionnel
  lat: number;
  lng: number;
  rayon_km: number;
}

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  name: string;
}

export default function RechercheProPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [selectedProfessionnel, setSelectedProfessionnel] = useState<Professionnel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [rdvFormData, setRdvFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    equides: [] as string[],
    motif: '',
    creneauxAlternatifs: [] as { date: string; heure: string }[]
  });

  // États pour la géolocalisation
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

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

  // Fonction pour initialiser l'autocomplete Google Maps
  const initializeAutocomplete = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const input = document.getElementById('city-input') as HTMLInputElement;
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['(cities)'],
          componentRestrictions: { country: 'fr' },
          fields: ['place_id', 'name', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place.place_id && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const cityName = place.name || '';
            
            setUserLocation({ lat, lng, address: cityName });
            setLocalisation(cityName);
          }
        });
      }
    }
  };

  // Initialiser l'autocomplete quand Google Maps est chargé
  useEffect(() => {
    if (isGoogleLoaded) {
      initializeAutocomplete();
    }
  }, [isGoogleLoaded]);

  // Fonction pour gérer la recherche
  const handleSearch = () => {
    setHasSearched(true);
    console.log('Recherche effectuée:', { localisation, specialite, searchTerm });
  };

  // Fonction pour réinitialiser l'état de recherche
  const resetSearchState = () => {
    setHasSearched(false);
  };

  // Réinitialiser l'état de recherche quand les critères changent
  useEffect(() => {
    if (hasSearched) {
      resetSearchState();
    }
  }, [localisation, specialite, searchTerm]);

  const specialites = [
    { value: '', label: 'Toutes les spécialités' },
    { value: 'veterinaire', label: 'Vétérinaire généraliste' },
    { value: 'dentiste', label: 'Dentiste équin' },
    { value: 'osteopathe', label: 'Ostéopathe équin' },
    { value: 'maréchal-ferrant', label: 'Maréchal-ferrant' },
    { value: 'physiotherapeute', label: 'Physiothérapeute équin' },
    { value: 'comportementaliste', label: 'Comportementaliste équin' }
  ];

  const professionnels: Professionnel[] = [
    {
      id: '1',
      nom: 'Dr. Martin',
      specialite: 'Vétérinaire généraliste',
      localisation: 'Paris 15ème',
      distance: 2.3,
      experience: 15,
      description: 'Vétérinaire spécialisé dans les soins des équidés avec plus de 15 ans d\'expérience.',
      zoneChalandise: 'Paris et région parisienne (rayon 30km)',
      tarifs: 'Consultation: 80€ - Urgences: 120€ - Déplacement: 25€',
      moyensPaiement: ['Espèces', 'Chèque', 'Virement', 'Carte bancaire'],
      bio: 'Docteur vétérinaire diplômé de l\'École Nationale Vétérinaire d\'Alfort, spécialisé dans les soins des équidés. Plus de 15 ans d\'expérience dans le diagnostic et le traitement des pathologies équines. Membre de l\'Ordre des Vétérinaires et certifié en médecine équine.',
      photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
      lat: 48.8566,
      lng: 2.3522,
      rayon_km: 30
    },
    {
      id: '2',
      nom: 'Dr. Dubois',
      specialite: 'Dentiste équin',
      localisation: 'Boulogne-Billancourt',
      distance: 4.1,
      experience: 12,
      description: 'Spécialiste en dentisterie équine, formé aux techniques les plus récentes.',
      zoneChalandise: 'Hauts-de-Seine et Paris (rayon 25km)',
      tarifs: 'Contrôle dentaire: 150€ - Soins dentaires: 200-400€',
      moyensPaiement: ['Espèces', 'Chèque', 'Virement'],
      bio: 'Spécialiste en dentisterie équine certifié, formé aux techniques les plus récentes de soins dentaires. Plus de 12 ans d\'expérience dans le domaine de la dentisterie équine avec une expertise particulière dans les cas complexes.',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      lat: 48.8355,
      lng: 2.2413,
      rayon_km: 25
    },
    {
      id: '3',
      nom: 'Dr. Lefebvre',
      specialite: 'Ostéopathe équin',
      localisation: 'Issy-les-Moulineaux',
      distance: 3.7,
      experience: 8,
      description: 'Ostéopathe certifié, spécialisé dans les troubles musculo-squelettiques des chevaux.',
      zoneChalandise: 'Région parisienne (rayon 40km)',
      tarifs: 'Séance ostéopathie: 120€ - Bilan complet: 150€',
      moyensPaiement: ['Espèces', 'Chèque', 'Virement'],
      bio: 'Ostéopathe certifié spécialisé dans les troubles musculo-squelettiques des chevaux. Formation approfondie en anatomie équine et techniques d\'ostéopathie adaptées aux équidés. Approche holistique du bien-être animal.',
      lat: 48.8219,
      lng: 2.2701,
      rayon_km: 40
    },
    {
      id: '4',
      nom: 'M. Durand',
      specialite: 'Maréchal-ferrant',
      localisation: 'Vanves',
      distance: 5.2,
      experience: 20,
      description: 'Maréchal-ferrant expérimenté, spécialisé dans la ferrure orthopédique.',
      zoneChalandise: 'Paris et banlieue (rayon 50km)',
      tarifs: 'Ferrure simple: 80€ - Ferrure orthopédique: 120-200€',
      moyensPaiement: ['Espèces', 'Chèque'],
      bio: 'Maréchal-ferrant expérimenté avec plus de 20 ans d\'expérience. Spécialisé dans la ferrure orthopédique et les cas complexes. Formation continue en podologie équine et techniques de ferrure modernes.',
      lat: 48.8202,
      lng: 2.2900,
      rayon_km: 50
    },
    {
      id: '5',
      nom: 'Dr. Moreau',
      specialite: 'Physiothérapeute équin',
      localisation: 'Clamart',
      distance: 6.1,
      experience: 10,
      description: 'Physiothérapeute spécialisé dans la rééducation des chevaux de sport.',
      zoneChalandise: 'Région parisienne (rayon 35km)',
      tarifs: 'Séance physiothérapie: 100€ - Programme rééducation: 80€/séance',
      moyensPaiement: ['Espèces', 'Chèque', 'Virement'],
      bio: 'Physiothérapeute spécialisé dans la rééducation des chevaux de sport. Plus de 10 ans d\'expérience dans la rééducation fonctionnelle équine. Techniques de rééducation modernes et approche personnalisée selon les besoins de chaque cheval.',
      lat: 48.8024,
      lng: 2.2669,
      rayon_km: 35
    }
  ];

  const filteredProfessionnels = professionnels.filter(pro => {
    const matchesSearch = pro.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pro.localisation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialite = !specialite || pro.specialite.toLowerCase().includes(specialite.toLowerCase());
    
    // Vérification du rayon de chalandise si une localisation est sélectionnée
    let matchesLocation = true;
    if (userLocation && localisation) {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        pro.lat, 
        pro.lng
      );
      matchesLocation = distance <= pro.rayon_km;
      console.log(`Pro ${pro.nom}: distance=${distance.toFixed(1)}km, rayon=${pro.rayon_km}km, match=${matchesLocation}`);
    } else if (localisation && !userLocation) {
      // Fallback sur le filtrage par texte si pas de coordonnées GPS
      matchesLocation = pro.localisation.toLowerCase().includes(localisation.toLowerCase());
      console.log(`Pro ${pro.nom}: filtrage par texte, match=${matchesLocation}`);
    }
    
    return matchesSearch && matchesSpecialite && matchesLocation;
  });

  const handleViewProfile = (professionnel: Professionnel) => {
    setSelectedProfessionnel(professionnel);
    setIsProfileModalOpen(true);
  };

  const handleTakeRdv = (professionnel: Professionnel) => {
    setSelectedProfessionnel(professionnel);
    setIsRdvModalOpen(true);
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

  const updateCreneauAlternatif = (index: number, field: 'date' | 'heure', value: string) => {
    setRdvFormData(prev => ({
      ...prev,
      creneauxAlternatifs: prev.creneauxAlternatifs.map((creneau, i) => 
        i === index ? { ...creneau, [field]: value } : creneau
      )
    }));
  };

  const handleRdvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demande de RDV:', {
      professionnel: selectedProfessionnel,
      date: selectedDate,
      heure: selectedTime,
      ...rdvFormData
    });
    setIsRdvModalOpen(false);
  };

  // Mock des créneaux disponibles
  const getAvailableTimes = (date: string) => {
    if (!date) return [];
    return ['09:00', '11:00', '14:00', '16:00'];
  };

  // Mock des équidés du propriétaire
  const equides = [
    { id: '1', nom: 'Bella' },
    { id: '2', nom: 'Thunder' },
    { id: '3', nom: 'Luna' }
  ];


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
                className="w-full h-12 px-3 py-2.5 pl-10 border border-[#e5e7eb] rounded-lg text-sm placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150 bg-white"
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
              className="w-full h-12 px-3 py-2.5 text-base border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] sm:text-sm transition-all duration-150 bg-white"
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
            >
              Rechercher
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
                {filteredProfessionnels.length} professionnel{filteredProfessionnels.length > 1 ? 's' : ''} trouvé{filteredProfessionnels.length > 1 ? 's' : ''}
              </h2>
            </div>

            {filteredProfessionnels.length === 0 ? (
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
            {filteredProfessionnels.map((pro) => (
              <Card key={pro.id} variant="elevated">
                {/* Mobile Layout */}
                <div className="block md:hidden">
                  <div className="flex items-start space-x-3 mb-2">
                    <Avatar
                      src={pro.photo}
                      alt={`Photo de ${pro.nom}`}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#111827] break-words">{pro.nom}</h3>
                      <p className="text-sm text-gray-600 break-words">{pro.specialite}</p>
                      <p className="text-sm text-gray-500 break-words">{pro.localisation}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        {userLocation 
                          ? `${calculateDistance(userLocation.lat, userLocation.lng, pro.lat, pro.lng).toFixed(1)} km`
                          : `${pro.distance} km`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{pro.experience} ans d'expérience</span>
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
                        src={pro.photo}
                        alt={`Photo de ${pro.nom}`}
                        size="md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-[#111827] truncate">{pro.nom}</h3>
                          <p className="text-sm text-gray-600 truncate">{pro.specialite}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{pro.localisation} • {pro.distance} km</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{pro.experience} ans d'expérience</span>
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
              <h3 className="text-2xl font-semibold text-[#111827] mb-2">{selectedProfessionnel.nom}</h3>
              <p className="text-lg text-gray-600 mb-2">{selectedProfessionnel.specialite}</p>
              <p className="text-sm text-gray-500">
                {selectedProfessionnel.localisation} • {
                  userLocation 
                    ? `${calculateDistance(userLocation.lat, userLocation.lng, selectedProfessionnel.lat, selectedProfessionnel.lng).toFixed(1)} km`
                    : `${selectedProfessionnel.distance} km`
                }
              </p>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Zone de chalandise</h4>
                <p className="text-sm text-[#111827]">{selectedProfessionnel.zoneChalandise}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Années d'expérience</h4>
                <p className="text-sm text-gray-900">{selectedProfessionnel.experience} ans</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Tarifs</h4>
                <p className="text-sm text-gray-900">{selectedProfessionnel.tarifs}</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Moyens de paiement acceptés</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfessionnel.moyensPaiement.map((moyen, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {moyen}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Bio</h4>
                <p className="text-sm text-gray-900 leading-relaxed">{selectedProfessionnel.bio}</p>
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
                  // TODO: Implémenter la logique de prise de RDV
                }}
              >
                Prendre RDV
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RDV Modal */}
      <Modal
        isOpen={isRdvModalOpen}
        onClose={() => setIsRdvModalOpen(false)}
        title={`Demande de rendez-vous avec ${selectedProfessionnel?.nom || ''}`}
        size="lg"
      >
        {selectedProfessionnel && (
          <form onSubmit={handleRdvSubmit} className="space-y-6">

            {/* Sélection date et heure */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Date et heure</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={!selectedDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-[#5e6ad2] transition-all duration-150 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Sélectionner une heure</option>
                    {getAvailableTimes(selectedDate).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Informations du propriétaire */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Vos informations</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  name="prenom"
                  value={rdvFormData.prenom}
                  onChange={handleRdvFormChange}
                  placeholder="Votre prénom"
                  required
                />
                
                <Input
                  label="Nom"
                  name="nom"
                  value={rdvFormData.nom}
                  onChange={handleRdvFormChange}
                  placeholder="Votre nom"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={rdvFormData.email}
                  onChange={handleRdvFormChange}
                  placeholder="votre@email.com"
                  required
                />
                
                <Input
                  label="Téléphone"
                  name="telephone"
                  value={rdvFormData.telephone}
                  onChange={handleRdvFormChange}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
              
              <div>
                <Input
                  label="Adresse"
                  name="adresse"
                  value={rdvFormData.adresse}
                  onChange={handleRdvFormChange}
                  placeholder="Entrez votre adresse complète"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  helperText="Google Places API sera intégrée ici"
                />
              </div>
            </div>

            {/* Équidés concernés */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Équidés concernés</h4>
              
              <div className="space-y-2">
                {equides.map(equide => (
                  <label key={equide.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={rdvFormData.equides.includes(equide.id)}
                      onChange={(e) => handleEquideChange(equide.id, e.target.checked)}
                      className="w-4 h-4 text-[#f86f4d] border-[#e5e7eb] rounded focus:ring-[#f86f4d]"
                    />
                    <span className="text-sm text-gray-700">{equide.nom}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Motif de consultation */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Motif de consultation</h4>
              
              <textarea
                name="motif"
                value={rdvFormData.motif}
                onChange={handleRdvFormChange}
                placeholder="Décrivez le motif de votre rendez-vous..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5e6ad2] focus:border-[#5e6ad2] transition-all duration-150"
                required
              />
            </div>

            {/* Créneaux alternatifs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Créneaux alternatifs (facultatif)</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addCreneauAlternatif}
                >
                  Ajouter un créneau
                </Button>
              </div>
              
              {rdvFormData.creneauxAlternatifs.map((creneau, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={creneau.date}
                      onChange={(e) => updateCreneauAlternatif(index, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                    <select
                      value={creneau.heure}
                      onChange={(e) => updateCreneauAlternatif(index, 'heure', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150"
                    >
                      <option value="">Sélectionner</option>
                      {getAvailableTimes(creneau.date).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
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
    </div>
  );
}

