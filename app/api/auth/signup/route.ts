import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { sendWelcomeEmail } from '@/lib/mail'

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 })
  }
  try {
    const form = await request.formData()
    // Extraction des champs texte
    let email = form.get('email')?.toString() || ''
    let password = form.get('password')?.toString() || ''
    let role = form.get('role')?.toString() || ''
    let prenom = form.get('prenom')?.toString() || ''
    let nom = form.get('nom')?.toString() || ''
    let telephone = form.get('telephone')?.toString() || ''
    let adresse = form.get('adresse')?.toString() || ''
    let profession = form.get('profession')?.toString() || ''
    let ville_nom = form.get('ville_nom')?.toString() || ''
    let ville_lat = form.get('ville_lat')?.toString() || ''
    let ville_lng = form.get('ville_lng')?.toString() || ''
    let rayon_km = form.get('rayon_km')?.toString() || ''
    let siret = form.get('siret')?.toString() || ''
    // Fichiers
    const photo = form.get('photo') as File | null
    const justificatif = form.get('justificatif') as File | null

    // Normalisation stricte du rôle
    if (role && typeof role === 'string') {
      const r = role.trim().toLowerCase()
      if (
        r === 'pro' ||
        r === 'professionnel' ||
        r === 'professionnelle' ||
        r === 'profesionnel' ||
        r === 'profesionnelle' ||
        r === 'professionnel.' ||
        r === 'professionnelle.'
      ) {
        role = 'PRO'
      } else if (r === 'proprietaire' || r === 'propriétaire') {
        role = 'PROPRIETAIRE'
      }
    }
    if (role !== 'PROPRIETAIRE' && role !== 'PRO') {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, mot de passe et rôle sont obligatoires.' },
        { status: 400 }
      )
    }
    // Champs obligatoires selon le rôle
    if (role === 'PRO') {
      const required = [
        prenom,
        nom,
        telephone,
        profession,
        siret,
        ville_nom,
        ville_lat,
        ville_lng,
        rayon_km,
      ]
      if (required.some((v) => !v)) {
        return NextResponse.json(
          { error: 'Tous les champs sont obligatoires pour un professionnel.' },
          { status: 400 }
        )
      }
      // Validation métier
      const validProfessions = [
        'Vétérinaire équin',
        'Ostéopathe équin',
        'Dentiste équin',
        'Maréchal-ferrant',
        'Shiatsu équin',
        'Naturopathe équin',
        'Masseur équin',
        'Comportementaliste équin',
        'Kinésithérapeute équin',
      ]
      if (!validProfessions.includes(profession)) {
        return NextResponse.json({ error: 'Profession invalide' }, { status: 400 })
      }
      if (!justificatif) {
        return NextResponse.json({ error: 'Justificatif professionnel obligatoire.' }, { status: 400 })
      }
    }

    if (role === 'PROPRIETAIRE') {
      // Validation spécifique pour les propriétaires
      if (!prenom || prenom.trim() === '') {
        return NextResponse.json(
          { error: 'Le prénom est obligatoire pour un propriétaire.' },
          { status: 400 }
        )
      }
      if (!nom || nom.trim() === '') {
        return NextResponse.json(
          { error: 'Le nom est obligatoire pour un propriétaire.' },
          { status: 400 }
        )
      }
      // Validation des champs optionnels
      if (telephone && telephone.trim() !== '' && !/^[0-9+\-\s()]{10,}$/.test(telephone)) {
        return NextResponse.json(
          { error: 'Le format du téléphone n\'est pas valide.' },
          { status: 400 }
        )
      }
    }
    // Création utilisateur Auth
    // Log signup attempt
    console.log('Signup attempt:', { email, password })
    const { data, error } = await supabase.auth.signUp({ email, password })
    console.log('Supabase response:', { data, error })
    if (error) {
      // Gestion explicite des erreurs connues
      if (error.message && error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'User already registered' }, { status: 409 })
      }
      if (error.message && error.message.toLowerCase().includes('at least 6 characters')) {
        return NextResponse.json(
          { error: 'Password should be at least 6 characters' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Erreur inconnue lors de la création du compte' },
        { status: 400 }
      )
    }
    if (!data || !data.user) {
      return NextResponse.json(
        { error: 'Utilisateur non créé, vérifiez email et password' },
        { status: 400 }
      )
    }
    const user = data.user
    // Upload fichiers dans Supabase Storage
    let justificatif_url = null
    if (role === 'PRO' && user.id) {
      // Justificatif
      const justificatifPath = `pro_justificatifs/${user.id}/justificatif.pdf`
      const { data: justifData, error: justifError } = await supabase.storage
        .from('pro_justificatifs')
        .upload(justificatifPath, justificatif as File, { upsert: true })
      if (justifError) {
        return NextResponse.json(
          { error: 'Erreur upload justificatif: ' + justifError.message },
          { status: 500 }
        )
      }
      justificatif_url = justifData?.path || null
    }
    // Insertion dans users
    console.log('👤 Création de la ligne users pour:', user.id, 'avec rôle:', role)
    const { error: userInsertError } = await supabase
      .from('users')
      .insert([{ id: user.id, email, role }])
    if (userInsertError) {
      console.error('❌ Erreur lors de la création du profil utilisateur:', userInsertError)
      // Rollback: supprimer l'utilisateur auth créé
      console.log('🔄 Rollback: suppression de l\'utilisateur auth...')
      await supabase.auth.admin.deleteUser(user.id)
      console.log('✅ Rollback terminé')
      return NextResponse.json({ 
        error: `Erreur lors de la création du profil utilisateur: ${userInsertError.message}` 
      }, { status: 500 })
    }
    console.log('✅ Ligne users créée avec succès')

    // Insertion profil selon le rôle avec gestion d'erreur et rollback
    try {
      if (role === 'PRO') {
        const proData: any = {
          user_id: user.id,
          prenom,
          nom,
          telephone,
          profession,
          ville_nom,
          ville_lat: ville_lat ? parseFloat(ville_lat) : null,
          ville_lng: ville_lng ? parseFloat(ville_lng) : null,
          rayon_km: rayon_km ? parseInt(rayon_km) : null,
          siret,
          photo_url: null,
          justificatif_url,
          is_verified: false,
          is_subscribed: false,
        }
        
        const { error: proError } = await supabase.from('pro_profiles').insert([proData])
        if (proError) {
          // Rollback: supprimer l'utilisateur et les données associées
          await supabase.from('users').delete().eq('id', user.id)
          await supabase.auth.admin.deleteUser(user.id)
          return NextResponse.json({ 
            error: `Erreur lors de la création du profil professionnel: ${proError.message}` 
          }, { status: 500 })
        }
        
        // Email de bienvenue (non bloquant)
        try { await sendWelcomeEmail(email) } catch (e) { console.error('[signup] welcome email error (PRO):', e) }

        return NextResponse.json({
          user: {
            id: user.id,
            email,
            role,
            profile: {
              prenom,
              nom,
              telephone,
              profession,
              ville_nom,
              rayon_km,
              siret,
              photo_url: null,
              justificatif_url,
            },
          },
          redirectToStripe: true // Indicateur pour rediriger vers Stripe
        })
      }

      if (role === 'PROPRIETAIRE') {
        console.log('🏠 Création du profil propriétaire pour user:', user.id)
        const proprioData: any = {
          user_id: user.id,
          prenom,
          nom,
          telephone: telephone || null,
          adresse: adresse || null,
        }
        
        console.log('📝 Données propriétaire à insérer:', proprioData)
        
        const { error: proprioError } = await supabase.from('proprio_profiles').insert([proprioData])
        if (proprioError) {
          console.error('❌ Erreur lors de la création du profil propriétaire:', proprioError)
          // Rollback: supprimer l'utilisateur et les données associées
          console.log('🔄 Rollback: suppression des données utilisateur...')
          await supabase.from('users').delete().eq('id', user.id)
          await supabase.auth.admin.deleteUser(user.id)
          console.log('✅ Rollback terminé')
          return NextResponse.json({ 
            error: `Erreur lors de la création du profil propriétaire: ${proprioError.message}` 
          }, { status: 500 })
        }
        
        console.log('✅ Profil propriétaire créé avec succès')
        console.log('🎯 Redirection vers /success-proprio')
        
        // Email de bienvenue (non bloquant)
        try { await sendWelcomeEmail(email) } catch (e) { console.error('[signup] welcome email error (PROPRIETAIRE):', e) }

        return NextResponse.json({ 
          user: { 
            id: user.id, 
            email, 
            role,
            profile: {
              prenom,
              nom,
              telephone,
              adresse,
            }
          },
          redirectToSuccess: true // Indicateur pour redirection vers success-proprio
        })
      }
    } catch (profileError: any) {
      // Rollback en cas d'erreur inattendue
      await supabase.from('users').delete().eq('id', user.id)
      await supabase.auth.admin.deleteUser(user.id)
      return NextResponse.json({ 
        error: `Erreur inattendue lors de la création du profil: ${profileError.message}` 
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur inconnue.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { user_id, photo_url, justificatif_url, ...rest } = body
    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 })
    }
    // On interdit la modification du justificatif_url
    if (justificatif_url !== undefined) {
      return NextResponse.json(
        { error: 'Modification du justificatif non autorisée' },
        { status: 403 }
      )
    }
    // On autorise la modification de la photo de profil
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non initialisé' }, { status: 500 })
    }
    const { error } = await supabase
      .from('pro_profiles')
      .update({ photo_url, ...rest })
      .eq('user_id', user_id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur inconnue.' }, { status: 500 })
  }
}
