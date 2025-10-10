# Configuration des Variables d'Environnement

## Problème identifié
Votre application ne peut pas se connecter à Supabase car les variables d'environnement ne sont pas configurées.

## Solution

### 1. Créer le fichier .env.local
Créez un fichier `.env.local` dans le répertoire racine de votre projet avec le contenu suivant :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase

# Stripe Configuration (optionnel pour le moment)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Obtenir vos clés Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet Ekicare
4. Allez dans **Settings** > **API**
5. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Redémarrer le serveur
```bash
npm run dev
```

### 4. Tester la connexion
Une fois les variables configurées, testez :
```bash
curl -s http://localhost:3000/api/test
```

Vous devriez voir les utilisateurs de votre base de données.

## Vérification
Après avoir configuré les variables d'environnement :

1. **Inscription** : Devrait créer l'utilisateur dans `auth.users` ET `public.users`
2. **Connexion** : Devrait fonctionner correctement
3. **Redirection** : Devrait rediriger vers les bonnes pages

## Note importante
Sans ces variables d'environnement, Supabase ne peut pas se connecter à votre base de données, c'est pourquoi :
- L'inscription ne crée pas d'utilisateur dans la table `users`
- La connexion ne fonctionne pas
- Les redirections échouent
