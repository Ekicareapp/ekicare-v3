import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client service role pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('🔄 Mise à jour automatique des statuts des rendez-vous');
    
    const now = new Date().toISOString();
    
    // Mettre à jour les rendez-vous confirmés dont la date est passée
    const { data: updatedAppointments, error } = await supabaseAdmin
      .from('appointments')
      .update({ 
        status: 'completed',
        updated_at: now
      })
      .eq('status', 'confirmed')
      .lt('main_slot', now)
      .select('id, main_slot');

    if (error) {
      console.error('❌ Erreur lors de la mise à jour des statuts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (updatedAppointments && updatedAppointments.length > 0) {
      console.log(`✅ ${updatedAppointments.length} rendez-vous mis à jour vers "completed"`);
      console.log('Rendez-vous mis à jour:', updatedAppointments.map(a => ({ id: a.id, date: a.main_slot })));
    } else {
      console.log('ℹ️ Aucun rendez-vous à mettre à jour');
    }

    return NextResponse.json({ 
      message: 'Statuts mis à jour avec succès',
      updated_count: updatedAppointments?.length || 0
    });
  } catch (error: any) {
    console.error('❌ Erreur dans POST /api/appointments/update-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}