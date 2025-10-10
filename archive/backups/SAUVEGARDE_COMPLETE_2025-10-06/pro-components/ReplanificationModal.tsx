'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Calendar, Clock, X } from 'lucide-react';

interface ReplanificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  alternateSlots?: string[]; // liste des créneaux proposés par le proprio (format ISO)
  onConfirm: (newDate: string) => void;
}

export default function ReplanificationModal({
  isOpen,
  onClose,
  appointmentId,
  alternateSlots = [],
  onConfirm
}: ReplanificationModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Veuillez sélectionner une date et une heure');
      return;
    }

    setIsLoading(true);
    try {
      const newDateTime = `${selectedDate}T${selectedTime}:00`;
      await onConfirm(newDateTime);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la replanification:', error);
      alert('Erreur lors de la replanification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (slot: string) => {
    const dateTime = new Date(slot);
    const date = dateTime.toISOString().split('T')[0];
    const time = dateTime.toTimeString().split(' ')[0].substring(0, 5);
    
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const formatSlot = (slot: string) => {
    const date = new Date(slot);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Replanifier le rendez-vous"
      size="lg"
    >
      <div className="space-y-6">
        {/* Créneaux alternatifs proposés */}
        {alternateSlots.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[#111827] mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#f86f4d]" />
              Créneaux proposés par le propriétaire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alternateSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className="p-3 text-left border border-[#e5e7eb] rounded-lg hover:border-[#f86f4d] hover:bg-[#f86f4d10] transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#111827]">
                      {formatSlot(slot)}
                    </span>
                    <Calendar className="w-4 h-4 text-[#6b7280]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sélection manuelle de date/heure */}
        <div>
          <h3 className="text-lg font-semibold text-[#111827] mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-[#f86f4d]" />
            Ou choisir une nouvelle date/heure
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#ff6b35]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#6b7280] mb-2">
                Heure
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#ff6b35]"
              />
            </div>
          </div>
        </div>

        {/* Aperçu de la sélection */}
        {selectedDate && selectedTime && (
          <div className="bg-[#f9fafb] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#6b7280] mb-1">
              Nouvelle date sélectionnée :
            </h4>
            <p className="text-[#111827] font-medium">
              {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-[#e5e7eb]">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || isLoading}
            className="bg-[#f86f4d] hover:bg-[#f86f4d]/90"
          >
            {isLoading ? 'Replanification...' : 'Confirmer la replanification'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
