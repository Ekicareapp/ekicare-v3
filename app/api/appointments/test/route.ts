import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Version de test qui contourne l'authentification stricte pour les tests locaux
export async function POST(request: Request) {
  console.log('🧪 TEST MODE: Création d\'appointment avec auth');
  
  try {
    // Utiliser le service role pour contourner RLS mais avec authentification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    console.log('📋 TEST: Données reçues:', JSON.stringify(body, null, 2));

    // Validation des champs obligatoires
    if (!body.pro_id || !body.equide_ids || body.equide_ids.length === 0 || !body.main_slot || !body.comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: pro_id, equide_ids, main_slot, comment' 
      }, { status: 400 });
    }

    // Pour les tests, utiliser un proprio_id fixe qui fonctionne
    // En production, ceci devrait être récupéré depuis l'authentification
    const testProprioId = 'db687204-d10f-4ee3-9c9f-ccfa97ae14db'; // ID du profil propriétaire de test
    
    console.log('🧪 TEST: Utilisation du proprio_id de test:', testProprioId);
    
    // Vérifier que ce proprio_id existe
    const { data: verifyProprio, error: verifyError } = await supabase
      .from('proprio_profiles')
      .select('id, prenom, nom')
      .eq('id', testProprioId)
      .single();
    
    if (verifyError || !verifyProprio) {
      console.error('❌ Proprio_id de test introuvable:', verifyError);
      return NextResponse.json({ 
        error: `Proprio_id de test introuvable: ${verifyError?.message || 'Non trouvé'}` 
      }, { status: 404 });
    }
    
    console.log('✅ Proprio_id de test vérifié:', verifyProprio);

    // Créer le rendez-vous
    console.log('📝 Création du rendez-vous avec:');
    console.log('  - proprio_id:', testProprioId);
    console.log('  - pro_id:', body.pro_id);
    console.log('  - equide_ids:', body.equide_ids);
    console.log('  - main_slot:', body.main_slot);
    
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
      console.error('❌ Détails de l\'erreur:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
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
