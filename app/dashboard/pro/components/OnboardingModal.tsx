'use client';

import { useRouter } from 'next/navigation';
import Modal from './Modal';
import Button from './Button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const router = useRouter();

  const handleGoToProfile = () => {
    onComplete();
    onClose();
    router.push('/dashboard/pro/profil');
  };

  const handleCloseModal = () => {
    onComplete();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Complétez votre profil"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          Pour apparaître de la meilleure manière dans les résultats de recherche des propriétaires, pensez à configurer votre profil dans l'onglet Mon profil.
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleCloseModal}
          >
            Plus tard
          </Button>
          <Button
            variant="primary"
            onClick={handleGoToProfile}
          >
            Aller à mon profil
          </Button>
        </div>
      </div>
    </Modal>
  );
}
