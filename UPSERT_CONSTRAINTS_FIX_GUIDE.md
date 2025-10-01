# 🔧 CORRECTION CONTRAINTES UPSERT - pro_profiles
**Date :** 30 Septembre 2025  
**Problème :** "there is no unique or exclusion constraint matching the ON CONFLICT specification"

## 🎯 PROBLÈME IDENTIFIÉ

**Erreur :** `there is no unique or exclusion constraint matching the ON CONFLICT specification`  
**Cause :** La colonne `user_id` dans `pro_profiles` n'a pas de contrainte unique  
**Impact :** L'upsert ne peut pas fonctionner car il n'y a pas de contrainte unique pour `onConflict: 'user_id'`

## ✅ SOLUTION

### 📋 **ÉTAPE 1 : Exécuter le script SQL**

1. **Ouvrez le dashboard Supabase :**
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet
   - Allez dans **SQL Editor**

2. **Exécutez le script :**
   - Copiez le contenu du fichier `fix-upsert-constraints.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

### 📋 **ÉTAPE 2 : Vérifier l'exécution**

Le script va :

1. **Vérifier les contraintes existantes** sur `pro_profiles`
2. **Ajouter la contrainte unique** sur `user_id` si elle n'existe pas
3. **Vérifier que la contrainte** a été ajoutée correctement

### 📋 **ÉTAPE 3 : Tester l'upsert**

Après avoir exécuté le script SQL :

```bash
# Test automatique de l'upsert
node test-upsert-functionality.js
```

**Résultat attendu :**
- ✅ Upsert fonctionnel (avec contrainte unique)
- ✅ Mise à jour fonctionnelle
- ✅ Plus d'erreur "no unique or exclusion constraint"

### 📋 **ÉTAPE 4 : Vérifier dans l'application**

1. **Rechargez votre application**
2. **Allez dans "Mon profil" (côté pro)**
3. **Testez l'enregistrement du profil**
4. **L'upsert devrait maintenant fonctionner sans erreur !**

## 🔧 DÉTAILS TECHNIQUES

### **Script SQL à exécuter :**

```sql
-- Ajouter la contrainte unique sur user_id
ALTER TABLE pro_profiles 
ADD CONSTRAINT pro_profiles_user_id_unique UNIQUE (user_id);
```

### **Comment ça fonctionne :**

1. **Avant :** Pas de contrainte unique sur `user_id` → Erreur upsert
2. **Après :** Contrainte unique sur `user_id` → Upsert fonctionnel
3. **Upsert :** Si profil existe → UPDATE, sinon → INSERT

### **Utilisation dans le code :**

```javascript
// Code frontend (déjà correct)
const { data, error } = await supabase
  .from('pro_profiles')
  .upsert({
    user_id: user.id,
    ...profileData
  }, {
    onConflict: 'user_id'  // Maintenant supporté
  });
```

### **Sécurité :**

- ✅ Chaque utilisateur ne peut avoir qu'un seul profil
- ✅ L'upsert garantit l'unicité des profils par utilisateur
- ✅ Les données existantes sont préservées lors des mises à jour

## 🎯 RÉSULTAT FINAL

**Après exécution du script SQL :**

- ✅ **Upsert fonctionnel** : INSERT ou UPDATE selon l'existence du profil
- ✅ **Enregistrement profil** : Sans erreur de contrainte
- ✅ **Mise à jour données** : Fonctionnelle
- ✅ **Unicité garantie** : Un profil par utilisateur

## 🚨 IMPORTANT

**Le script SQL `fix-upsert-constraints.sql` doit être exécuté dans le dashboard Supabase !**

Sans ce script :
- ❌ L'erreur "no unique or exclusion constraint" persistera
- ❌ L'upsert ne fonctionnera pas
- ❌ L'enregistrement du profil échouera

**Une fois le script exécuté, l'upsert sera pleinement fonctionnel !** 🎉

## 📋 RÉCAPITULATIF DES FICHIERS

- **`fix-upsert-constraints.sql`** : Script SQL à exécuter dans Supabase
- **`test-upsert-functionality.js`** : Test automatique après correction
- **`UPSERT_CONSTRAINTS_FIX_GUIDE.md`** : Ce guide d'instructions

**Exécutez le script SQL et testez l'enregistrement du profil !** 🚀
