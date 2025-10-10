'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Search, Eye, Phone, MapPin, Download, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  photo?: string;
  telephone: string;
  adresse: string;
  totalRendezVous: number;
  derniereVisite: string | null;
  dateAjout?: string;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Charger les clients directement depuis Supabase (contourner l'API)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier que Supabase est initialisé
        if (!supabase) {
          setError('Client Supabase non initialisé');
          return;
        }

        // Récupérer la session utilisateur
        const { data: { session } } = await supabase!.auth.getSession();
        if (!session) {
          setError('Non authentifié');
          return;
        }

        console.log('🔍 Session utilisateur:', session.user.id);

        // Récupérer l'ID du profil PRO
        const { data: proProfile, error: proError } = await supabase!
          .from('pro_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (proError || !proProfile) {
          console.error('Erreur profil PRO:', proError);
          setError('Profil PRO non trouvé');
          return;
        }

        console.log('🔍 Profil PRO trouvé:', proProfile.id);

        // Récupérer les RDV confirmés
        const { data: confirmedAppointments, error: appointmentsError } = await supabase!
          .from('appointments')
          .select('proprio_id')
          .eq('pro_id', proProfile.id)
          .eq('status', 'confirmed');

        if (appointmentsError) {
          console.error('Erreur RDV confirmés:', appointmentsError);
          setError('Erreur lors de la récupération des rendez-vous');
          return;
        }

        console.log('🔍 RDV confirmés trouvés:', confirmedAppointments.length);

        const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];

        if (uniqueProprioIds.length === 0) {
          setClients([]);
          return;
        }

        // Récupérer les profils des propriétaires
        const { data: clients, error: clientsError } = await supabase!
          .from('proprio_profiles')
          .select(`
            id,
            user_id,
            prenom,
            nom,
            telephone,
            adresse,
            created_at
          `)
          .in('user_id', uniqueProprioIds)
          .order('created_at', { ascending: false });

        if (clientsError) {
          console.error('Erreur clients:', clientsError);
          setError('Erreur lors de la récupération des clients');
          return;
        }

        console.log('🔍 Clients trouvés:', clients.length);

        // Calculer les statistiques pour chaque client
        const clientsWithStats = await Promise.all(
          clients.map(async (client) => {
            const { data: appointments, error: appointmentsError } = await supabase!
              .from('appointments')
              .select('id, main_slot, status, created_at')
              .eq('pro_id', proProfile.id)
              .eq('proprio_id', client.user_id)
              .order('main_slot', { ascending: false });

            if (appointmentsError) {
              console.error('Erreur appointments client:', appointmentsError);
              return {
                id: client.id,
                nom: client.nom,
                prenom: client.prenom,
                photo: undefined,
                telephone: client.telephone,
                adresse: client.adresse,
                totalRendezVous: 0,
                derniereVisite: null,
                dateAjout: client.created_at
              };
            }

            // Compter seulement les RDV confirmés (pas les en attente)
            const rendezVousConfirmes = appointments.filter(rdv => rdv.status === 'confirmed');
            const totalRendezVous = rendezVousConfirmes.length;
            
            const rendezVousTermines = appointments.filter(rdv => rdv.status === 'completed' || rdv.status === 'canceled');
            const derniereVisite = rendezVousTermines.length > 0
              ? rendezVousTermines[0].main_slot
              : null;

            return {
              id: client.id,
              nom: client.nom,
              prenom: client.prenom,
              photo: undefined,
              telephone: client.telephone,
              adresse: client.adresse,
              totalRendezVous,
              derniereVisite,
              dateAjout: client.created_at
            };
          })
        );

        console.log('🔍 Clients avec stats:', clientsWithStats.length);
        setClients(clientsWithStats);

      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Synchronisation temps réel améliorée
  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        console.log('📡 Changement détecté dans appointments:', payload);
        
        // Recharger les clients automatiquement (même logique que le chargement initial)
        const fetchClients = async () => {
          try {
            setSyncing(true);
            if (!supabase) {
              console.log('⚠️  Client Supabase non initialisé');
              return;
            }
            const { data: { session } } = await supabase!.auth.getSession();
            if (!session) {
              console.log('⚠️  Pas de session, arrêt du rechargement');
              return;
            }

            console.log('🔄 Rechargement des clients...');

            // Récupérer l'ID du profil PRO
            const { data: proProfile, error: proError } = await supabase!
              .from('pro_profiles')
              .select('id')
              .eq('user_id', session.user.id)
              .single();

            if (proError || !proProfile) {
              console.error('Erreur profil PRO:', proError);
              return;
            }

            // Récupérer les RDV confirmés
            const { data: confirmedAppointments, error: appointmentsError } = await supabase!
              .from('appointments')
              .select('proprio_id')
              .eq('pro_id', proProfile.id)
              .eq('status', 'confirmed');

            if (appointmentsError) {
              console.error('Erreur RDV confirmés:', appointmentsError);
              return;
            }

            const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];

            if (uniqueProprioIds.length === 0) {
              setClients([]);
              return;
            }

            // Récupérer les profils des propriétaires
            const { data: clients, error: clientsError } = await supabase!
              .from('proprio_profiles')
              .select(`
                id,
                user_id,
                prenom,
                nom,
                telephone,
                adresse,
                created_at
              `)
              .in('user_id', uniqueProprioIds)
              .order('created_at', { ascending: false });

            if (clientsError) {
              console.error('Erreur clients:', clientsError);
              return;
            }

            // Calculer les statistiques pour chaque client
            const clientsWithStats = await Promise.all(
              clients.map(async (client) => {
                const { data: appointments, error: appointmentsError } = await supabase!
                  .from('appointments')
                  .select('id, main_slot, status, created_at')
                  .eq('pro_id', proProfile.id)
                  .eq('proprio_id', client.user_id)
                  .order('main_slot', { ascending: false });

                if (appointmentsError) {
                  console.error('Erreur appointments client:', appointmentsError);
                  return {
                    id: client.id,
                    nom: client.nom,
                    prenom: client.prenom,
                    photo: undefined,
                    telephone: client.telephone,
                    adresse: client.adresse,
                    totalRendezVous: 0,
                    derniereVisite: null,
                    dateAjout: client.created_at
                  };
                }

                // Compter seulement les RDV confirmés (pas les en attente)
                const rendezVousConfirmes = appointments.filter(rdv => rdv.status === 'confirmed');
                const totalRendezVous = rendezVousConfirmes.length;
                
                const rendezVousTermines = appointments.filter(rdv => rdv.status === 'completed' || rdv.status === 'canceled');
                const derniereVisite = rendezVousTermines.length > 0
                  ? rendezVousTermines[0].main_slot
                  : null;

                return {
                  id: client.id,
                  nom: client.nom,
                  prenom: client.prenom,
                  photo: undefined,
                  telephone: client.telephone,
                  adresse: client.adresse,
                  totalRendezVous,
                  derniereVisite,
                  dateAjout: client.created_at
                };
              })
            );

            console.log('✅ Clients rechargés:', clientsWithStats.length);
            setClients(clientsWithStats);
          } catch (error) {
            console.error('❌ Erreur lors du rechargement des clients:', error);
          } finally {
            setSyncing(false);
          }
        };

        fetchClients();
      })
      .subscribe();

    return () => {
      console.log('🔌 Déconnexion du channel clients-realtime');
      supabase?.removeChannel(channel);
    };
  }, []);

  const filteredClients = clients.filter(client =>
    `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.adresse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleExportCSV = () => {
    // Préparer les données pour l'export
    const csvData = filteredClients.map(client => ({
      'Nom': client.nom,
      'Prénom': client.prenom,
      'Téléphone': client.telephone,
      'Adresse': client.adresse,
      'Dernière visite': client.derniereVisite ? new Date(client.derniereVisite).toLocaleDateString('fr-FR') : 'N/A',
      'Total rendez-vous': client.totalRendezVous,
      'Date d\'ajout': client.dateAjout ? new Date(client.dateAjout).toLocaleDateString('fr-FR') : 'N/A'
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

  // Affichage du loading
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              Mes clients
            </h1>
            <p className="text-[#6b7280] text-lg">
              Gérez vos clients
            </p>
          </div>
        </div>
        
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-[#6b7280] animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Chargement des clients...</h3>
          <p className="text-[#6b7280]">
            Récupération de vos données clients en cours.
          </p>
        </Card>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">
              Mes clients
            </h1>
            <p className="text-[#6b7280] text-lg">
              Gérez vos clients
            </p>
          </div>
        </div>
        
        <Card variant="elevated" className="text-center py-16">
          <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-[#ef4444]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111827] mb-2">Erreur de chargement</h3>
          <p className="text-[#6b7280] mb-4">
            {error}
          </p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Mes clients
            {syncing && (
              <span className="ml-2 text-sm text-[#6b7280] animate-pulse">
                🔄 Synchronisation...
              </span>
            )}
          </h1>
          <p className="text-[#6b7280] text-lg">
            Gérez vos clients
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
                <div className="flex items-center space-x-3">
                  {client.photo ? (
                    <img 
                      src={client.photo} 
                      alt={`${client.prenom} ${client.nom}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-[#f3f4f6] rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-[#6b7280]">
                        {client.prenom.charAt(0)}{client.nom.charAt(0)}
                      </span>
                    </div>
                  )}
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    {client.prenom} {client.nom}
                  </h3>
                    <p className="text-sm text-[#6b7280]">Client depuis {client.dateAjout ? new Date(client.dateAjout).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  </div>
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
                  <Phone className="w-4 h-4" />
                  <span>{client.telephone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6b7280]">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{client.adresse}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb]">
                <div className="text-sm text-[#6b7280]">
                  Dernière visite: {client.derniereVisite ? new Date(client.derniereVisite).toLocaleDateString('fr-FR') : 'N/A'}
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
          <h3 className="text-xl font-semibold text-[#111827] mb-2">
            {searchTerm ? 'Aucun client trouvé' : 'Vous n\'avez pas encore de clients'}
          </h3>
          <p className="text-[#6b7280]">
            {searchTerm 
              ? 'Aucun client ne correspond à votre recherche.' 
              : 'Les propriétaires apparaîtront ici après votre premier rendez-vous terminé.'
            }
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
            {/* Photo et informations de base */}
            <div className="flex items-center space-x-4">
              {selectedClient.photo ? (
                <img 
                  src={selectedClient.photo} 
                  alt={`${selectedClient.prenom} ${selectedClient.nom}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-[#6b7280]">
                    {selectedClient.prenom.charAt(0)}{selectedClient.nom.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-[#111827]">
                  {selectedClient.prenom} {selectedClient.nom}
                </h3>
                <p className="text-[#6b7280]">
                  Client depuis {selectedClient.dateAjout ? new Date(selectedClient.dateAjout).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>

            {/* Informations de contact */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">Informations de contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[#6b7280]" />
                  <span className="text-[#111827]">{selectedClient.telephone}</span>
                </div>
                <div className="flex items-center space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-[#6b7280]" />
                  <span className="text-[#111827]">{selectedClient.adresse}</span>
                </div>
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
                    {selectedClient.derniereVisite 
                      ? new Date(selectedClient.derniereVisite).toLocaleDateString('fr-FR')
                      : 'N/A'
                    }
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
