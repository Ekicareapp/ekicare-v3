'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Save } from 'lucide-react';

interface CompteRenduModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  existingReport?: string;
  onSave: (reportText: string) => void;
}

export default function CompteRenduModal({
  isOpen,
  onClose,
  appointmentId,
  existingReport = '',
  onSave
}: CompteRenduModalProps) {
  const [reportText, setReportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Charger le compte-rendu existant quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setReportText(existingReport);
    }
  }, [isOpen, existingReport]);

  const handleSave = async () => {
    if (!reportText.trim()) {
      alert('Veuillez saisir un compte-rendu');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(reportText.trim());
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du compte-rendu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReportText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compte-rendu du rendez-vous"
    >
      <div className="space-y-6">
        {/* Informations du rendez-vous */}
        <div className="bg-[#f9fafb] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-[#6b7280] mb-1">
            Rendez-vous ID: {appointmentId}
          </h3>
          <p className="text-sm text-[#6b7280]">
            Saisissez le compte-rendu détaillé de ce rendez-vous
          </p>
        </div>

        {/* Champ de saisie */}
        <div>
          <label className="block text-sm font-medium text-[#6b7280] mb-2">
            Compte-rendu
          </label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Décrivez les soins effectués, les observations, les recommandations..."
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:border-[#ff6b35] resize-none"
            rows={8}
            disabled={isLoading}
          />
          <p className="text-xs text-[#6b7280] mt-1">
            {reportText.length} caractères
          </p>
        </div>

        {/* Aperçu du compte-rendu existant */}
        {existingReport && (
          <div>
            <h4 className="text-sm font-medium text-[#6b7280] mb-2">
              Compte-rendu actuel :
            </h4>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-[#111827] whitespace-pre-wrap">
                {existingReport}
              </p>
            </div>
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
            onClick={handleSave}
            disabled={!reportText.trim() || isLoading}
            className="bg-[#f86f4d] hover:bg-[#f86f4d]/90 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
