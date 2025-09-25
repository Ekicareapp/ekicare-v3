import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    
    if (!input) {
      return NextResponse.json({ error: 'Paramètre input manquant' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY manquante dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration API manquante' }, { status: 500 });
    }

    // Construire l'URL vers Google Places Autocomplete
    const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&language=fr&components=country:fr&key=${apiKey}`;
    
    console.log('🔍 Appel Google Places via proxy:', { input, url: googleUrl.replace(apiKey, '***') });
    
    // Faire l'appel vers Google Places
    const response = await fetch(googleUrl);
    
    if (!response.ok) {
      console.error('❌ Erreur Google Places:', { status: response.status, statusText: response.statusText });
      return NextResponse.json({ error: 'Erreur lors de l\'appel à Google Places' }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('📡 Réponse Google Places:', { status: data.status, predictionsCount: data.predictions?.length || 0 });
    
    // Retourner directement la réponse de Google
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur dans /api/places:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
