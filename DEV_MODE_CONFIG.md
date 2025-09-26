# 🚧 Configuration Mode Développement - Désactivation Temporaire des Vérifications

## ⚠️ IMPORTANT
Ce fichier documente les modifications temporaires effectuées pour désactiver les vérifications d'accès en mode développement.

## 🔧 Modifications Effectuées

### 1. Composant AuthGuard (`/components/AuthGuard.tsx`)
- **Désactivé** : Vérification de session Supabase
- **Mode dev** : `process.env.NODE_ENV === 'development'` → Accès libre
- **Log** : `🚧 MODE DÉVELOPPEMENT: AuthGuard désactivé - Accès libre aux dashboards`

### 2. Layout Dashboard Pro (`/app/dashboard/pro/layout.tsx`)
- **Désactivé** : Vérification `is_verified` et `is_subscribed`
- **Désactivé** : Redirection vers `/paiement-requis`
- **Mode dev** : `process.env.NODE_ENV === 'development'` → Accès libre
- **Log** : `🚧 MODE DÉVELOPPEMENT: Vérifications de rôle désactivées - Accès libre au dashboard Pro`

### 3. API Login (`/app/api/auth/login/route.ts`)
- **Désactivé** : Vérification `is_verified` pour les professionnels
- **Désactivé** : Retour du flag `requiresPayment`
- **Mode dev** : `process.env.NODE_ENV === 'development'` → Bypass des vérifications
- **Log** : `🚧 MODE DÉVELOPPEMENT: Vérifications de paiement désactivées pour les professionnels`

### 4. Page Login (`/app/login/page.tsx`)
- **Désactivé** : Redirection vers `/paiement-requis` pour les professionnels non vérifiés
- **Mode dev** : `process.env.NODE_ENV === 'development'` → Redirection directe vers dashboard
- **Log** : `🚧 MODE DÉVELOPPEMENT: Redirection vers paiement désactivée - Accès direct au dashboard`

## 🔄 Réactivation des Vérifications

Pour réactiver toutes les vérifications, il suffit de :

1. **Changer l'environnement** : `NODE_ENV=production`
2. **Ou modifier les conditions** : Remplacer `!DEV_MODE` par `true` dans tous les fichiers

### Fichiers à modifier pour réactivation :
- `/components/AuthGuard.tsx`
- `/app/dashboard/pro/layout.tsx`
- `/app/api/auth/login/route.ts`
- `/app/login/page.tsx`

## 🎯 Comportement Actuel (Mode Dev)

### ✅ Accès Libre
- **Dashboard Propriétaire** : `/dashboard/proprietaire/*`
- **Dashboard Professionnel** : `/dashboard/pro/*`
- **Sans authentification** : Accès direct aux dashboards
- **Sans vérification de paiement** : Les professionnels accèdent directement

### 🔍 Logs de Debug
Tous les bypasss sont loggés avec le préfixe `🚧 MODE DÉVELOPPEMENT:` pour faciliter le debugging.

## ⚠️ Sécurité

**NE JAMAIS DÉPLOYER EN PRODUCTION** avec ces modifications actives. Les vérifications sont automatiquement réactivées en production grâce à `process.env.NODE_ENV === 'development'`.
