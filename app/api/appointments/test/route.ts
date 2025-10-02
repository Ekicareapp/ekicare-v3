import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Version de test qui contourne l'authentification stricte pour les tests locaux
export async function POST(request: Request) {
  console.log('🧪 TEST MODE: Création d\'appointment sans auth stricte');
  
  try {
    // Utiliser le service role pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    console.log('📋 TEST: Données reçues:', body);

    // Validation des champs obligatoires
    if (!body.pro_id || !body.equide_ids || body.equide_ids.length === 0 || !body.main_slot || !body.comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: pro_id, equide_ids, main_slot, comment' 
      }, { status: 400 });
    }

    // Pour les tests, utiliser un proprio_id par défaut
    // En production, ceci devrait être récupéré depuis l'authentification
    const testProprioId = 'ffcd5ce8-7003-4a00-8c44-88b5f0cc64a0'; // Propriétaire existant pour les tests
    
    console.log('🧪 TEST: Utilisation du proprio_id de test:', testProprioId);

    // Créer le rendez-vous
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          proprio_id: testProprioId,
          pro_id: body.pro_id,
          equide_ids: body.equide_ids,
          main_slot: body.main_slot,
          alternative_slots: body.alternative_slots || [],
          comment: body.comment,
          duration_minutes: body.duration_minutes || 60,
          status: 'pending', // Statut initial
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ TEST: Error creating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ TEST: Appointment créé avec succès:', data.id);
    return NextResponse.json({ data }, { status: 201 });

  } catch (error: any) {
    console.error('❌ TEST: Error in POST /api/appointments/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  console.log('🧪 TEST MODE: Récupération des appointments sans auth stricte');
  
  try {
    // Utiliser le service role pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pour les tests, récupérer tous les appointments
    const { data, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ TEST: Error fetching appointments:', error);
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

    console.log(`✅ TEST: ${enrichedData.length} appointments récupérés`);
    return NextResponse.json({ data: enrichedData });

  } catch (error: any) {
    console.error('❌ TEST: Error in GET /api/appointments/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
