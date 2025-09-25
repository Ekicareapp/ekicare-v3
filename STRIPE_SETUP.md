# Guide d'intégration Stripe CLI

## 🚀 Configuration Stripe CLI

### 1. Installation de Stripe CLI

```bash
# macOS (avec Homebrew)
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis https://stripe.com/docs/stripe-cli
```

### 2. Connexion à votre compte Stripe

```bash
stripe login
```

### 3. Écouter les webhooks en local

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Important :** Notez la clé webhook affichée dans le terminal (format : `whsec_xxxxxxx`)

### 4. Configuration des variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxx
STRIPE_PRICE_ID=price_xxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🧪 Test de paiement

### 1. Cartes de test Stripe

Utilisez ces cartes pour tester les paiements :

**Carte de test réussie :**
- Numéro : `4242 4242 4242 4242`
- Date : `12/34` (n'importe quelle date future)
- CVC : `123`

**Carte de test échouée :**
- Numéro : `4000 0000 0000 0002`
- Date : `12/34`
- CVC : `123`

### 2. Flow de test complet

1. **Inscription professionnel** → Redirection automatique vers Stripe
2. **Paiement avec carte test** → Utiliser `4242 4242 4242 4242`
3. **Webhook automatique** → Vérification dans les logs
4. **Redirection succès** → Accès au dashboard pro

### 3. Vérification des logs

**Logs attendus dans la console :**

```
💳 Création d'une session de paiement Stripe
👤 Utilisateur authentifié: user_123, user@example.com
✅ Session Stripe créée: cs_test_xxxxxxx
🔗 URL de paiement: https://checkout.stripe.com/...

🔔 Webhook Stripe reçu
✅ Signature webhook vérifiée
💳 Traitement du paiement: cs_test_xxxxxxx
📧 Email client: user@example.com
🆔 Client reference ID: user_123
👤 User ID à vérifier: user_123
✅ Utilisateur professionnel trouvé: {id: "user_123", role: "PRO"}
✅ Paiement vérifié avec succès pour l'utilisateur: user_123

🎉 Page de succès chargée avec le statut: success
```

## 🔧 Dépannage

### Problème : Webhook non reçu
- Vérifiez que Stripe CLI est en cours d'exécution
- Vérifiez que l'URL du webhook est correcte
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré

### Problème : Signature invalide
- Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond à celui affiché par `stripe listen`
- Redémarrez le serveur après modification des variables d'environnement

### Problème : Utilisateur non trouvé
- Vérifiez que l'utilisateur est bien créé avec le rôle `PRO`
- Vérifiez que `client_reference_id` est bien transmis dans la session Stripe

## 📝 Commandes utiles

```bash
# Voir les événements reçus
stripe events list

# Tester un webhook spécifique
stripe events resend evt_xxxxxxx

# Voir les logs en temps réel
stripe listen --forward-to localhost:3001/api/stripe/webhook --print-json
```
