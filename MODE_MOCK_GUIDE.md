# Guide d'utilisation du Mode Mock

## 🎭 Qu'est-ce que le Mode Mock ?

Le Mode Mock permet de tester rapidement le flow complet des rendez-vous sans avoir besoin de :
- Se connecter à Supabase
- Créer des rendez-vous dans la base de données
- Basculer entre plusieurs comptes
- Attendre les requêtes API

C'est l'outil parfait pour :
✅ Valider la logique du flow de rendez-vous  
✅ Tester toutes les actions rapidement  
✅ Vérifier les transitions de statuts  
✅ Débugger l'interface utilisateur  
✅ Développer sans connexion internet

---

## 🚀 Comment activer le Mode Mock

### Étape 1 : Activer le flag dans le code

**Côté PRO** - `app/dashboard/pro/rendez-vous/page.tsx`
```typescript
// 🎭 MODE MOCK - Mettre à true pour utiliser les données fictives
const USE_MOCK_DATA = true;  // ← Changer ici
```

**Côté PROPRIO** - `app/dashboard/proprietaire/rendez-vous/page.tsx`
```typescript
// 🎭 MODE MOCK - Mettre à true pour utiliser les données fictives
const USE_MOCK_DATA = true;  // ← Changer ici
```

### Étape 2 : Recharger la page

Une fois le flag activé, rechargez la page dans le navigateur. Vous devriez voir dans la console :
```
🎭 MODE MOCK ACTIVÉ - Utilisation de données fictives
🎭 MODE MOCK - Realtime désactivé
```

---

## 📊 Données Mock disponibles

### Côté PRO

#### Tab "En attente" (2 rendez-vous)
1. **Marie Dubois** - Tonnerre - Vaccination annuelle (demain)
2. **Jean Martin** - Éclair, Tempête - Contrôle dentaire urgent (semaine prochaine)

#### Tab "À venir" (2 rendez-vous)
1. **Sophie Bernard** - Bella - Ostéopathie (dans 3 heures)
2. **Pierre Lefebvre** - Sultan - Ferrage prévu (demain)

#### Tab "Replanifiés" (1 rendez-vous)
1. **Emma Moreau** - Luna - Consultation dermatologique (semaine prochaine)

#### Tab "Terminés" (2 rendez-vous)
1. **Claire Petit** - Océan - Suivi post-opératoire ✅ **Avec compte-rendu**
2. **Lucas Roux** - Saphir - Rendez-vous annulé ⚠️ **Sans compte-rendu**

#### Tab "Refusés" (1 rendez-vous)
1. **Thomas Garnier** - Rebel - Urgence vétérinaire

---

### Côté PROPRIO

#### Tab "En attente" (2 rendez-vous)
1. **Dr. Anne Vétérinaire** - Tornado - Vaccination + vermifuge (demain) - Statut `pending`
2. **Marc Ostéopathe** - Velours - Séance d'ostéopathie (dans 5 jours) - Statut `rescheduled` 🔵

#### Tab "À venir" (2 rendez-vous)
1. **Pierre Maréchal** - Eclipse - Ferrage complet (dans 2 jours)
2. **Dr. Anne Vétérinaire** - Tornado, Eclipse - Contrôle de routine (semaine prochaine)

#### Tab "Terminés" (2 rendez-vous)
1. **Dr. Anne Vétérinaire** - Tornado - Visite post-opératoire ✅ **Avec compte-rendu**
2. **Pierre Maréchal** - Velours - Rendez-vous annulé ⚠️ **Sans compte-rendu**

#### Tab "Refusés" (1 rendez-vous)
1. **Sophie Dentiste** - Eclipse - Dentisterie équine

---

## 🧪 Tests à effectuer avec les Mocks

### Test 1 : Actions sur "En attente" (PRO)
1. Ouvrir l'onglet "En attente" côté PRO
2. Cliquer sur un rendez-vous → Menu 3 points
3. **Tester "Accepter"** → Le RDV doit passer dans "À venir" ✅
4. **Tester "Refuser"** → Le RDV doit passer dans "Refusés" ✅
5. **Tester "Replanifier"** → Le RDV doit passer dans "Replanifiés" ✅

