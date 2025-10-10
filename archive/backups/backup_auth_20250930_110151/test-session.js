#!/usr/bin/env node

/**
 * Script de test pour vérifier la gestion des sessions Supabase
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Vérifier que le serveur répond
async function testServerConnectivity() {
  logTest('TEST 1: Connectivité du serveur');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test`);
    if (response.ok) {
      logSuccess('Serveur accessible');
      return true;
    } else {
      logError(`Serveur non accessible (${response.status})`);
      return false;
    }
  } catch (error) {
    logError(`Erreur de connexion: ${error.message}`);
    return false;
  }
}

// Test 2: Test d'inscription propriétaire avec session
async function testSignupProprietaireWithSession() {
  logTest('TEST 2: Inscription propriétaire avec gestion de session');
  
  const timestamp = Date.now();
  const email = `test-proprio-${timestamp}@ekicare.com`;
  const password = 'TestPassword123!';
  
  try {
    // Créer un FormData pour l'inscription
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', 'PROPRIETAIRE');
    formData.append('prenom', 'Jean');
    formData.append('nom', 'Dupont');
    formData.append('telephone', '0612345678');
    formData.append('adresse', '123 Rue de la Paix');
    
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.error) {
      logError(`Erreur lors de l'inscription: ${data.error}`);
      return false;
    }
    
    if (data.redirectToSuccess) {
      logSuccess('Inscription propriétaire réussie');
      logInfo(`User ID: ${data.user.id}`);
      logInfo(`Email: ${data.user.email}`);
      logInfo(`Rôle: ${data.user.role}`);
      
      // Tester la redirection vers success-proprio
      logInfo('Test de la page success-proprio...');
      const successResponse = await fetch(`${BASE_URL}/success-proprio`);
      if (successResponse.ok) {
        logSuccess('Page success-proprio accessible');
      } else {
        logError(`Page success-proprio non accessible (${successResponse.status})`);
      }
      
      return { userId: data.user.id, email: data.user.email };
    }
    
    logError('Redirection vers success non détectée');
    return false;
  } catch (error) {
    logError(`Erreur lors du test d'inscription: ${error.message}`);
    return false;
  }
}

// Test 3: Test de connexion après inscription
async function testLoginAfterSignup(email, password) {
  logTest('TEST 3: Connexion après inscription');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
      logError(`Erreur lors de la connexion: ${data.error}`);
      return false;
    }
    
    if (data.requiresPayment) {
      logWarning('Utilisateur redirigé vers paiement (attendu pour les pros)');
      return true;
    }
    
    if (data.user.role === 'PROPRIETAIRE') {
      logSuccess('Connexion propriétaire réussie');
      logInfo(`User ID: ${data.user.id}`);
      logInfo(`Email: ${data.user.email}`);
      logInfo(`Rôle: ${data.user.role}`);
      return true;
    }
    
    logError('Rôle incorrect après connexion');
    return false;
  } catch (error) {
    logError(`Erreur lors du test de connexion: ${error.message}`);
    return false;
  }
}

// Test 4: Test des pages de dashboard
async function testDashboardAccess() {
  logTest('TEST 4: Accès aux dashboards');
  
  const dashboards = [
    { name: 'Dashboard Propriétaire', url: '/dashboard/proprietaire' },
    { name: 'Dashboard Pro', url: '/dashboard/pro' }
  ];
  
  for (const dashboard of dashboards) {
    try {
      const response = await fetch(`${BASE_URL}${dashboard.url}`);
      if (response.ok) {
        logSuccess(`${dashboard.name} accessible`);
      } else if (response.status === 401 || response.status === 403) {
        logWarning(`${dashboard.name} protégé (attendu sans session)`);
      } else {
        logError(`${dashboard.name} erreur (${response.status})`);
      }
    } catch (error) {
      logError(`${dashboard.name} erreur: ${error.message}`);
    }
  }
  
  return true;
}

// Test 5: Test des pages publiques
async function testPublicPages() {
  logTest('TEST 5: Accès aux pages publiques');
  
  const publicPages = [
    { name: 'Login', url: '/login' },
    { name: 'Signup', url: '/signup' },
    { name: 'Success Proprio', url: '/success-proprio' },
    { name: 'Success Pro', url: '/success-pro' },
    { name: 'Paiement Requis', url: '/paiement-requis' }
  ];
  
  for (const page of publicPages) {
    try {
      const response = await fetch(`${BASE_URL}${page.url}`);
      if (response.ok) {
        logSuccess(`${page.name} accessible`);
      } else {
        logError(`${page.name} non accessible (${response.status})`);
      }
    } catch (error) {
      logError(`${page.name} erreur: ${error.message}`);
    }
  }
  
  return true;
}

// Fonction principale de test
async function runSessionTests() {
  log('🚀 DÉMARRAGE DES TESTS DE SESSION EKICARE', 'bright');
  log('='.repeat(60), 'bright');
  
  const results = {
    serverConnectivity: false,
    signupProprietaire: false,
    loginAfterSignup: false,
    dashboardAccess: false,
    publicPages: false
  };
  
  // Test 1: Connectivité
  results.serverConnectivity = await testServerConnectivity();
  if (!results.serverConnectivity) {
    logError('Serveur non accessible, arrêt des tests');
    return;
  }
  
  // Test 2: Inscription propriétaire
  const signupResult = await testSignupProprietaireWithSession();
  if (signupResult) {
    results.signupProprietaire = true;
    
    // Test 3: Connexion après inscription
    results.loginAfterSignup = await testLoginAfterSignup(signupResult.email, 'TestPassword123!');
  }
  
  // Test 4: Accès aux dashboards
  results.dashboardAccess = await testDashboardAccess();
  
  // Test 5: Pages publiques
  results.publicPages = await testPublicPages();
  
  // Résumé des résultats
  logTest('RÉSUMÉ DES TESTS DE SESSION');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  log(`Tests réussis: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  if (passedTests === totalTests) {
    log('\n🎉 TOUS LES TESTS DE SESSION SONT PASSÉS !', 'green');
    log('La gestion des sessions fonctionne correctement !', 'green');
  } else {
    log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ', 'yellow');
    log('Vérifiez les erreurs ci-dessus et corrigez les problèmes', 'yellow');
  }
  
  log('\n📋 INSTRUCTIONS POUR LES TESTS MANUELS:', 'blue');
  log('1. Ouvrez http://localhost:3000/signup dans votre navigateur', 'blue');
  log('2. Inscrivez-vous en tant que propriétaire', 'blue');
  log('3. Vérifiez que vous arrivez sur /success-proprio', 'blue');
  log('4. Cliquez sur "Accéder à mon tableau de bord"', 'blue');
  log('5. Vérifiez que vous arrivez sur /dashboard/proprietaire', 'blue');
  log('6. Rafraîchissez la page - vous ne devez pas être redirigé vers /login', 'blue');
}

// Exécution
if (require.main === module) {
  runSessionTests().catch(console.error);
}

module.exports = { runSessionTests };
