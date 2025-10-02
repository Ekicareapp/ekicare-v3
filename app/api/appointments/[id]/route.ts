import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function getUserFromRequest(request: Request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-krxujhjpzmknxphjqfbx-auth-token');
  
  if (!authCookie) {
    return { user: null, error: 'No auth cookie' };
  }
  
  try {
    const sessionData = JSON.parse(authCookie.value);
    if (!sessionData.access_token) {
      return { user: null, error: 'No access token' };
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
    return { user, error };
  } catch (error) {
    return { user: null, error: 'Invalid session data' };
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { id } = params;

    // Récupérer le rendez-vous avec vérification d'accès
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        proprio_profiles!inner (
          prenom, nom, telephone
        ),
        pro_profiles!inner (
          prenom, nom, telephone, profession, ville_nom, photo_url, average_consultation_duration
        )
      `)
      .eq('id', id)
      .or(`proprio_id.eq.${user.id},pro_id.eq.${user.id}`) // Vérifier que l'utilisateur a accès
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found or unauthorized' }, { status: 404 });
    }

    // Enrichir avec les équidés
    const { data: equides, error: equidesError } = await supabase
      .from('equides')
      .select('nom')
      .in('id', appointment.equide_ids);

    const enrichedAppointment = {
      ...appointment,
      equides: equidesError ? [] : (equides || [])
    };

    return NextResponse.json({ data: enrichedAppointment });
  } catch (error: any) {
    console.error('Error in GET /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { id } = params;
    const { status, main_slot, alternative_slots, comment, compte_rendu } = await request.json();

    // Récupérer le rendez-vous actuel pour vérifier les permissions
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('proprio_id, pro_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a le droit de modifier ce rendez-vous
    const isProprio = currentAppointment.proprio_id === user.id;
    const isPro = currentAppointment.pro_id === user.id;

    if (!isProprio && !isPro) {
      return NextResponse.json({ error: 'Unauthorized to update this appointment' }, { status: 403 });
    }

    // Construire les données de mise à jour
    const updateData: any = {};

    // Gestion des statuts selon les règles métier
    if (status) {
      if (isPro) {
        // Le pro peut accepter, refuser ou replanifier
        if (['confirmed', 'rejected', 'rescheduled'].includes(status)) {
          updateData.status = status;
        } else {
          return NextResponse.json({ error: 'Pro cannot set this status' }, { status: 403 });
        }
      } else if (isProprio) {
        // Le propriétaire peut accepter ou refuser une replanification, ou proposer une replanification
        if (currentAppointment.status === 'rescheduled' && ['confirmed', 'rejected'].includes(status)) {
          updateData.status = status;
        } else if (status === 'rescheduled') {
          // Le propriétaire peut proposer une replanification
          updateData.status = status;
        } else {
          return NextResponse.json({ error: 'Proprio cannot set this status' }, { status: 403 });
        }
      }
    }

    // Gestion des autres champs
    if (main_slot && (isPro || (isProprio && currentAppointment.status === 'rescheduled'))) {
      updateData.main_slot = main_slot;
    }

    if (alternative_slots && (isPro || (isProprio && currentAppointment.status === 'rescheduled'))) {
      updateData.alternative_slots = alternative_slots;
    }

    if (comment && isProprio) {
      updateData.comment = comment;
    }

    if (compte_rendu && isPro && currentAppointment.status === 'completed') {
      updateData.compte_rendu = compte_rendu;
    }

    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No relevant data to update' }, { status: 200 });
    }

    // Mettre à jour le rendez-vous
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PATCH /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: userError } = await getUserFromRequest(request);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { id } = params;

    // Vérifier que l'utilisateur peut supprimer ce rendez-vous (seulement en statut pending)
    const { data: appointment, error: fetchError } = await supabase
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

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/appointments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}