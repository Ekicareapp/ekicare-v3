import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client service role pour exécuter la fonction
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('🔄 Déclenchement de la mise à jour automatique des statuts...');

    // Exécuter la fonction de mise à jour
    const { data, error } = await supabaseAdmin.rpc('manual_update_appointment_statuses');

    if (error) {
      console.error('❌ Erreur lors de la mise à jour des statuts:', error);
      return NextResponse.json({ 
        error: 'Erreur lors de la mise à jour des statuts',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Mise à jour des statuts terminée:', data);

    return NextResponse.json({
      success: true,
      message: 'Statuts des rendez-vous mis à jour avec succès',
      data: data
    });

  } catch (error: any) {
    console.error('❌ Erreur dans POST /api/appointments/update-statuses:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Vérifier combien de rendez-vous sont en attente de mise à jour
    const { data: pendingAppointments, error } = await supabaseAdmin
      .from('appointments')
      .select('id, main_slot, status')
      .in('status', ['confirmed', 'pending', 'rescheduled'])
      .lt('main_slot', new Date().toISOString());

    if (error) {
      console.error('❌ Erreur lors de la vérification des rendez-vous en attente:', error);
      return NextResponse.json({ 
        error: 'Erreur lors de la vérification',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`📊 ${pendingAppointments?.length || 0} rendez-vous en attente de mise à jour`);

    return NextResponse.json({
      success: true,
      pending_count: pendingAppointments?.length || 0,
      pending_appointments: pendingAppointments || [],
      current_time: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur dans GET /api/appointments/update-statuses:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
