import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Client service role pour bypasser RLS
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer le rôle de l'utilisateur
    const { data: userData, error: userRoleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Récupérer le rendez-vous
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Vérifier l'accès selon le rôle
    let hasAccess = false;
    if (userData.role === 'PROPRIETAIRE' && appointment.proprio_id === user.id) {
      hasAccess = true;
    } else if (userData.role === 'PRO') {
      const { data: proProfile } = await supabaseAdmin
        .from('pro_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (proProfile && appointment.pro_id === proProfile.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to access this appointment' }, { status: 403 });
    }

    // Enrichir avec les équidés
    const { data: equides } = await supabaseAdmin
      .from('equides')
      .select('nom')
      .in('id', appointment.equide_ids);

    // Enrichir avec les profils
    const { data: proProfile } = await supabaseAdmin
      .from('pro_profiles')
      .select('prenom, nom, telephone, profession, ville_nom, photo_url')
      .eq('id', appointment.pro_id)
      .single();

    const { data: proprioProfile } = await supabaseAdmin
      .from('proprio_profiles')
      .select('prenom, nom, telephone')
      .eq('user_id', appointment.proprio_id)
      .single();

    const enrichedAppointment = {
      ...appointment,
      equides: equides || [],
      pro_profiles: proProfile || {},
      proprio_profiles: proprioProfile || {}
    };

    return NextResponse.json({ data: enrichedAppointment });
  } catch (error: any) {
    console.error('Error in GET /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Récupérer le rendez-vous actuel
    const { data: currentAppointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('proprio_id, pro_id, status, main_slot')
      .eq('id', id)
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Récupérer le rôle de l'utilisateur
    const { data: userData, error: userRoleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier les permissions
    let isProprio = false;
    let isPro = false;

    if (userData.role === 'PROPRIETAIRE' && currentAppointment.proprio_id === user.id) {
      isProprio = true;
    } else if (userData.role === 'PRO') {
      const { data: proProfile } = await supabaseAdmin
        .from('pro_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (proProfile && currentAppointment.pro_id === proProfile.id) {
        isPro = true;
      }
    }

    if (!isProprio && !isPro) {
      return NextResponse.json({ error: 'Unauthorized to update this appointment' }, { status: 403 });
    }

    // Construire les données de mise à jour
    const updateData: any = {};

    // Gestion des statuts selon les règles métier (statuts alignés avec frontend)
    if (body.status) {
      const { status } = body;
      
      if (isPro) {
        // Le PRO peut :
        // - Accepter : pending/rescheduled -> confirmed
        // - Refuser : pending -> rejected
        // - Replanifier : pending/confirmed -> rescheduled
        // - Annuler : confirmed -> canceled
        if (status === 'confirmed' && ['pending', 'rescheduled'].includes(currentAppointment.status)) {
          updateData.status = status;
        } else if (status === 'rejected' && currentAppointment.status === 'pending') {
          updateData.status = status;
        } else if (status === 'rescheduled' && ['pending', 'confirmed'].includes(currentAppointment.status)) {
          updateData.status = status;
        } else if (status === 'canceled' && currentAppointment.status === 'confirmed') {
          updateData.status = status;
        } else {
          return NextResponse.json({ 
            error: `Pro cannot change status from ${currentAppointment.status} to ${status}` 
          }, { status: 403 });
        }
      } else if (isProprio) {
        // Le PROPRIO peut :
        // - Accepter une replanification du PRO : rescheduled -> confirmed
        // - Replanifier : pending/confirmed -> pending (demande de replanification)
        // - Annuler : pending/rescheduled -> rejected, confirmed -> cancelled_by_proprio
        if (status === 'confirmed' && currentAppointment.status === 'rescheduled') {
          updateData.status = status;
        } else if (status === 'pending' && ['pending', 'confirmed'].includes(currentAppointment.status)) {
          // Quand le PROPRIO replanifie, ça va en pending (en attente de réponse du PRO)
          updateData.status = status;
        } else if (status === 'rejected' && ['pending', 'rescheduled'].includes(currentAppointment.status)) {
          updateData.status = status;
        } else if (status === 'canceled' && currentAppointment.status === 'confirmed') {
          // Pour les annulations de rendez-vous confirmés, utiliser canceled
          updateData.status = status;
        } else {
          return NextResponse.json({ 
            error: `Proprio cannot change status from ${currentAppointment.status} to ${status}` 
          }, { status: 403 });
        }
      }
    }

    // Gestion du créneau principal (lors de replanification)
    if (body.main_slot && (updateData.status === 'rescheduled' || updateData.status === 'pending')) {
      updateData.main_slot = body.main_slot;
    }

    // Gestion des créneaux alternatifs
    if (body.alternative_slots !== undefined && (updateData.status === 'rescheduled' || updateData.status === 'pending')) {
      updateData.alternative_slots = body.alternative_slots;
    }

    // Gestion du commentaire (PROPRIO uniquement)
    if (body.comment && isProprio) {
      updateData.comment = body.comment;
    }

    // Gestion du compte-rendu (PRO uniquement, pour rendez-vous terminés)
    if (body.compte_rendu !== undefined && isPro) {
      updateData.compte_rendu = body.compte_rendu;
      updateData.compte_rendu_updated_at = new Date().toISOString();
    }

    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No data to update' }, { status: 200 });
    }

    // Mettre à jour le rendez-vous
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Appointment ${id} updated:`, updateData);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur peut supprimer ce rendez-vous (seulement proprio en statut pending)
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('proprio_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.proprio_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this appointment' }, { status: 403 });
    }

    if (appointment.status !== 'pending') {
      return NextResponse.json({ error: 'Can only delete pending appointments' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Appointment ${id} deleted successfully`);
    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}