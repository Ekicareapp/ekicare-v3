# 🔧 Commandes Stripe CLI pour tester votre Webhook

Référence rapide des commandes Stripe CLI les plus utiles pour tester votre webhook.

---

## 🚀 Installation et Configuration

### Installer Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Windows
scoop install stripe
```

### Se connecter

```bash
stripe login
```

Cela ouvre votre navigateur pour vous authentifier avec votre compte Stripe.

### Vérifier la configuration

```bash
# Afficher la configuration actuelle
stripe config --list

# Vérifier la version
stripe --version
```

---

## 🧪 Tester votre Webhook en Production

### Méthode 1 : Envoyer un événement test direct

Cette méthode envoie un événement test à votre endpoint configuré dans Stripe Dashboard.

```bash
# Créer et envoyer un événement checkout.session.completed
stripe events resend evt_XXXXX
```

**Note :** Vous devez d'abord créer un événement, puis le renvoyer. Voir méthode 3.

### Méthode 2 : Forward vers votre endpoint local

Si vous testez en local (localhost:3000) :

```bash
# Terminal 1 : Démarrer votre app
npm run dev

# Terminal 2 : Forward les webhooks vers local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3 : Trigger un événement
stripe trigger checkout.session.completed
```

**Important :** `stripe listen` vous donnera un nouveau `STRIPE_WEBHOOK_SECRET` pour le mode local.

```bash
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Mettez ce secret dans votre `.env.local` :

```bash
# .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Secret local
```

### Méthode 3 : Créer un événement puis le renvoyer

```bash
# 1. Créer un événement de test
stripe trigger checkout.session.completed

# 2. Lister les événements récents pour obtenir l'ID
stripe events list --limit 5

# 3. Renvoyer l'événement à votre webhook
stripe events resend evt_xxxxx
```

### Méthode 4 : Simuler un paiement complet (le plus réaliste)

```bash
# 1. Créer un produit
stripe products create \
  --name="Abonnement Pro EkiCare" \
  --description="Accès aux fonctionnalités professionnelles"

# 2. Créer un prix
stripe prices create \
  --product=prod_xxxxx \
  --unit-amount=2900 \
  --currency=eur \
  --recurring[interval]=month

# 3. Créer une session de paiement
stripe checkout sessions create \
  --mode=subscription \
  --line-items[0][price]=price_xxxxx \
  --line-items[0][quantity]=1 \
  --success-url="https://ekicare-v3.vercel.app/dashboard?success=true" \
  --cancel-url="https://ekicare-v3.vercel.app/pricing?canceled=true" \
  --metadata[userId]="user_123_test"

# 4. Obtenir l'URL de paiement et l'ouvrir dans le navigateur
# 5. Utiliser une carte de test : 4242 4242 4242 4242
```

---

## 📋 Commandes utiles

### Lister les événements

```bash
# Tous les événements récents
stripe events list

# Les 10 derniers événements
stripe events list --limit 10

# Événements d'un type spécifique
stripe events list --type checkout.session.completed

# Événements des dernières 24h
stripe events list --created gte=$(date -u -d '24 hours ago' +%s)
```

### Voir les détails d'un événement

```bash
stripe events retrieve evt_xxxxx
```

### Lister vos webhooks endpoints

```bash
stripe webhook-endpoints list
```

### Voir les détails d'un endpoint

```bash
stripe webhook-endpoints retrieve we_xxxxx
```

### Créer un nouveau endpoint (si besoin)

```bash
stripe webhook-endpoints create \
  --url "https://ekicare-v3.vercel.app/api/stripe/webhook" \
  --enabled-events checkout.session.completed \
  --enabled-events payment_intent.succeeded \
  --api-version "2025-08-27.basil"
```

### Supprimer un endpoint

```bash
stripe webhook-endpoints delete we_xxxxx
```

### Mettre à jour un endpoint

```bash
stripe webhook-endpoints update we_xxxxx \
  --url "https://ekicare-v3.vercel.app/api/stripe/webhook"
```

---

## 🎯 Workflow de Test Recommandé

### Test Rapide (30 secondes)

```bash
# Option 1 : Via Dashboard (le plus simple)
# 1. Ouvrir https://dashboard.stripe.com/test/webhooks
# 2. Cliquer sur l'endpoint
# 3. Send test event > checkout.session.completed

# Option 2 : Via CLI
stripe trigger checkout.session.completed
```

