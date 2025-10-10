'use client';

import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tourName: string;
  loading?: boolean;
}

export default function DeleteTourModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tourName, 
  loading = false 
}: DeleteTourModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer cette tournée ?">
      <div className="space-y-6">
        {/* Icône d'alerte */}
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        {/* Message de confirmation */}
        <div className="text-center">
          <p className="text-[#6b7280] text-base leading-relaxed">
            Êtes-vous sûr de vouloir supprimer la tournée{' '}
            <span className="font-semibold text-[#111827]">"{tourName}"</span> ?
          </p>
          <p className="text-[#6b7280] text-sm mt-2">
            Cette action est irréversible.
          </p>
        </div>

        {/* Footer avec boutons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            icon={loading ? undefined : <Trash2 className="w-4 h-4" />}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
