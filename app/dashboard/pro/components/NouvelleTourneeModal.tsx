'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  heure: string;
  client: string;
  adresse: string;
  ville: string;
  type: string;
  equide: string;
}

interface NouvelleTourneeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data des rendez-vous disponibles avec dates
const appointments: Appointment[] = [
  {
    id: '1',
    date: '2024-01-20', // Aujourd'hui
    heure: '09:00',
    client: 'Marie Dubois',
    adresse: '123 rue de la Paix',
    ville: 'Paris 15ème',
    type: 'Consultation générale',
    equide: 'Bella'
  },
  {
    id: '2',
    date: '2024-01-20', // Aujourd'hui
    heure: '14:00',
    client: 'Pierre Martin',
    adresse: '456 avenue des Champs',
    ville: 'Paris 8ème',
    type: 'Vaccination',
    equide: 'Thunder'
  },
  {
    id: '3',
    date: '2024-01-21', // Demain
    heure: '11:00',
    client: 'Sophie Laurent',
    adresse: '789 boulevard Saint-Germain',
    ville: 'Paris 7ème',
    type: 'Contrôle dentaire',
    equide: 'Luna'
  },
  {
    id: '4',
    date: '2024-01-21', // Demain
    heure: '16:30',
    client: 'Jean Dupont',
    adresse: '321 rue de Rivoli',
    ville: 'Paris 1er',
    type: 'Chirurgie',
    equide: 'Storm'
  },
  {
    id: '5',
    date: '2024-01-22', // Après-demain
    heure: '10:00',
    client: 'Claire Moreau',
    adresse: '654 rue de la République',
    ville: 'Paris 11ème',
    type: 'Consultation',
    equide: 'Spirit'
  },
  {
    id: '6',
    date: '2024-01-22', // Après-demain
    heure: '15:00',
    client: 'Antoine Bernard',
    adresse: '987 rue de la Sorbonne',
    ville: 'Paris 5ème',
    type: 'Vaccination',
    equide: 'Apollo'
  }
];

export default function NouvelleTourneeModal({ isOpen, onClose }: NouvelleTourneeModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);

  // Mock valeurs fixes par rendez-vous
  const DISTANCE_PAR_RDV = 5; // km
  const DUREE_PAR_RDV = 45; // minutes

  // Fonction pour formater la date
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset des heures pour comparer seulement les dates
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Aujourd\'hui';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Fonction pour grouper les rendez-vous par date
  const groupAppointmentsByDate = () => {
    const grouped = appointments.reduce((acc, appointment) => {
      const dateKey = appointment.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);

    // Trier les rendez-vous par heure dans chaque groupe
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.heure.localeCompare(b.heure));
    });

    // Trier les dates
    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(dateKey => ({
      date: dateKey,
      label: formatDateLabel(dateKey),
      appointments: grouped[dateKey]
    }));
  };

  const handleAppointmentToggle = (appointmentId: string) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const handleCreateTournee = () => {
    const selectedAppointmentsData = appointments.filter(apt => 
      selectedAppointments.includes(apt.id)
    );
    
    console.log('Nouvelle tournée créée:', {
      date: selectedDate,
      appointments: selectedAppointmentsData,
      totalDistance: selectedAppointments.length * DISTANCE_PAR_RDV,
      totalDuration: selectedAppointments.length * DUREE_PAR_RDV
    });
    
    onClose();
  };

  const selectedCount = selectedAppointments.length;
  const totalDistance = selectedCount * DISTANCE_PAR_RDV;
  const totalDuration = selectedCount * DUREE_PAR_RDV;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une nouvelle tournée">
      <div className="space-y-6">
        {/* Sélecteur de date */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Date de la tournée
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f86f4d] focus:border-[#f86f4d] transition-all duration-150 text-[#111827]"
          />
        </div>

        {/* Liste des rendez-vous disponibles groupés par date */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Rendez-vous disponibles
          </label>
          <div className="max-h-60 overflow-y-auto">
            {groupAppointmentsByDate().map((dateGroup) => (
              <div key={dateGroup.date} className="mb-4">
                {/* Séparateur de date */}
                <h4 className="text-sm font-semibold text-gray-500 mt-4 mb-2">
                  {dateGroup.label}
                </h4>
                
                {/* Rendez-vous du jour */}
                <div className="space-y-2">
                  {dateGroup.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`bg-white hover:bg-gray-50 p-3 rounded-md border border-[#e5e7eb] cursor-pointer transition-colors duration-150 ${
                        selectedAppointments.includes(appointment.id)
                          ? 'bg-[#f86f4d10] border-[#f86f4d]'
                          : ''
                      }`}
                      onClick={() => handleAppointmentToggle(appointment.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAppointments.includes(appointment.id)}
                          onChange={() => handleAppointmentToggle(appointment.id)}
                          className="w-4 h-4 text-[#f86f4d] border-[#e5e7eb] rounded focus:ring-[#f86f4d]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-[#111827]">{appointment.heure}</span>
                            <span className="text-sm text-[#111827] font-medium">{appointment.client}</span>
                          </div>
                          <p className="text-sm text-gray-500">{appointment.adresse}, {appointment.ville}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résumé dynamique */}
        {selectedCount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-[#111827] mb-3">Résumé de la tournée</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{selectedCount}</span>
                </div>
                <p className="text-xs text-gray-500">Rendez-vous</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MapPin className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{totalDistance} km</span>
                </div>
                <p className="text-xs text-gray-500">Distance totale</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-4 h-4 text-[#f86f4d]" />
                  <span className="text-lg font-semibold text-[#111827]">{formatDuration(totalDuration)}</span>
                </div>
                <p className="text-xs text-gray-500">Durée totale</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer avec boutons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTournee}
            disabled={selectedCount === 0 || !selectedDate}
          >
            Créer la tournée
          </Button>
        </div>
      </div>
    </Modal>
  );
}