### Test 2 : Actions sur "À venir" (PRO)
1. Ouvrir l'onglet "À venir" côté PRO
2. Tester toutes les actions :
   - **Fiche client** → Modal s'ouvre ✅
   - **Appeler** → Lance l'appel téléphonique ✅
   - **Ouvrir GPS** → Ouvre Google Maps ✅
   - **Replanifier** → RDV passe dans "Replanifiés" ✅
   - **Annuler** → RDV passe dans "Terminés" (sans compte-rendu) ✅

### Test 3 : Gestion compte-rendu (PRO)
1. Ouvrir l'onglet "Terminés" côté PRO
2. Sélectionner "Claire Petit - Océan" (a déjà un compte-rendu)
   - **Voir le compte-rendu** → Affiche le texte existant ✅
   - **Modifier le compte-rendu** → Permet de modifier ✅
3. Sélectionner "Lucas Roux - Saphir" (pas de compte-rendu)
   - **Ajouter un compte-rendu** → Formulaire d'ajout ✅
   - Ajouter du texte → Le badge passe de "Annulé" à "Terminé" ✅

### Test 4 : Accepter/Refuser replanification (PROPRIO)
1. Ouvrir l'onglet "En attente" côté PROPRIO
2. Identifier le rendez-vous avec badge bleu 🔵 "Demande de replanification"
3. **Accepter** → RDV passe dans "À venir" ✅
4. **Refuser** → RDV passe dans "Refusés" ✅

### Test 5 : Replanification par le PROPRIO
1. Ouvrir l'onglet "À venir" côté PROPRIO
2. Cliquer sur "Replanifier"
3. Sélectionner nouvelle date/heure
4. Confirmer → RDV passe dans "En attente" ✅

### Test 6 : Annulation (PROPRIO)
1. Depuis "En attente" ou "À venir"
2. Cliquer sur "Annuler"
3. Confirmer → RDV passe dans "Terminés" (sans compte-rendu) ✅

### Test 7 : Consultation compte-rendu (PROPRIO)
1. Ouvrir l'onglet "Terminés" côté PROPRIO
2. Sélectionner "Dr. Anne - Tornado" (a un compte-rendu)
3. **Voir le compte-rendu** → Affiche le texte du PRO ✅

---

## 🔄 Comportement des Mocks

### Transitions automatiques
Lorsque vous effectuez une action en Mode Mock :
- ⏱️ Délai simulé de 500ms (pour imiter une requête API)
- 🎯 Le rendez-vous est automatiquement déplacé vers le bon statut
- 🎨 Les compteurs des tabs se mettent à jour
- ✅ Un toast de succès s'affiche
- 🔄 L'interface se rafraîchit instantanément

### Persistance des données
⚠️ **ATTENTION** : Les données mock ne sont **PAS persistées** !
- Les changements sont uniquement dans la mémoire du navigateur
- Rechargez la page → Les données initiales reviennent
- C'est parfait pour tester sans risque de "polluer" les données

---

## 🔧 Personnaliser les données Mock

### Ajouter un rendez-vous

**Localisation** : Dans `getMockAppointments()` de chaque fichier

**Exemple** (côté PRO) :
```typescript
pending: [
  {
    id: 'mock-pending-3',  // ID unique
    pro_id: 'mock-pro-1',
    proprio_id: 'mock-proprio-9',
    equide_ids: ['equide-10'],
    main_slot: tomorrow.toISOString(),  // Date/heure
    alternative_slots: [],
    duration_minutes: 60,
    status: 'pending',
    comment: 'Votre nouveau rendez-vous',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    equides: [{ nom: 'NomDuCheval' }],
    proprio_profiles: {
      prenom: 'Prénom',
      nom: 'Nom',
      telephone: '06 XX XX XX XX'
    }
  },
  // ... autres rendez-vous
]
```

