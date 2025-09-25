'use client';

import { useState } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Input from '@/app/dashboard/pro/components/Input';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Search, Eye, Phone, Mail, MapPin, Download, X } from 'lucide-react';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  equides: string[];
  derniereVisite: string;
  totalRendezVous: number;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const clients: Client[] = [
    {
      id: '1',
      nom: 'Dubois',
      prenom: 'Marie',
      email: 'marie.dubois@email.com',
      telephone: '06 12 34 56 78',
      adresse: '123 rue de la Paix',
      ville: 'Paris 15ème',
      equides: ['Bella', 'Thunder'],
      derniereVisite: '2024-01-10',
      totalRendezVous: 8
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre.martin@email.com',
      telephone: '06 23 45 67 89',
      adresse: '456 avenue des Champs',
      ville: 'Paris 8ème',
      equides: ['Luna'],
      derniereVisite: '2024-01-08',
      totalRendezVous: 5
    },
    {
      id: '3',
      nom: 'Laurent',
      prenom: 'Sophie',
      email: 'sophie.laurent@email.com',
      telephone: '06 34 56 78 90',
      adresse: '789 boulevard Saint-Germain',
      ville: 'Paris 7ème',
      equides: ['Spirit', 'Storm', 'Luna'],
      derniereVisite: '2024-01-12',
      totalRendezVous: 12
    },
    {
      id: '4',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      telephone: '06 45 67 89 01',
      adresse: '321 rue de Rivoli',
      ville: 'Paris 1er',
      equides: ['Thunder'],
      derniereVisite: '2024-01-05',
      totalRendezVous: 3
    },
    {
      id: '5',
      nom: 'Moreau',
      prenom: 'Claire',
      email: 'claire.moreau@email.com',
      telephone: '06 56 78 90 12',
      adresse: '654 rue de la République',
      ville: 'Paris 11ème',
      equides: ['Bella', 'Spirit'],
      derniereVisite: '2024-01-14',
      totalRendezVous: 6
    }
  ];

  const filteredClients = clients.filter(client =>
    `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ville.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleExportCSV = () => {
    // Préparer les données pour l'export
    const csvData = filteredClients.map(client => ({
      'Nom': client.nom,
      'Prénom': client.prenom,
      'Email': client.email,
      'Téléphone': client.telephone,
      'Adresse': client.adresse,
      'Ville': client.ville,
      'Nombre d\'équidés': client.equides.length,
      'Équidés': client.equides.join('; '),
      'Dernière visite': new Date(client.derniereVisite).toLocaleDateString('fr-FR'),
      'Total rendez-vous': client.totalRendezVous
    }));

    // Convertir en CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Échapper les virgules et guillemets dans les valeurs
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients-ekicare-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mes clients
          </h1>
          <p className="text-[#6b7280] text-lg">
            Gérez vos clients et leurs équidés
          </p>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportCSV}
          disabled={filteredClients.length === 0}
        >
          Exporter en CSV
        </Button>
      </div>

      {/* Search */}
      <Card variant="elevated">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#ff6b35] transition-all duration-150 text-[#111827] placeholder-[#9ca3af]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClients.map((client) => (
          <Card key={client.id} variant="elevated" className="hover:shadow-md transition-shadow duration-150">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    {client.prenom} {client.nom}
                  </h3>
                  <p className="text-sm text-[#6b7280]">{client.ville}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewClient(client)}
                  icon={<Eye className="w-4 h-4" />}
                >
                  Voir
                </Button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-[#6b7280]">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6b7280]">
                  <Phone className="w-4 h-4" />
                  <span>{client.telephone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6b7280]">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{client.adresse}</span>
                </div>
              </div>

              {/* Equides */}
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-2">Équidés ({client.equides.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {client.equides.map((equide, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#f86f4d10] text-[#f86f4d]"
                    >
                      {equide}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb]">
                <div className="text-sm text-[#6b7280]">
                  Dernière visite: {new Date(client.derniereVisite).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-sm font-medium text-[#111827]">
                  {client.totalRendezVous} RDV
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Aucun client trouvé</h3>
          <p className="text-[#6b7280]">
            {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Vous n\'avez pas encore de clients.'}
          </p>
        </Card>
      )}

      {/* Client Detail Modal */}
      <Modal 
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient ? `${selectedClient.prenom} ${selectedClient.nom}` : ''}
      >
        {selectedClient && (
          <div className="space-y-6">
            {/* Informations de contact */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Informations de contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[#6b7280]" />
                  <span className="text-[#111827]">{selectedClient.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[#6b7280]" />
                  <span className="text-[#111827]">{selectedClient.telephone}</span>
                </div>
                <div className="flex items-center space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-[#6b7280]" />
                  <span className="text-[#111827]">{selectedClient.adresse}, {selectedClient.ville}</span>
                </div>
              </div>
            </div>

            {/* Équidés */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Équidés ({selectedClient.equides.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedClient.equides.map((equide, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#f86f4d10] text-[#f86f4d]"
                  >
                    {equide}
                  </span>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Statistiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f9fafb] p-4 rounded-lg">
                  <p className="text-sm text-[#6b7280]">Total rendez-vous</p>
                  <p className="text-2xl font-bold text-[#111827]">{selectedClient.totalRendezVous}</p>
                </div>
                <div className="bg-[#f9fafb] p-4 rounded-lg">
                  <p className="text-sm text-[#6b7280]">Dernière visite</p>
                  <p className="text-lg font-semibold text-[#111827]">
                    {new Date(selectedClient.derniereVisite).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton Fermer */}
            <div className="flex justify-end pt-4 border-t border-[#e5e7eb]">
              <Button
                variant="secondary"
                onClick={() => setSelectedClient(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
