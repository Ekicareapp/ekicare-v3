'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/dashboard/pro/components/Card';
import Button from '@/app/dashboard/pro/components/Button';
import Input from '@/app/dashboard/pro/components/Input';
import Modal from '@/app/dashboard/pro/components/Modal';
import { Search, Eye, Phone, Mail, MapPin, Download, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  totalRendezVous: number;
  derniereVisite: string | null;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les clients directement depuis Supabase côté client
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Vérifier d'abord si l'utilisateur est connecté
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Vous devez être connecté pour voir vos clients');
        }
        
        console.log('✅ Utilisateur connecté:', user.id);
        
        // Vérifier que l'utilisateur est un professionnel
        const { data: userData, error: userRoleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userRoleError || !userData || userData.role !== 'PRO') {
          throw new Error('Seuls les professionnels peuvent accéder à cette page');
        }
        
        console.log('✅ Rôle vérifié:', userData.role);
        
        // Vérifier le profil pro pour confirmer l'ID
        const { data: proProfile, error: proProfileError } = await supabase
          .from('pro_profiles')
          .select('user_id, prenom, nom')
          .eq('user_id', user.id)
          .single();
        
        if (proProfileError) {
          console.error('❌ Erreur profil pro:', proProfileError);
        } else {
          console.log('👨‍⚕️ Profil pro trouvé:', proProfile);
        }
        
        // Récupérer les appointments terminés pour ce pro
        console.log('🔍 Recherche des appointments pour pro_id:', user.id);
        
        // D'abord, vérifier tous les appointments de ce pro (tous statuts)
        const { data: allAppointments, error: allAppointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            pro_id,
            proprio_id,
            created_at,
            main_slot,
            status
          `)
          .eq('pro_id', user.id)
          .order('main_slot', { ascending: false });

        if (allAppointmentsError) {
          console.error('❌ Erreur appointments (tous):', allAppointmentsError);
        } else {
          console.log('📊 Tous les appointments de ce pro:', allAppointments?.length || 0);
          console.log('📋 Détail des appointments:', allAppointments);
        }
        
        // Tester différents statuts possibles
        const possibleStatuses = ['completed', 'terminé', 'terminé', 'COMPLETED', 'TERMINE'];
        let appointments = null;
        let appointmentsError = null;
        
        for (const status of possibleStatuses) {
          console.log(`🔍 Test avec statut: "${status}"`);
          const { data: testAppointments, error: testError } = await supabase
            .from('appointments')
            .select(`
              id,
              pro_id,
              proprio_id,
              created_at,
              main_slot,
              status
            `)
            .eq('pro_id', user.id)
            .eq('status', status)
            .order('main_slot', { ascending: false });
            
          if (testError) {
            console.error(`❌ Erreur avec statut "${status}":`, testError);
          } else {
            console.log(`📅 Appointments "${status}" trouvés:`, testAppointments?.length || 0);
            if (testAppointments && testAppointments.length > 0) {
              appointments = testAppointments;
              appointmentsError = null;
              console.log(`✅ Statut correct trouvé: "${status}"`);
              break;
            }
          }
        }
        
        if (appointmentsError) {
          console.error('❌ Erreur appointments:', appointmentsError);
          throw new Error('Erreur lors de la récupération des rendez-vous');
        }
        
        console.log('📅 Appointments finaux trouvés:', appointments?.length || 0);
        console.log('📋 Détail des appointments finaux:', appointments);

        if (!appointments || appointments.length === 0) {
          setClients([]);
          return;
        }

        // Récupérer les IDs uniques des propriétaires
        const uniqueProprioIds = [...new Set(appointments.map(apt => apt.proprio_id))];
        console.log('👥 Propriétaires uniques:', uniqueProprioIds.length);

        // Récupérer les informations des propriétaires
        const { data: proprioProfiles, error: proprioError } = await supabase
          .from('proprio_profiles')
          .select(`
            user_id,
            prenom,
            nom,
            telephone,
            adresse,
            users!proprio_profiles_user_id_fkey (
              email
            )
          `)
          .in('user_id', uniqueProprioIds);

        if (proprioError) {
          console.error('❌ Erreur proprio_profiles:', proprioError);
          throw new Error('Erreur lors de la récupération des profils propriétaires');
        }

        console.log('✅ Profils propriétaires récupérés:', proprioProfiles?.length || 0);

        // Enrichir les données avec les statistiques des rendez-vous
        const clientsData = (proprioProfiles || []).map(proprio => {
          const clientAppointments = appointments.filter(apt => apt.proprio_id === proprio.user_id);
          
          // Calculer le nombre total de rendez-vous
          const totalRendezVous = clientAppointments.length;
          
          // Trouver le dernier rendez-vous terminé
          const dernierRendezVous = clientAppointments.length > 0 
            ? clientAppointments[0].main_slot 
            : null;

          return {
            id: proprio.user_id,
            nom: proprio.nom,
            prenom: proprio.prenom,
            email: proprio.users.email,
            telephone: proprio.telephone,
            adresse: proprio.adresse,
            totalRendezVous,
            derniereVisite: dernierRendezVous
          };
        });

        // Trier par date du dernier rendez-vous (plus récent en premier)
        clientsData.sort((a, b) => {
          if (!a.derniereVisite && !b.derniereVisite) return 0;
          if (!a.derniereVisite) return 1;
          if (!b.derniereVisite) return -1;
          return new Date(b.derniereVisite).getTime() - new Date(a.derniereVisite).getTime();
        });

        console.log('✅ Clients construits:', clientsData.length);
        setClients(clientsData);
        
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      'Email': client.email,
      'Téléphone': client.telephone,
      'Adresse': client.adresse,
      'Dernière visite': client.derniereVisite ? new Date(client.derniereVisite).toLocaleDateString('fr-FR') : 'N/A',
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
