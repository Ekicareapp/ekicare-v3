# 🔒 INSTRUCTIONS D'ACTIVATION RLS - SUPABASE

## ⚡ À FAIRE MAINTENANT (CRITIQUE)

### **Étape 1 : Ouvrir Supabase**
1. Aller sur [https://supabase.com](https://supabase.com)
2. Se connecter à votre projet Ekicare
3. Dans le menu latéral, cliquer sur **SQL Editor**

### **Étape 2 : Exécuter le script RLS**
1. Cliquer sur **New Query**
2. Ouvrir le fichier `reactivate-rls-and-policies.sql` (à la racine du projet)
3. **Copier TOUT le contenu** du fichier
4. **Coller** dans l'éditeur SQL de Supabase
5. Cliquer sur **Run** (ou `Cmd+Enter` / `Ctrl+Enter`)

### **Étape 3 : Vérifier l'exécution**
Vous devriez voir dans les résultats :
```
✅ ALTER TABLE (enable RLS)
✅ DROP POLICY IF EXISTS (plusieurs fois)
✅ CREATE POLICY (13 fois minimum)
✅ SELECT queries (résultats de vérification)
```

**Si vous voyez des erreurs rouges** : 
- Copier le message d'erreur complet
- Me le transmettre pour analyse

### **Étape 4 : Vérifier que RLS est activé**
1. Dans Supabase, aller dans **Table Editor**
2. Sélectionner la table `appointments`
3. Regarder en haut à droite : l'icône RLS doit être **verte/active** 🔒
4. Répéter pour `pro_profiles` et `proprio_profiles`

### **Étape 5 : Tester les policies**
1. Créer une nouvelle query dans SQL Editor
2. Copier le contenu de `test-rls-policies.sql`
3. Exécuter
4. Vérifier que vous voyez :
   - ✅ RLS ACTIVÉ (pour les 3 tables)
   - ✅ 13+ policies présentes
   - ✅ Toutes les policies essentielles listées

---

## ⚠️ CE QUI PEUT SE PASSER

### Scénario 1 : Tout s'exécute sans erreur ✅
→ Parfait ! Passez à l'étape de test dans l'application

### Scénario 2 : Erreur "policy already exists"
→ Normal si RLS était déjà partiellement configuré
→ Les `DROP POLICY IF EXISTS` devraient gérer ça
→ Si l'erreur persiste, me la transmettre

### Scénario 3 : Erreur "permission denied"
→ Vous n'avez peut-être pas les droits admin
→ Vérifier que vous êtes bien propriétaire du projet Supabase

---

## 🧪 TEST DANS L'APPLICATION

### Une fois RLS activé, tester :

**Test 1 : Connexion et navigation**
```
1. Se connecter en tant que PROPRIETAIRE
2. Aller dans "Mes rendez-vous"
3. Vérifier que ça charge (peut prendre quelques secondes)
```

**Test 2 : Création de rendez-vous**
```
1. En tant que PROPRIETAIRE
2. Aller dans "Recherche pro"
3. Chercher un professionnel
4. Créer un rendez-vous
5. Vérifier qu'il apparaît dans "Mes rendez-vous"
```

**Test 3 : Côté PRO**
```
1. Se déconnecter
2. Se connecter en tant que PRO
3. Aller dans "Mes rendez-vous"
4. Vérifier que vous voyez uniquement VOS rendez-vous
```

---

## 📞 EN CAS DE PROBLÈME

### L'application ne fonctionne plus après activation RLS

**Symptômes possibles :**
- Page blanche
- Erreur "Unauthorized"
- Les rendez-vous ne s'affichent plus

**Causes possibles :**
1. Les API routes n'utilisent pas `supabaseAdmin` (SERVICE_ROLE)
2. Les policies sont trop restrictives
3. Les subscriptions real-time sont bloquées

**Solution temporaire :**
```sql
-- Dans Supabase SQL Editor, pour DÉSACTIVER temporairement RLS
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE pro_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE proprio_profiles DISABLE ROW LEVEL SECURITY;
```

**Puis me contacter avec :**
- Les erreurs dans la console du navigateur (F12)
- Les erreurs dans les logs Supabase
- La description du comportement observé

---

## ✅ CONFIRMATION DE SUCCÈS

Vous saurez que tout fonctionne si :

1. ✅ RLS est activé (icône verte dans Supabase)
2. ✅ 13+ policies sont en place
3. ✅ Vous pouvez vous connecter
4. ✅ Vous pouvez créer un rendez-vous
5. ✅ Les rendez-vous s'affichent
6. ✅ Les actions (accepter, refuser, etc.) fonctionnent
7. ✅ Un propriétaire ne voit PAS les RDV d'un autre
8. ✅ Un pro ne voit PAS les RDV d'un autre pro

---

## 🎯 PROCHAINE ÉTAPE

Une fois RLS activé et testé, me confirmer :
- ✅ "RLS activé et testé OK" → Je passe à la Phase 2 (migration des API)
- ❌ "Problème rencontré" → Décrire le problème pour que je corrige

---

**Créé le** : 7 octobre 2025  
**Temps estimé** : 15-30 minutes  
**Priorité** : 🔴 CRITIQUE













