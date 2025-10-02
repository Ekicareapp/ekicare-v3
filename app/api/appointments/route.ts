import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function getUserFromRequest(request: Request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-krxujhjpzmknxphjqfbx-auth-token');
  
  if (!authCookie) {
    return { user: null, error: 'No auth cookie', supabase: null };
  }
  
  try {
    const sessionData = JSON.parse(authCookie.value);
    if (!sessionData.access_token) {
      return { user: null, error: 'No access token', supabase: null };
    }
    
    // Créer un client Supabase avec le token d'accès
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.access_token}`
          }
        }
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error, supabase };
  } catch (error) {
    return { user: null, error: 'Invalid session data', supabase: null };
  }
}

export async function POST(request: Request) {
  try {
    const { user, error: userError, supabase } = await getUserFromRequest(request);
    if (userError || !user || !supabase) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pro_id, equide_ids, main_slot, alternative_slots, comment, duration_minutes } = await request.json();

    // Validation des champs obligatoires
    if (!pro_id || !equide_ids || equide_ids.length === 0 || !main_slot || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: pro_id, equide_ids, main_slot, comment' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur est un propriétaire
    const { data: userData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData || userData.role !== 'PROPRIETAIRE') {
      console.error('User role error:', userRoleError);
      console.error('User data:', userData);
      return NextResponse.json({ error: 'Only owners can create appointments' }, { status: 403 });
    }

    // Créer le rendez-vous
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          proprio_id: user.id,
          pro_id,
          equide_ids,
          main_slot,
          alternative_slots: alternative_slots || [],
          comment,
          duration_minutes: duration_minutes || null,
          status: 'pending', // Statut initial
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { user, error: userError, supabase } = await getUserFromRequest(request);
    if (userError || !user || !supabase) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer le rôle de l'utilisateur
    const { data: userData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData) {
      return NextResponse.json({ error: 'User role not found' }, { status: 404 });
    }

    // Construire la requête selon le rôle
    let query = supabase
      .from('appointments')
      .select(`
        *,
        proprio_profiles!inner (
          prenom, nom, telephone
        ),
        pro_profiles!inner (
          prenom, nom, telephone, profession, ville_nom, photo_url, average_consultation_duration
        )
      `);

    // Filtrer selon le rôle (RLS Supabase s'occupe de la sécurité)
    if (userData.role === 'PROPRIETAIRE') {
      query = query.eq('proprio_id', user.id);
    } else if (userData.role === 'PRO') {
      query = query.eq('pro_id', user.id);
    } else {
      return NextResponse.json({ error: 'Invalid user role for appointments' }, { status: 403 });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrichir avec les noms des équidés
    const enrichedData = await Promise.all(
      (data || []).map(async (appointment) => {
        const { data: equides, error: equidesError } = await supabase
          .from('equides')
          .select('nom')
          .in('id', appointment.equide_ids);

        if (equidesError) {
          console.error('Error fetching equides:', equidesError);
          return { ...appointment, equides: [] };
        }

        return { ...appointment, equides: equides || [] };
      })
    );

    return NextResponse.json({ data: enrichedData });
  } catch (error: any) {
    console.error('Error in GET /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}