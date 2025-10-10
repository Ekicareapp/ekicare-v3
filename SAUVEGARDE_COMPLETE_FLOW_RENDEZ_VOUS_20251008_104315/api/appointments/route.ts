import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Client service role pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromRequest(request: Request) {
  // Essayer d'abord le header Authorization
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        return { user, error: null };
      }
    } catch (error) {
      console.error('Error with Authorization header:', error);
    }
  }
  
  // Sinon, essayer les cookies
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-krxujhjpzmknxphjqfbx-auth-token');
  
  if (!authCookie) {
    return { user: null, error: 'No auth cookie or Authorization header' };
  }
  
  try {
    const sessionData = JSON.parse(authCookie.value);
    if (!sessionData.access_token) {
      return { user: null, error: 'No access token in cookie' };
    }
    
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
    return { user, error };
  } catch (error) {
    return { user: null, error: 'Invalid session data' };
  }
}

export async function POST(request: Request) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
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
    const { data: userData, error: userRoleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData || userData.role !== 'PROPRIETAIRE') {
      console.error('User role error:', userRoleError);
      console.error('User data:', userData);
      return NextResponse.json({ error: 'Only owners can create appointments' }, { status: 403 });
    }

    // Récupérer l'ID du profil pro avec le user_id
    const { data: proProfile, error: proProfileError } = await supabaseAdmin
      .from('pro_profiles')
      .select('id')
      .eq('user_id', pro_id)
      .single();
    
    if (proProfileError || !proProfile) {
      console.error('❌ Pro profile not found with user_id:', pro_id);
      return NextResponse.json({ error: 'Professionnel non trouvé' }, { status: 404 });
    }

    // Créer le rendez-vous avec les bons IDs
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert([
        {
          proprio_id: user.id, // ID de l'utilisateur connecté
          pro_id: proProfile.id, // ID du profil pro
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
    // Récupérer l'utilisateur connecté via les cookies
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ GET: Utilisateur authentifié:', user.id);

    // Récupérer le rôle de l'utilisateur
    const { data: userData, error: userRoleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData) {
      return NextResponse.json({ error: 'User role not found' }, { status: 404 });
    }

    console.log('✅ GET: Rôle utilisateur:', userData.role);

    // Construire la requête selon le rôle
    let query = supabaseAdmin
      .from('appointments')
      .select('*');

    // Filtrer selon le rôle - utiliser les IDs des profils
    if (userData.role === 'PROPRIETAIRE') {
      // Pour le proprio : récupérer les rendez-vous où il est proprio_id
      query = query.eq('proprio_id', user.id);
      console.log('🔍 GET: Filtrage par proprio_id:', user.id);
    } else if (userData.role === 'PRO') {
      // Pour le pro : récupérer l'ID de son profil pro
      const { data: proProfile, error: proProfileError } = await supabaseAdmin
        .from('pro_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (proProfileError || !proProfile) {
        return NextResponse.json({ error: 'Profil professionnel non trouvé' }, { status: 404 });
      }
      
      query = query.eq('pro_id', proProfile.id);
      console.log('🔍 GET: Filtrage par pro_id:', proProfile.id);
    } else {
      return NextResponse.json({ error: 'Invalid user role for appointments' }, { status: 403 });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ API: ${data?.length || 0} appointments récupérés pour l'utilisateur ${user.id} (rôle: ${userData.role})`);
    console.log('📋 API: Appointments bruts:', data?.map(a => ({ id: a.id, status: a.status, proprio_id: a.proprio_id, pro_id: a.pro_id })));

    // Enrichir avec les noms des équidés et les données des profils
    const enrichedData = await Promise.all(
      (data || []).map(async (appointment) => {
        // Récupérer les équidés
        const { data: equides, error: equidesError } = await supabaseAdmin
          .from('equides')
          .select('nom')
          .in('id', appointment.equide_ids);

        if (equidesError) {
          console.error('Error fetching equides:', equidesError);
        }

        // Récupérer les données selon le rôle
        let profileData = {};
        if (userData.role === 'PROPRIETAIRE') {
          // Pour les PROPRIO : récupérer les données du PRO
          const { data: proData } = await supabaseAdmin
            .from('pro_profiles')
            .select('prenom, nom, telephone, profession, ville_nom, photo_url')
            .eq('id', appointment.pro_id)
            .single();
          profileData = { pro_profiles: proData || {} };
        } else if (userData.role === 'PRO') {
          // Pour les PRO : récupérer les données du PROPRIO
          const { data: proprioData } = await supabaseAdmin
            .from('proprio_profiles')
            .select('prenom, nom, telephone')
            .eq('user_id', appointment.proprio_id)
            .single();
          profileData = { proprio_profiles: proprioData || {} };
        }

        return { 
          ...appointment, 
          equides: equides || [],
          ...profileData
        };
      })
    );

    console.log(`✅ GET: ${enrichedData.length} appointments récupérés pour l'utilisateur ${user.id}`);

    return NextResponse.json({ data: enrichedData });
  } catch (error: any) {
    console.error('Error in GET /api/appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}