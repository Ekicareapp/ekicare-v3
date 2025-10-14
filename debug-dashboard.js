// Script de débogage pour le tableau de bord
// À exécuter dans la console du navigateur

console.log('🔍 Débogage du tableau de bord...');

// Vérifier l'utilisateur connecté
supabase.auth.getUser().then(({ data: { user }, error }) => {
  console.log('👤 Utilisateur connecté:', user?.id, user?.email);
  
  if (user) {
    // Vérifier le profil pro
    supabase
      .from('pro_profiles')
      .select('id, prenom, nom, user_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data: proProfile, error: proError }) => {
        console.log('👨‍⚕️ Profil pro:', proProfile);
        console.log('❌ Erreur profil pro:', proError);
        
        if (proProfile) {
          // Vérifier les appointments
          supabase
            .from('appointments')
            .select('id, pro_id, status, main_slot, comment')
            .eq('pro_id', proProfile.id)
            .then(({ data: appointments, error: aptError }) => {
              console.log('📅 Appointments trouvés:', appointments?.length || 0);
              console.log('📋 Détails appointments:', appointments);
              console.log('❌ Erreur appointments:', aptError);
            });
          
          // Vérifier les tours
          supabase
            .from('tours')
            .select('id, pro_id, name, date')
            .eq('pro_id', proProfile.id)
            .then(({ data: tours, error: toursError }) => {
              console.log('🗺️ Tours trouvées:', tours?.length || 0);
              console.log('📋 Détails tours:', tours);
              console.log('❌ Erreur tours:', toursError);
            });
        }
      });
  }
});