### Test Complet (5 minutes)

```bash
# 1. Tester que l'endpoint est accessible
node test-webhook-stripe.js

# 2. Démarrer le forward en local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 3. Dans un autre terminal, trigger un événement
stripe trigger checkout.session.completed

# 4. Vérifier les logs dans le terminal où tourne stripe listen
# Vous devriez voir :
#   --> checkout.session.completed [evt_xxxxx]
#   <-- [200] POST http://localhost:3000/api/stripe/webhook
```

### Test Production (après déploiement)

```bash
# 1. Vérifier que l'endpoint est configuré
stripe webhook-endpoints list

# 2. Envoyer un événement test depuis le Dashboard
# https://dashboard.stripe.com/test/webhooks

# 3. Vérifier les logs Vercel
vercel logs --follow

# 4. Vérifier dans Stripe Dashboard que la réponse est 200 OK
```

---

## 🔍 Debug avec Stripe CLI

### Voir les logs en temps réel

```bash
stripe listen --print-secret
```

Cela affiche :
- Tous les événements entrants
- Les tentatives de delivery
- Les réponses de votre endpoint

### Tester avec des données spécifiques

```bash
# Créer une session avec metadata personnalisée
stripe checkout sessions create \
  --mode=payment \
  --line-items[0][price]=price_xxxxx \
  --line-items[0][quantity]=1 \
  --success-url="https://ekicare-v3.vercel.app/success" \
  --metadata[userId]="user_abc123" \
  --metadata[plan]="pro"
```

### Voir les webhook delivery attempts

```bash
# Lister les tentatives de delivery
stripe events list --type checkout.session.completed --limit 1

# Voir les détails incluant les delivery attempts
stripe events retrieve evt_xxxxx --expand data.delivery_attempts
```

---

## 🐛 Troubleshooting

### Problème : "No such webhook endpoint"

```bash
# Lister vos endpoints
stripe webhook-endpoints list

# Créer un nouvel endpoint si besoin
stripe webhook-endpoints create \
  --url "https://ekicare-v3.vercel.app/api/stripe/webhook" \
  --enabled-events checkout.session.completed
```

### Problème : "Invalid signature"

```bash
# 1. Récupérer le secret actuel de l'endpoint
stripe webhook-endpoints retrieve we_xxxxx

# 2. Comparer avec votre STRIPE_WEBHOOK_SECRET dans Vercel

# 3. Si différent, mettre à jour dans Vercel :
#    Settings > Environment Variables > STRIPE_WEBHOOK_SECRET

# 4. Redéployer
vercel --prod
```

### Problème : Events not forwarding en local

```bash
# Vérifier que stripe listen tourne
ps aux | grep stripe

# Relancer avec verbose
stripe listen --forward-to localhost:3000/api/stripe/webhook --log-level debug

# Vérifier que votre app tourne
curl http://localhost:3000/api/stripe/webhook
```

---

## 📊 Cartes de Test Stripe

Pour tester de vrais paiements :

```
Succès :        4242 4242 4242 4242
Échec :         4000 0000 0000 0002
Authentification: 4000 0025 0000 3155
Débit différé :  4000 0000 0000 3063

Date : N'importe quelle date future
CVC : N'importe quel 3 chiffres
ZIP : N'importe quel code postal
```

---

## 🎉 Commandes favorites (à garder sous la main)

```bash
# Test ultra-rapide
stripe trigger checkout.session.completed

# Voir les derniers événements
stripe events list --limit 5

# Forward en local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Voir les logs d'un événement
stripe events retrieve evt_xxxxx

# Lister les endpoints
stripe webhook-endpoints list

# Vérifier le secret d'un endpoint
stripe webhook-endpoints retrieve we_xxxxx
```

---

## 📚 Ressources

- **Doc officielle :** [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Testing webhooks :** [stripe.com/docs/webhooks/test](https://stripe.com/docs/webhooks/test)
- **Events reference :** [stripe.com/docs/api/events](https://stripe.com/docs/api/events)

---

## ✨ Résumé

Vous avez maintenant toutes les commandes pour :
- ✅ Tester rapidement votre webhook
- ✅ Debugger les problèmes de signature
- ✅ Créer des scénarios de test réalistes
- ✅ Monitorer les événements en temps réel
- ✅ Gérer vos endpoints webhook

**Happy testing ! 🚀**






