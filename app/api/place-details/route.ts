import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');
    
    if (!placeId) {
      return NextResponse.json({ error: 'Paramètre place_id manquant' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY manquante dans les variables d\'environnement');
      return NextResponse.json({ error: 'Configuration API manquante' }, { status: 500 });
    }

    // Construire l'URL vers Google Places Details
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry/location,formatted_address,name&language=fr&key=${apiKey}`;
    
    console.log('🔍 Appel Google Place Details via proxy:', { placeId, url: googleUrl.replace(apiKey, '***') });
    
    // Faire l'appel vers Google Places
    const response = await fetch(googleUrl);
    
    if (!response.ok) {
      console.error('❌ Erreur Google Place Details:', { status: response.status, statusText: response.statusText });
      return NextResponse.json({ error: 'Erreur lors de l\'appel à Google Places' }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('📡 Réponse Google Place Details:', { status: data.status, hasResult: !!data.result });
    
    // Retourner directement la réponse de Google
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Erreur dans /api/place-details:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
