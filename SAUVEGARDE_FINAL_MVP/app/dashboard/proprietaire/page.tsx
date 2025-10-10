'use client';

import { useState, useEffect } from 'react';
import Card from './components/Card';
import Button from './components/Button';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTimeForDisplay } from '@/lib/dateUtils';
import { Calendar, Users, Clock } from 'lucide-react';

interface Appointment {
  id: string;
  main_slot: string;
  comment: string;
  status: string;
  equide_ids: string[];
  pro_id: string;
  pro_profiles?: {
    prenom: string;
    nom: string;
  };
  equides?: Array<{ nom: string }>;
}

interface Equide {
  id: string;
  nom: string;
  age: number;
  sexe: string;
  race: string;
  couleur: string;
}

export default function DashboardPage() {
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [equides, setEquides] = useState<Equide[]>([]);
  const [loading, setLoading] = useState(true);

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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Utilisateur non authentifié:', userError);
          setLoading(false);
          return;
        }

        console.log('👤 Utilisateur connecté:', user.id);

        // 1. Récupérer les rendez-vous à venir (confirmés et annulés futurs)
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, main_slot, comment, status, equide_ids, pro_id')
          .eq('proprio_id', user.id)
          .gte('main_slot', new Date().toISOString())
          .in('status', ['confirmed', 'canceled'])
          .order('main_slot', { ascending: true })
          .limit(5);

        console.log('📅 Rendez-vous à venir:', appointmentsData?.length || 0);

        if (appointmentsError) {
          console.error('Erreur rendez-vous:', appointmentsError);
          setUpcomingAppointments([]);
        } else {
          // Enrichir avec les données du pro et des équidés
          const enrichedAppointments = await Promise.all(
            (appointmentsData || []).map(async (appointment) => {
              let proData = {};
              let equides = [];
              
              // Récupérer les données du pro
              if (appointment.pro_id) {
                const { data: proProfile } = await supabase
                  .from('pro_profiles')
                  .select('prenom, nom')
                  .eq('user_id', appointment.pro_id)
                  .single();
                proData = { pro_profiles: proProfile || {} };
              }
              
              // Récupérer les équidés
              if (appointment.equide_ids && appointment.equide_ids.length > 0) {
                const { data: equidesData } = await supabase
                  .from('equides')
                  .select('nom')
                  .in('id', appointment.equide_ids);
                equides = equidesData || [];
              }
              
              return {
                ...appointment,
                ...proData,
                equides
              };
            })
          );
          
          console.log('✅ Rendez-vous enrichis:', enrichedAppointments);
          setUpcomingAppointments(enrichedAppointments);
        }

        // 2. Récupérer les équidés du propriétaire
        const { data: equidesData, error: equidesError } = await supabase
          .from('equides')
          .select('id, nom, age, sexe, race, couleur')
          .eq('proprio_id', user.id)
          .order('nom', { ascending: true })
          .limit(3);

        console.log('🐴 Équidés trouvés:', equidesData?.length || 0);

        if (equidesError) {
          console.error('Erreur équidés:', equidesError);
          setEquides([]);
        } else {
          console.log('✅ Équidés récupérés:', equidesData);
          setEquides(equidesData || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Tableau de bord
        </h1>
        <p className="text-[#6b7280] text-lg">
          Bienvenue sur votre espace propriétaire EkiCare
        </p>
      </div>


      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Appointments */}
        <Card variant="elevated">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">
              Rendez-vous à venir
            </h2>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6b7280]">Chargement...</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((rdv) => {
                const { date, time } = formatDateTimeForDisplay(rdv.main_slot);
                const equideNames = rdv.equides && rdv.equides.length > 0 
                  ? rdv.equides.map(e => e.nom).join(', ')
                  : 'Consultation';
                const proName = rdv.pro_profiles?.prenom && rdv.pro_profiles?.nom
                  ? `${rdv.pro_profiles.prenom} ${rdv.pro_profiles.nom}`
                  : 'Professionnel';
                
                const isCanceled = rdv.status === 'canceled';
                
                return (
                  <div key={rdv.id} className={`flex items-center justify-between p-4 rounded-lg ${
                    isCanceled 
                      ? 'bg-gray-100 border border-gray-200' 
                      : 'bg-[#f9fafb]'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCanceled 
                          ? 'bg-gray-200' 
                          : 'bg-[#f86f4d10]'
                      }`}>
                        <Calendar className={`w-5 h-5 ${
                          isCanceled 
                            ? 'text-gray-400' 
                            : 'text-[#f86f4d]'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isCanceled 
                            ? 'text-gray-500 line-through' 
                            : 'text-[#111827]'
                        }`}>
                          {rdv.comment || 'Consultation'} - {equideNames}
                        </p>
                        <p className={`text-sm ${
                          isCanceled 
                            ? 'text-gray-400' 
                            : 'text-[#6b7280]'
                        }`}>
                          {date}
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
                <p className="text-[#6b7280] text-sm">Vos prochains rendez-vous apparaîtront ici</p>
              </div>
            )}
          </div>
        </Card>

        {/* Mes équidés */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#111827]">Mes équidés</h2>
            <a href="/dashboard/proprietaire/equides">
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </a>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#f86f4d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6b7280]">Chargement...</p>
              </div>
            ) : equides.length > 0 ? (
              equides.map((equide) => (
                <div key={equide.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#f86f4d10] rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#f86f4d]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111827]">{equide.nom}</p>
                      <p className="text-sm text-[#6b7280]">
                        {equide.age} ans • {equide.sexe} • {equide.race}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#6b7280]">{equide.couleur}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#9ca3af]" />
                </div>
                <h3 className="text-lg font-medium text-[#111827] mb-2">Aucun équidé</h3>
                <p className="text-[#6b7280] text-sm">Ajoutez vos premiers équidés pour commencer</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
