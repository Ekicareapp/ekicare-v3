const fs = require('fs');
const path = require('path');

// Test de l'inscription professionnel
async function testProSignup() {
  console.log('🧪 Test d\'inscription professionnel...');
  
  // Données de test pour un professionnel
  const testData = {
    email: 'test-pro-2@example.com',
    password: 'password123',
    role: 'PRO',
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '0612345678',
    profession: 'Vétérinaire équin',
    siret: '12345678901234',
    ville_nom: 'Paris, France',
    ville_lat: '48.8566',
    ville_lng: '2.3522',
    rayon_km: '30'
  };

  // Créer un fichier de test pour les uploads
  const testPhotoContent = 'fake-image-data';
  const testJustifContent = 'fake-pdf-data';
  
  // Créer FormData simulé
  const formData = new FormData();
  Object.entries(testData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Créer des fichiers de test
  const photoFile = new File([testPhotoContent], 'test-photo.jpg', { type: 'image/jpeg' });
  const justifFile = new File([testJustifContent], 'test-justif.pdf', { type: 'application/pdf' });
  
  formData.append('photo', photoFile);
  formData.append('justificatif', justifFile);

  try {
    console.log('📤 Envoi de la requête d\'inscription...');
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    console.log('📊 Statut de la réponse:', response.status);
    console.log('📋 Réponse complète:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Inscription réussie !');
      console.log('👤 Utilisateur créé:', result.user?.id);
    } else {
      console.log('❌ Erreur d\'inscription:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
}

// Test de l'inscription propriétaire pour comparaison
async function testProprioSignup() {
  console.log('\n🏠 Test d\'inscription propriétaire...');
  
  const testData = {
    email: 'test-proprio@example.com',
    password: 'password123',
    role: 'PROPRIETAIRE',
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '0612345679',
    adresse: '123 rue de la Paix'
  };

  const formData = new FormData();
  Object.entries(testData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    console.log('📤 Envoi de la requête d\'inscription...');
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    console.log('📊 Statut de la réponse:', response.status);
    console.log('📋 Réponse complète:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Inscription réussie !');
      console.log('👤 Utilisateur créé:', result.user?.id);
    } else {
      console.log('❌ Erreur d\'inscription:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests d\'inscription...\n');
  
  // Attendre que le serveur soit prêt
  console.log('⏳ Attente du serveur de développement...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testProprioSignup();
  await testProSignup();
  
  console.log('\n🏁 Tests terminés !');
}

runTests().catch(console.error);
