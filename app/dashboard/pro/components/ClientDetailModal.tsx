'use client';

import Modal from './Modal';
import Button from './Button';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    nom: string;
    prenom: string;
    email?: string;
    telephone: string;
    adresse: string;
    ville: string;
    equides?: string[];
    derniereVisite?: string;
    totalRendezVous?: number;
  } | null;
}

export default function ClientDetailModal({
  isOpen,
  onClose,
  client
}: ClientDetailModalProps) {
  if (!client) return null;

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose}
      title={`${client.prenom} ${client.nom}`}
    >
      <div className="space-y-6">
        {/* Informations de contact */}
        <div>
          <h4 className="font-medium text-[#111827] mb-3">Informations de contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[#6b7280]" />
                <span className="text-[#111827]">{client.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-[#6b7280]" />
              <span className="text-[#111827]">{client.telephone}</span>
            </div>
            <div className="flex items-center space-x-3 md:col-span-2">
              <MapPin className="w-5 h-5 text-[#6b7280]" />
              <span className="text-[#111827]">{client.adresse}, {client.ville}</span>
            </div>
          </div>
        </div>

        {/* Équidés */}
        {client.equides && client.equides.length > 0 && (
          <div>
            <h4 className="font-medium text-[#111827] mb-3">Équidés ({client.equides.length})</h4>
            <div className="flex flex-wrap gap-2">
              {client.equides.map((equide, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#f86f4d10] text-[#f86f4d]"
                >
                  {equide}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques */}
        {(client.totalRendezVous || client.derniereVisite) && (
          <div>
            <h4 className="font-medium text-[#111827] mb-3">Statistiques</h4>
            <div className="grid grid-cols-2 gap-4">
              {client.totalRendezVous && (
                <div className="bg-[#f9fafb] p-4 rounded-lg">
                  <p className="text-sm text-[#6b7280]">Total rendez-vous</p>
                  <p className="text-2xl font-bold text-[#111827]">{client.totalRendezVous}</p>
                </div>
              )}
              {client.derniereVisite && (
                <div className="bg-[#f9fafb] p-4 rounded-lg">
                  <p className="text-sm text-[#6b7280]">Dernière visite</p>
                  <p className="text-lg font-semibold text-[#111827]">
                    {new Date(client.derniereVisite).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bouton Fermer */}
        <div className="flex justify-end pt-4 border-t border-[#e5e7eb]">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