### Modifier un rendez-vous existant

Cherchez l'ID du rendez-vous (ex: `'mock-pending-1'`) et modifiez ses propriétés.

### Supprimer un rendez-vous

Retirez simplement l'objet de la liste.

---

## 🔌 Désactiver le Mode Mock

### Pour revenir aux données réelles

1. **Changer le flag** dans le code :
```typescript
const USE_MOCK_DATA = false;  // ← Mettre à false
```

2. **Recharger la page**

3. **Se connecter avec un compte Supabase valide**

4. **Vérifier dans la console** :
```
✅ GET: Utilisateur authentifié: [user-id]
✅ GET: Rôle utilisateur: PRO
✅ API: X appointments récupérés
```

---

## 📝 Logs de debug

### En Mode Mock
```bash
🎭 MODE MOCK ACTIVÉ - Utilisation de données fictives
🎭 MODE MOCK - Realtime désactivé
🎭 MOCK - Action: accept sur RDV: mock-pending-1
```

### En Mode Normal
```bash
✅ GET: Utilisateur authentifié: [user-id]
✅ GET: Rôle utilisateur: PRO
📡 Changement Realtime détecté: [payload]
✅ API: X appointments récupérés
```

---

## 🎯 Avantages du Mode Mock

### Développement
- ✅ Pas besoin de connexion Supabase
- ✅ Pas de latence réseau
- ✅ Tester rapidement toutes les actions
- ✅ Itérer sur l'UI sans impacter la DB

### Tests
- ✅ Scénarios reproductibles
- ✅ Données cohérentes
- ✅ Isolation complète
- ✅ Tests unitaires faciles

### Démonstration
- ✅ Montrer le flow sans compte
- ✅ Données réalistes
- ✅ Aucun risque
- ✅ Toujours disponible

---

## ⚠️ Limitations

### Ce qui ne fonctionne PAS en Mode Mock :
- ❌ Synchronisation temps réel entre PRO et PROPRIO
- ❌ Persistance des données (rechargement = reset)
- ❌ Validation côté serveur
- ❌ Vérification des permissions RLS
- ❌ Historique des modifications

### Ce qui fonctionne :
- ✅ Toutes les actions (accepter, refuser, replanifier, annuler)
- ✅ Transitions de statuts
- ✅ Affichage des données
- ✅ Modals et formulaires
- ✅ Badges visuels
- ✅ Messages de succès/erreur
- ✅ Gestion des comptes-rendus

---

## 🚀 Workflow recommandé

1. **Développement initial** : Mode Mock activé
   - Développer les composants
   - Tester les actions
   - Valider les transitions

2. **Tests d'intégration** : Mode Mock désactivé
   - Tester avec Supabase
   - Vérifier le Realtime
   - Valider les permissions

3. **Production** : Mode Mock désactivé
   - Données réelles uniquement
   - Supprimer le flag si nécessaire

---

## 📚 Fichiers concernés

### Fichiers avec Mode Mock
```
app/dashboard/pro/rendez-vous/page.tsx
app/dashboard/proprietaire/rendez-vous/page.tsx
```

### Flag de configuration
```typescript
const USE_MOCK_DATA = true;  // ← En haut de chaque fichier
```

---

## 🔍 Débogage

### Les données ne s'affichent pas ?
1. Vérifier que `USE_MOCK_DATA = true`
2. Recharger la page (Cmd+R ou Ctrl+R)
3. Ouvrir la console (F12)
4. Chercher : `🎭 MODE MOCK ACTIVÉ`

### Les actions ne fonctionnent pas ?
1. Vérifier la console pour les erreurs
2. Vérifier les logs : `🎭 MOCK - Action: ...`
3. Vérifier que `actionLoading` n'est pas bloqué

### Les compteurs ne se mettent pas à jour ?
1. Vérifier que `setAppointments()` est bien appelé
2. Vérifier que le rendez-vous est dans le bon tableau
3. Recharger la page pour réinitialiser

---

*Guide créé le 8 octobre 2025*  
*Version 1.0*






