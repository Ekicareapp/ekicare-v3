# 💾 Intégration Base de Données - Webhook Stripe

Guide pour implémenter la logique métier dans votre webhook Stripe (activation profil pro, gestion abonnements, etc.)

---

## 🎯 Objectif

Quand un paiement Stripe réussit (`checkout.session.completed`), on veut :
1. ✅ Activer le profil pro de l'utilisateur
2. 💳 Enregistrer les informations de paiement
3. 📧 Envoyer un email de confirmation
4. 📊 Logger l'événement pour analytics

---

## 📁 Structure suggérée

```
/lib/
  ├── webhook-logger.ts        # Système de logging
  ├── stripe-actions.ts        # Actions métier Stripe
  └── supabase-client.ts       # Client Supabase (si pas déjà existant)

/app/api/stripe/webhook/
  └── route.ts                 # Route webhook
```

---

## 🔧 Exemple d'implémentation

### 1. Créer le fichier des actions Stripe

```typescript
// /lib/stripe-actions.ts

import { createClient } from '@supabase/supabase-js';
import { webhookLogger } from './webhook-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé admin pour bypass RLS
);

/**
 * Active le profil pro d'un utilisateur après un paiement réussi
 */
export async function activateProProfile(
  userId: string,
  stripeData: {
    customerId: string;
    subscriptionId?: string;
    sessionId: string;
  }
) {
  try {
    // 1. Mettre à jour le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('pro_profiles')
      .upsert({
        user_id: userId,
        is_active: true,
        stripe_customer_id: stripeData.customerId,
        stripe_subscription_id: stripeData.subscriptionId,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Erreur DB: ${profileError.message}`);
    }

    // 2. Enregistrer la transaction
    const { error: txError } = await supabase
      .from('stripe_transactions')
      .insert({
        user_id: userId,
        stripe_session_id: stripeData.sessionId,
        stripe_customer_id: stripeData.customerId,
        stripe_subscription_id: stripeData.subscriptionId,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (txError) {
      webhookLogger.warn('Transaction non enregistrée', { 
        userId, 
        error: txError.message 
      });
    }

    webhookLogger.success('Profil pro activé avec succès', {
      userId,
      profileId: profile.id
    });

    return profile;

  } catch (error) {
    webhookLogger.error('Erreur activation profil pro', error as Error, {
      userId,
      stripeData
    });
    throw error;
  }
}

/**
 * Désactive le profil pro (en cas d'annulation d'abonnement)
 */
