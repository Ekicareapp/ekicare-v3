import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date().toISOString();

    // Mettre à jour les rendez-vous passés qui sont confirmés ou replanifiés
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed', updated_at: now })
      .lt('main_slot', now) // Where main_slot is in the past
      .in('status', ['confirmed', 'rescheduled']) // Only update confirmed or rescheduled appointments
      .select();

    if (error) {
      console.error('Error updating past appointments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Updated ${data?.length || 0} past appointments to 'completed'.`);
    return NextResponse.json({ 
      message: `Updated ${data?.length || 0} past appointments to 'completed'.`,
      data: data || []
    });
  } catch (error: any) {
    console.error('Unhandled error in update-status API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}