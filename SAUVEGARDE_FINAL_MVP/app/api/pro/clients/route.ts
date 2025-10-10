import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Utiliser le client Supabase normal pour l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('🔍 Debug auth - userError:', userError);
      console.log('🔍 Debug auth - user:', user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un PRO
    const { data: userData, error: userRoleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData || userData.role !== 'PRO') {
      return NextResponse.json({ error: 'Access denied. PRO role required.' }, { status: 403 });
    }

    // Récupérer l'ID du profil PRO
    const { data: proProfile, error: proError } = await supabaseAdmin
      .from('pro_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (proError || !proProfile) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 });
    }

    // D'abord, récupérer les IDs des propriétaires qui ont au moins un RDV confirmé avec ce PRO
    const { data: confirmedAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('proprio_id')
      .eq('pro_id', proProfile.id)
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('Error fetching confirmed appointments:', appointmentsError);
      return NextResponse.json({ error: 'Failed to fetch confirmed appointments' }, { status: 500 });
    }

    // Extraire les IDs uniques des propriétaires
    const uniqueProprioIds = [...new Set(confirmedAppointments.map(apt => apt.proprio_id))];

    if (uniqueProprioIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Récupérer les profils des propriétaires (utiliser user_id au lieu de profile_id)
    const { data: clients, error: clientsError } = await supabaseAdmin
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
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Pour chaque client, récupérer les statistiques des rendez-vous
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const { data: appointments, error: appointmentsError } = await supabaseAdmin
          .from('appointments')
          .select('id, main_slot, status, created_at')
          .eq('pro_id', proProfile.id)
          .eq('proprio_id', client.user_id) // Utiliser user_id pour la jointure
          .order('main_slot', { ascending: false });

        if (appointmentsError) {
          console.error('Error fetching appointments for client:', appointmentsError);
          return {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            photo: null, // Pas de photo pour les proprios
            telephone: client.telephone,
            adresse: client.adresse,
            totalRendezVous: 0,
            derniereVisite: null,
            dateAjout: client.created_at
          };
        }

        const totalRendezVous = appointments.length;
        const rendezVousTermines = appointments.filter(rdv => rdv.status === 'completed');
        const derniereVisite = rendezVousTermines.length > 0
          ? rendezVousTermines[0].main_slot
          : null;

        return {
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          photo: null, // Pas de photo pour les proprios
          telephone: client.telephone,
          adresse: client.adresse,
          totalRendezVous,
          derniereVisite,
          dateAjout: client.created_at
        };
      })
    );

    return NextResponse.json({ data: clientsWithStats });

  } catch (error) {
    console.error('Error in GET /api/pro/clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}