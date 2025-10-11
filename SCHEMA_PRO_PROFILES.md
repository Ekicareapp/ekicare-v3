# 📊 SCHÉMA TABLE `pro_profiles`

## 🔍 COLONNES EXISTANTES

D'après le code de signup et profile, voici les colonnes **RÉELLEMENT PRÉSENTES** dans la table `pro_profiles` :

### ✅ Colonnes confirmées :

```sql
CREATE TABLE pro_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES users(id) NOT NULL,
  prenom                TEXT,
  nom                   TEXT,
  telephone             TEXT,
  profession            TEXT,
  ville_nom             TEXT,
  ville_lat             FLOAT,
  ville_lng             FLOAT,
  rayon_km              INTEGER,
  siret                 TEXT,
  photo_url             TEXT,
  justificatif_url      TEXT,
  is_verified           BOOLEAN DEFAULT FALSE,
  is_subscribed         BOOLEAN DEFAULT FALSE,
  bio                   TEXT,
  experience_years      INTEGER,
  price_range           TEXT,
  payment_methods       TEXT,
  average_consultation_duration INTEGER,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

### ❌ Colonnes NON PRÉSENTES (à ajouter si nécessaire) :

Ces colonnes sont utilisées par Stripe mais **n'existent PAS** dans le schéma actuel :

- `stripe_customer_id` (STRING)
- `stripe_subscription_id` (STRING)
- `stripe_session_id` (STRING)
- `subscription_start` (TIMESTAMP)

---

## 🛠️ SOLUTION ACTUELLE

Le webhook et le fallback ont été adaptés pour :

1. **Mettre à jour UNIQUEMENT** les colonnes existantes :
   - `is_verified` → `true`
   - `is_subscribed` → `true`

2. **Logger les données Stripe** sans les sauvegarder :
   - Customer ID
   - Subscription ID
   - Session ID
   
3. **Gérer gracieusement** les erreurs PGRST204 (colonne manquante)

---

## 🔮 SI TU VEUX SAUVEGARDER LES DONNÉES STRIPE

Si tu veux conserver les IDs Stripe pour des besoins futurs (gestion abonnement, facturation, etc.), tu devras **ajouter ces colonnes** dans Supabase :

### Migration SQL à exécuter dans Supabase :

```sql
-- Ajouter les colonnes Stripe à pro_profiles
ALTER TABLE pro_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;

-- Créer des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_pro_profiles_stripe_customer 
ON pro_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_pro_profiles_stripe_subscription 
ON pro_profiles(stripe_subscription_id);
```

### Puis décommenter le code dans le webhook :

Une fois les colonnes ajoutées, tu pourras revenir dans `app/api/stripe/webhook/route.ts` et utiliser :

```typescript
const updateData: any = {
  is_verified: true,
  is_subscribed: true,
  stripe_customer_id: session.customer as string,
  stripe_subscription_id: session.subscription as string,
  stripe_session_id: session.id,
  subscription_start: new Date().toISOString()
}
```

---

## 📋 CHAMPS MODIFIABLES PAR L'UTILISATEUR

D'après `app/api/profile/route.ts`, les champs modifiables via PATCH sont :

```typescript
[
  'prenom',
  'nom',
  'telephone',
  'profession',
  'ville_nom',
  'ville_lat',
  'ville_lng',
  'rayon_km',
  'siret',
  'photo_url',
  'bio',
  'experience_years',
  'price_range',
  'payment_methods',
  'average_consultation_duration',
]
```

**NON MODIFIABLE** :
- `justificatif_url` → Protégé, retourne erreur 403
- `is_verified` → Uniquement via webhook Stripe
- `is_subscribed` → Uniquement via webhook Stripe

---

## 🎯 ÉTAT ACTUEL

✅ **Le système fonctionne** sans les colonnes Stripe  
✅ **is_verified** et **is_subscribed** suffisent pour activer le compte  
ℹ️ **Les IDs Stripe sont loggés** mais pas sauvegardés  
⚠️ **Si besoin de gestion avancée Stripe**, ajouter les colonnes via migration SQL

---

**Dernière mise à jour** : 11 octobre 2025  
**Version schéma** : 1.0 (sans colonnes Stripe)

