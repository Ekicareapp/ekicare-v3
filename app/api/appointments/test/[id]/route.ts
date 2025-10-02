import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Version de test pour les actions sur les appointments
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  console.log('🧪 TEST MODE: Mise à jour d\'appointment sans auth stricte');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id } = params;
    const body = await request.json();
    
    console.log('📋 TEST: Mise à jour appointment', id, 'avec données:', body);

    // Construire les données de mise à jour
    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.main_slot) {
      updateData.main_slot = body.main_slot;
    }

    if (body.alternative_slots) {
      updateData.alternative_slots = body.alternative_slots;
    }

    if (body.comment) {
      updateData.comment = body.comment;
    }

    if (body.compte_rendu) {
      updateData.compte_rendu = body.compte_rendu;
    }

    // Mettre à jour le rendez-vous
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ TEST: Error updating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ TEST: Appointment mis à jour avec succès');
    return NextResponse.json({ data });

  } catch (error: any) {
    console.error('❌ TEST: Error in PATCH /api/appointments/test/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('🧪 TEST MODE: Récupération d\'appointment sans auth stricte');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id } = params;

    // Récupérer le rendez-vous
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
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
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

    console.log('✅ TEST: Appointment récupéré avec succès');
    return NextResponse.json({ data: enrichedAppointment });

  } catch (error: any) {
    console.error('❌ TEST: Error in GET /api/appointments/test/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