export async function deactivateProProfile(
  userId: string,
  reason: string
) {
  try {
    const { error } = await supabase
      .from('pro_profiles')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur DB: ${error.message}`);
    }

    webhookLogger.success('Profil pro désactivé', { userId, reason });

  } catch (error) {
    webhookLogger.error('Erreur désactivation profil pro', error as Error, {
      userId
    });
    throw error;
  }
}

/**
 * Met à jour le statut d'un abonnement
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string
) {
  try {
    const { error } = await supabase
      .from('pro_profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      throw new Error(`Erreur DB: ${error.message}`);
    }

    webhookLogger.success('Statut abonnement mis à jour', {
      subscriptionId,
      status
    });

  } catch (error) {
    webhookLogger.error('Erreur mise à jour abonnement', error as Error, {
      subscriptionId
    });
    throw error;
  }
}

/**
 * Envoie un email de confirmation (optionnel)
 */
export async function sendProActivationEmail(
  userId: string,
  email: string
) {
  try {
    // Exemple avec Resend, SendGrid, ou votre service d'email
    // await sendEmail({
    //   to: email,
    //   subject: 'Bienvenue chez EkiCare Pro ! 🎉',
    //   template: 'pro-activation',
    //   data: { userId }
    // });

    webhookLogger.success('Email de confirmation envoyé', { userId, email });

  } catch (error) {
    // Ne pas throw ici - l'email n'est pas critique
    webhookLogger.warn('Email non envoyé', { userId, email });
  }
}
```

### 2. Mettre à jour le handler dans route.ts

```typescript
// /app/api/stripe/webhook/route.ts

import { activateProProfile, sendProActivationEmail } from '@/lib/stripe-actions';

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  webhookLogger.info("Traitement checkout.session.completed", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    currency: session.currency
  });

  // Vérifier que le paiement est bien réussi
  if (session.payment_status !== "paid") {
    webhookLogger.warn("Session non payée, action ignorée", {
      sessionId: session.id,
      paymentStatus: session.payment_status
    });
    return;
  }

  // Récupérer l'userId depuis les metadata
  const userId = session.metadata?.userId;
  
  if (!userId) {
    webhookLogger.error("userId manquant dans les metadata", undefined, {
      sessionId: session.id
    });
    throw new Error("Missing userId in session metadata");
  }

  // Activer le profil pro
  await activateProProfile(userId, {
    customerId: session.customer as string,
    subscriptionId: session.subscription as string | undefined,
    sessionId: session.id
  });

  // Envoyer l'email de confirmation
  const email = session.customer_details?.email;
  if (email) {
    await sendProActivationEmail(userId, email);
  }

  webhookLogger.success("Profil pro activé avec succès", {
    userId,
    sessionId: session.id
  });
}
```

---

## 🗄️ Structure de base de données suggérée

### Table : `pro_profiles`

```sql
CREATE TABLE pro_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'active', -- active, canceled, past_due, etc.
  
  -- Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  
  -- Dates
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id)
);

-- Index pour les recherches rapides
CREATE INDEX idx_pro_profiles_user_id ON pro_profiles(user_id);
CREATE INDEX idx_pro_profiles_stripe_customer ON pro_profiles(stripe_customer_id);
CREATE INDEX idx_pro_profiles_stripe_subscription ON pro_profiles(stripe_subscription_id);
```

### Table : `stripe_transactions` (optionnel, pour l'historique)

```sql
CREATE TABLE stripe_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Détails
  amount INTEGER, -- en centimes
  currency TEXT DEFAULT 'eur',
  status TEXT, -- completed, failed, refunded, etc.
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(stripe_session_id)
);

-- Index
CREATE INDEX idx_stripe_transactions_user_id ON stripe_transactions(user_id);
CREATE INDEX idx_stripe_transactions_session ON stripe_transactions(stripe_session_id);
```

---

## 🔄 Gestion du cycle de vie de l'abonnement

### Événement : `customer.subscription.created`

```typescript
async function handleSubscriptionChange(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  if (event.type === 'customer.subscription.created') {
    // L'abonnement est créé
    await updateSubscriptionStatus(subscription.id, subscription.status);
  }
  
  if (event.type === 'customer.subscription.updated') {
    // L'abonnement est mis à jour (changement de plan, statut, etc.)
    await updateSubscriptionStatus(subscription.id, subscription.status);
    
    // Si le statut passe à 'canceled' ou 'unpaid'
    if (['canceled', 'unpaid'].includes(subscription.status)) {
      const { data } = await supabase
        .from('pro_profiles')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      if (data) {
        await deactivateProProfile(data.user_id, `Subscription ${subscription.status}`);
      }
    }
  }
  
  if (event.type === 'customer.subscription.deleted') {
    // L'abonnement est supprimé
    const { data } = await supabase
      .from('pro_profiles')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (data) {
      await deactivateProProfile(data.user_id, 'Subscription deleted');
    }
  }
}
```

---

## 🧪 Comment tester

### 1. Tester l'activation du profil pro

```typescript
// Créer une session checkout avec metadata
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: 'price_xxxxx',
    quantity: 1
  }],
  success_url: 'https://ekicare-v3.vercel.app/dashboard?success=true',
  cancel_url: 'https://ekicare-v3.vercel.app/pricing?canceled=true',
  metadata: {
    userId: 'user_abc123' // ID de votre utilisateur de test
  }
});

// Compléter le paiement avec une carte de test : 4242 4242 4242 4242
```

### 2. Vérifier dans la base de données

```sql
-- Vérifier que le profil pro a été créé/activé
SELECT * FROM pro_profiles WHERE user_id = 'user_abc123';

-- Vérifier la transaction
SELECT * FROM stripe_transactions WHERE user_id = 'user_abc123' ORDER BY created_at DESC LIMIT 1;
```

### 3. Tester la désactivation

```bash
# Annuler l'abonnement via Stripe Dashboard
# Ou via CLI :
stripe subscriptions cancel sub_xxxxx

# Vérifier que le profil a été désactivé
SELECT is_active, deactivation_reason FROM pro_profiles WHERE user_id = 'user_abc123';
```

---

## 🔐 Sécurité

### Utiliser la clé Service Role

Pour bypass les RLS (Row Level Security) dans les webhooks :

```typescript
// ❌ MAL - Utilise la clé publique (RLS actif)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ BIEN - Utilise la clé admin (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Important :** La clé service role doit être dans les variables d'environnement Vercel, jamais dans le code client !

---

## ⚠️ Gestion des erreurs

### Erreurs récupérables vs critiques

```typescript
try {
  // Action critique : activer le profil
  await activateProProfile(userId, stripeData);
  
  // Action non critique : envoyer l'email
  try {
    await sendProActivationEmail(userId, email);
  } catch (emailError) {
    // Ne pas throw - juste logger
    webhookLogger.warn('Email non envoyé', { userId });
  }
  
} catch (error) {
  // Erreur critique - throw pour logger dans le webhook
  throw error;
}
```

---

## 📊 Monitoring et analytics

### Logger les événements importants

```typescript
// Exemple avec un service d'analytics
async function trackProActivation(userId: string, plan: string) {
  try {
    // await analytics.track({
    //   userId,
    //   event: 'pro_profile_activated',
    //   properties: { plan }
    // });
    
    webhookLogger.info('Event analytics envoyé', { userId, event: 'pro_activation' });
  } catch (error) {
    // Non critique
    webhookLogger.warn('Analytics non envoyé', { userId });
  }
}
```

---

## ✅ Checklist d'implémentation

### Base de données

- [ ] Tables créées (`pro_profiles`, `stripe_transactions`)
- [ ] Index créés pour les performances
- [ ] RLS configuré correctement
- [ ] Service role key disponible dans Vercel

### Code

- [ ] Fichier `stripe-actions.ts` créé
- [ ] Fonction `activateProProfile` implémentée
- [ ] Fonction `deactivateProProfile` implémentée
- [ ] Handler mis à jour dans `route.ts`
- [ ] Gestion d'erreur appropriée

### Tests

- [ ] Test activation profil avec paiement réel (mode test)
- [ ] Vérification dans la DB que les données sont correctes
- [ ] Test désactivation avec annulation d'abonnement
- [ ] Test avec userId manquant (doit logger erreur mais retourner 200)

### Production

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Événements Stripe activés (`checkout.session.completed`, etc.)
- [ ] Logs vérifiés dans Vercel après un paiement test
- [ ] Monitoring configuré

---

## 📚 Ressources

- **Code webhook** : `/app/api/stripe/webhook/route.ts`
- **Actions Stripe** : `/lib/stripe-actions.ts` (à créer)
- **Guide production** : `WEBHOOK_PRODUCTION_GUIDE.md`
- **Supabase RLS** : [supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✨ Résumé

Vous avez maintenant :

✅ Une structure claire pour gérer les actions métier  
✅ L'activation/désactivation du profil pro  
✅ L'historique des transactions  
✅ La gestion du cycle de vie des abonnements  
✅ Un système robuste et testable  

**Prêt à implémenter la logique métier ! 🚀**


