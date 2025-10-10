'use client';

import { useState, useEffect } from 'react';
import Card from './components/Card';
import OnboardingModal from './components/OnboardingModal';
import { Calendar, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTimeForDisplay } from '@/lib/dateUtils';

interface Appointment {
  id: string;
  main_slot: string;
  comment: string;
  status: string;
  equides?: Array<{ nom: string }>;
  proprio_profiles?: {
    prenom: string;
    nom: string;
  };
}

interface Tour {
  id: string;
  name: string;
  date: string;
  appointments: any[];
}

export default function ProDashboardPage() {
  // États pour l'onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // États pour les vraies données
  const [prochainesTournees, setProchainesTournees] = useState<Tour[]>([]);
  const [rendezVousAujourdhui, setRendezVousAujourdhui] = useState<Appointment[]>([]);
  const [prochainsRendezVous, setProchainsRendezVous] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier l'état d'onboarding au chargement
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setIsCheckingOnboarding(true);
        
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setIsCheckingOnboarding(false);
          return;
        }

        // Vérifier le statut d'onboarding dans pro_profiles
        const { data: proProfile, error: profileError } = await supabase!
          .from('pro_profiles')
          .select('first_login_completed')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError);
          setIsCheckingOnboarding(false);
          return;
        }

        // Afficher l'onboarding si first_login_completed est false ou null
        if (!proProfile?.first_login_completed) {
          setShowOnboarding(true);
        }

      } catch (error) {
        console.error('Erreur lors de la vérification de l\'onboarding:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setLoading(false);
          return;
        }

        // Récupérer le profil pro pour obtenir le pro_id
        const { data: proProfile, error: proProfileError } = await supabase!
          .from('pro_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (proProfileError || !proProfile) {
          console.error('Profil pro non trouvé:', proProfileError);
          setLoading(false);
          return;
        }

        const proId = proProfile.id;
        console.log('🔍 Pro ID récupéré:', proId);

        // Test : Vérifier s'il y a des appointments pour ce pro
        const { data: allAppointments, error: allAppointmentsError } = await supabase!
          .from('appointments')
          .select('id, pro_id, status, main_slot, created_at')
          .eq('pro_id', proId);
        
        console.log('🔍 Tous les appointments pour ce pro:');
        console.log('- Nombre total:', allAppointments?.length || 0);
        console.log('- Données:', allAppointments);
        console.log('- Erreur:', allAppointmentsError);
        
        // Test : Vérifier les appointments avec tous les statuts
        if (allAppointments && allAppointments.length > 0) {
          const statusCounts = allAppointments.reduce((acc: any, apt: any) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
          }, {});
          console.log('📊 Répartition par statut:', statusCounts);
        }

        // Test : Vérifier s'il y a des tours pour ce pro
        // D'abord essayer avec proId (ID du profil pro)
        const { data: allTours, error: allToursError } = await supabase!
          .from('tours')
          .select('id, pro_id, name, date, created_at')
          .eq('pro_id', proId);
        
        // Si pas de résultats, essayer avec user.id
        let allToursData = allTours;
        let allToursErrorData = allToursError;
        
        if (!allToursData || allToursData.length === 0) {
          console.log('🔄 Aucune tournée avec proId, essai avec user.id...');
          const { data: allToursUser, error: allToursUserError } = await supabase!
            .from('tours')
            .select('id, pro_id, name, date, created_at')
            .eq('pro_id', user.id);
          
          allToursData = allToursUser;
          allToursErrorData = allToursUserError;
        }
        
        console.log('🔍 Toutes les tours pour ce pro:');
        console.log('- Nombre total:', allToursData?.length || 0);
        console.log('- Données:', allToursData);
        console.log('- Erreur:', allToursErrorData);

        // Définir les dates
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        
        console.log('📅 Dates calculées:');
        console.log('- Aujourd\'hui début:', todayStart);
        console.log('- Aujourd\'hui fin:', todayEnd);
        console.log('- Demain:', tomorrow);

        // 1. Récupérer les rendez-vous d'aujourd'hui (tous statuts d'abord)
        const { data: todayAppointments, error: todayError } = await supabase!
          .from('appointments')
          .select('id, main_slot, comment, status, equide_ids, proprio_id')
          .eq('pro_id', proId)
          .gte('main_slot', todayStart)
          .lte('main_slot', todayEnd)
          .order('main_slot', { ascending: true });

        console.log('📊 Résultat rendez-vous aujourd\'hui:');
        console.log('- Nombre trouvé:', todayAppointments?.length || 0);
        console.log('- Données brutes:', todayAppointments);
        console.log('- Erreur:', todayError);

        if (todayError) {
          console.error('Erreur rendez-vous aujourd\'hui:', todayError);
          setRendezVousAujourdhui([]);
        } else {
          // Enrichir avec les noms des équidés et les données des propriétaires
          const enrichedToday = await Promise.all(
            (todayAppointments || []).map(async (appointment) => {
              let equides: any[] = [];
              let proprioData = {};
              
              // Récupérer les équidés
              console.log('🔍 Appointment equide_ids:', appointment.equide_ids);
              if (appointment.equide_ids && appointment.equide_ids.length > 0) {
                const { data: equidesData, error: equidesError } = await supabase!
                  .from('equides')
                  .select('nom')
                  .in('id', appointment.equide_ids);
                console.log('🐴 Équidés récupérés:', equidesData, 'Erreur:', equidesError);
                equides = equidesData || [];
              } else {
                console.log('⚠️ Aucun equide_ids pour cet appointment');
              }
              
              // Récupérer les données du propriétaire
              if (appointment.proprio_id) {
                const { data: proprioProfile } = await supabase!
                  .from('proprio_profiles')
                  .select('prenom, nom')
                  .eq('user_id', appointment.proprio_id)
                  .single();
                proprioData = { proprio_profiles: proprioProfile || {} };
              }
              
              return {
                ...appointment,
                equides,
                ...proprioData
              };
            })
          );
          console.log('✅ Rendez-vous aujourd\'hui enrichis:', enrichedToday);
          setRendezVousAujourdhui(enrichedToday);
        }

        // 2. Récupérer les prochains rendez-vous (tous statuts d'abord)
        const { data: upcomingAppointments, error: upcomingError } = await supabase!
          .from('appointments')
          .select('id, main_slot, comment, status, equide_ids, proprio_id')
          .eq('pro_id', proId)
          .gte('main_slot', tomorrow)
          .order('main_slot', { ascending: true })
          .limit(5);

        console.log('📊 Résultat prochains rendez-vous:');
        console.log('- Nombre trouvé:', upcomingAppointments?.length || 0);
        console.log('- Données brutes:', upcomingAppointments);
        console.log('- Erreur:', upcomingError);

        if (upcomingError) {
          console.error('Erreur prochains rendez-vous:', upcomingError);
          setProchainsRendezVous([]);
        } else {
          // Enrichir avec les noms des équidés et les données des propriétaires
          const enrichedUpcoming = await Promise.all(
            (upcomingAppointments || []).map(async (appointment) => {
              let equides: any[] = [];
              let proprioData = {};
              
              // Récupérer les équidés
              console.log('🔍 Appointment equide_ids:', appointment.equide_ids);
              if (appointment.equide_ids && appointment.equide_ids.length > 0) {
                const { data: equidesData, error: equidesError } = await supabase!
                  .from('equides')
                  .select('nom')
                  .in('id', appointment.equide_ids);
                console.log('🐴 Équidés récupérés:', equidesData, 'Erreur:', equidesError);
                equides = equidesData || [];
              } else {
                console.log('⚠️ Aucun equide_ids pour cet appointment');
              }
              
              // Récupérer les données du propriétaire
              if (appointment.proprio_id) {
                const { data: proprioProfile } = await supabase!
                  .from('proprio_profiles')
                  .select('prenom, nom')
                  .eq('user_id', appointment.proprio_id)
                  .single();
                proprioData = { proprio_profiles: proprioProfile || {} };
              }
              
              return {
                ...appointment,
                equides,
                ...proprioData
              };
            })
          );
          console.log('✅ Prochains rendez-vous enrichis:', enrichedUpcoming);
          setProchainsRendezVous(enrichedUpcoming);
        }

        // 3. Récupérer les prochaines tournées
        // Essayer d'abord avec pro_id = proId (ID du profil pro)
        const { data: tours, error: toursError } = await supabase!
          .from('tours')
          .select(`
            id,
            name,
            date,
            appointments (id)
          `)
          .eq('pro_id', proId)
          .gte('date', now.toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5);

        console.log('📊 Résultat prochaines tournées (proId):');
        console.log('- Nombre trouvé:', tours?.length || 0);
        console.log('- Données brutes:', tours);
        console.log('- Erreur:', toursError);

        // Si pas de résultats avec proId, essayer avec user.id
        let toursData = tours;
        let toursErrorData = toursError;
        
        if (!toursData || toursData.length === 0) {
          console.log('🔄 Aucune tournée avec proId, essai avec user.id...');
          const { data: toursUser, error: toursUserError } = await supabase!
            .from('tours')
            .select(`
              id,
              name,
              date,
              appointments (id)
            `)
            .eq('pro_id', user.id)
            .gte('date', now.toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(5);
          
          console.log('📊 Résultat prochaines tournées (user.id):');
          console.log('- Nombre trouvé:', toursUser?.length || 0);
          console.log('- Données brutes:', toursUser);
          console.log('- Erreur:', toursUserError);
          
          toursData = toursUser;
          toursErrorData = toursUserError;
        }

        if (toursErrorData) {
          console.error('Erreur prochaines tournées:', toursErrorData);
          setProchainesTournees([]);
        } else {
          console.log('✅ Tournées récupérées:', toursData);
          setProchainesTournees(toursData || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Marquer l'onboarding comme terminé
  const handleOnboardingComplete = async () => {
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase!.auth.getUser();
      if (userError || !user) {
        console.error('Utilisateur non authentifié:', userError);
        return;
      }

      // Mettre à jour first_login_completed à true
      const { error: updateError } = await supabase!
        .from('pro_profiles')
        .update({ first_login_completed: true })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de l\'onboarding:', updateError);
      } else {
        console.log('✅ Onboarding marqué comme terminé');
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error);
    }
  };

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (dateString: string) => {
    const { time } = formatDateTimeForDisplay(dateString);
    return time;
  };


  if (loading) {
    return (
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Tableau de bord
          </h1>
          <p className="text-[#6b7280] text-lg">
            Vue d'ensemble de votre activité professionnelle
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} variant="elevated" className="min-h-[200px] animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center space-x-3 p-4 bg-[#f9fafb] rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Tableau de bord
        </h1>
        <p className="text-[#6b7280] text-lg">
          Vue d'ensemble de votre activité professionnelle
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Rendez-vous d'aujourd'hui */}
        <Card variant="elevated">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Rendez-vous d'aujourd'hui
            </h2>
          </div>
          
          <div className="space-y-3">
            {rendezVousAujourdhui.length > 0 ? (
              rendezVousAujourdhui.map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#f86f4d]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111827]">
                        {rdv.proprio_profiles?.prenom} {rdv.proprio_profiles?.nom}
                      </p>
                      <p className="text-sm text-[#6b7280]">
                        {rdv.equides && rdv.equides.length > 0 
                          ? rdv.equides.map(e => e.nom).join(', ') 
                          : 'Consultation'} • {rdv.comment.substring(0, 30)}{rdv.comment.length > 30 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#111827]">{formatTime(rdv.main_slot)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#9ca3af]" />
                </div>
                <h3 className="text-lg font-medium text-[#111827] mb-2">Aucun rendez-vous aujourd'hui</h3>
                <p className="text-[#6b7280] text-sm">Vos rendez-vous confirmés pour aujourd'hui apparaîtront ici</p>
              </div>
            )}
          </div>
        </Card>

        {/* Prochains rendez-vous */}
        <Card variant="elevated">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Prochains rendez-vous
            </h2>
          </div>
          
          <div className="space-y-3">
            {prochainsRendezVous.length > 0 ? (
              prochainsRendezVous.map((rdv) => {
                const { date, time } = formatDateTimeForDisplay(rdv.main_slot);
                return (
                  <div key={rdv.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#f86f4d]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#111827]">
                          {rdv.comment || 'Consultation'}
                          {rdv.proprio_profiles?.prenom && rdv.proprio_profiles?.nom && (
                            <span className="ml-2 text-sm font-normal text-[#6b7280]">
                              • {rdv.proprio_profiles.prenom} {rdv.proprio_profiles.nom}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-[#6b7280]">
                          {date} à {time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-[#9ca3af]" />
                </div>
                <h3 className="text-lg font-medium text-[#111827] mb-2">Aucun rendez-vous à venir</h3>
                <p className="text-[#6b7280] text-sm">Vos prochains rendez-vous confirmés apparaîtront ici</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Prochaines tournées */}
      <Card variant="elevated">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">
            Prochaines tournées
          </h2>
        </div>
        
        <div className="space-y-3">
          {prochainesTournees.length > 0 ? (
            prochainesTournees.map((tournee) => (
              <div key={tournee.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#f86f4d]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{tournee.name}</p>
                    <p className="text-sm text-[#6b7280]">
                      {tournee.appointments?.length || 0} rendez-vous
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[#111827]">{formatDate(tournee.date)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#9ca3af]" />
              </div>
              <h3 className="text-lg font-medium text-[#111827] mb-2">Aucune tournée prévue</h3>
              <p className="text-[#6b7280] text-sm">Vos tournées planifiées apparaîtront ici</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal d'onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
