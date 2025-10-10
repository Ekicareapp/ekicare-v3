// Script de débogage pour les équidés
// À exécuter dans la console du navigateur

console.log('🐴 Débogage des équidés...');

// Vérifier s'il y a des équidés dans la base
supabase
  .from('equides')
  .select('id, nom, created_at')
  .limit(10)
  .then(({ data: equides, error }) => {
    console.log('🐴 Équidés dans la base:');
    console.log('- Nombre total:', equides?.length || 0);
    console.log('- Données:', equides);
    console.log('- Erreur:', error);
  });

// Vérifier les appointments et leurs equide_ids
supabase
  .from('appointments')
  .select('id, equide_ids, comment')
  .limit(5)
  .then(({ data: appointments, error }) => {
    console.log('📅 Appointments avec equide_ids:');
    console.log('- Nombre:', appointments?.length || 0);
    appointments?.forEach(apt => {
      console.log(`- Appointment ${apt.id}: equide_ids =`, apt.equide_ids, 'comment =', apt.comment);
    });
    console.log('- Erreur:', error);
  });


