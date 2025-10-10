import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client service role pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proId = searchParams.get('pro_id');
    const date = searchParams.get('date');

    if (!proId || !date) {
      return NextResponse.json({ error: 'pro_id et date requis' }, { status: 400 });
    }

    console.log('🔍 Recherche créneaux réservés:', { proId, date });

    // Récupérer TOUS les rendez-vous du pro (sans filtrage de date d'abord)
    const { data: allAppointments, error } = await supabaseAdmin
      .from('appointments')
      .select('id, main_slot, alternative_slots, status, created_at')
      .eq('pro_id', proId)
      .in('status', ['confirmed', 'pending', 'rescheduled']);

    if (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    console.log('📋 Tous les rendez-vous du pro:', allAppointments?.length || 0);

    if (!allAppointments || allAppointments.length === 0) {
      return NextResponse.json({ bookedSlots: [] });
    }

    // Afficher tous les rendez-vous pour debug
    allAppointments.forEach((apt, index) => {
      const aptDate = new Date(apt.main_slot).toISOString().split('T')[0];
      const aptTime = new Date(apt.main_slot);
      const timeString = `${aptTime.getUTCHours().toString().padStart(2, '0')}:${aptTime.getUTCMinutes().toString().padStart(2, '0')}`;
      console.log(`📅 RDV ${index + 1}:`, {
        id: apt.id,
        date: aptDate,
        time: timeString,
        status: apt.status,
        created: apt.created_at
      });
    });

    // Filtrer par date
    const appointmentsForDate = allAppointments.filter(apt => {
      const aptDate = new Date(apt.main_slot).toISOString().split('T')[0];
      return aptDate === date;
    });

    console.log(`📅 Rendez-vous pour ${date}:`, appointmentsForDate.length);

    // Extraire les créneaux
    const bookedSlots: string[] = [];

    appointmentsForDate.forEach((apt, index) => {
      // Créneau principal
      const mainSlot = new Date(apt.main_slot);
      const time = `${mainSlot.getUTCHours().toString().padStart(2, '0')}:${mainSlot.getUTCMinutes().toString().padStart(2, '0')}`;
      bookedSlots.push(time);
      console.log(`⏰ Créneau principal ${index + 1}:`, time);

      // Créneaux alternatifs
      if (apt.alternative_slots && Array.isArray(apt.alternative_slots)) {
        apt.alternative_slots.forEach((slot: string, altIndex: number) => {
          const altSlot = new Date(slot);
          const altTime = `${altSlot.getUTCHours().toString().padStart(2, '0')}:${altSlot.getUTCMinutes().toString().padStart(2, '0')}`;
          bookedSlots.push(altTime);
          console.log(`⏰ Créneau alternatif ${index + 1}.${altIndex + 1}:`, altTime);
        });
      }
    });

    const uniqueSlots = [...new Set(bookedSlots)];
    console.log('🎯 Créneaux réservés finaux:', uniqueSlots);

    return NextResponse.json({ 
      bookedSlots: uniqueSlots,
      totalAppointments: allAppointments.length,
      appointmentsForDate: appointmentsForDate.length
    });

  } catch (error) {
    console.error('Error in GET /api/professional-booked-slots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
