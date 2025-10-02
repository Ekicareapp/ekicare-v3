# 📅 Guide Complet du Système de Rendez-vous Ekicare

## 🎯 Vue d'ensemble

Le système de rendez-vous Ekicare permet aux propriétaires d'équidés de prendre rendez-vous avec des professionnels vérifiés et aux professionnels de gérer leurs rendez-vous de manière efficace.

## 🏗️ Architecture du Système

### Base de données

**Table `appointments`** :
```sql
- id: UUID (clé primaire)
- pro_id: UUID (référence vers pro_profiles.user_id)
- proprio_id: UUID (référence vers proprio_profiles.user_id)
- equide_ids: UUID[] (tableau des équidés concernés)
- main_slot: TIMESTAMP (créneau principal)
- alternative_slots: TIMESTAMP[] (créneaux alternatifs, max 2)
- duration_minutes: INTEGER (durée en minutes, défaut: 60)
- status: TEXT (pending, confirmed, rejected, rescheduled, completed)
- comment: TEXT (motif de consultation obligatoire)
- compte_rendu: TEXT (compte rendu du professionnel)
- compte_rendu_updated_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### APIs

1. **`GET /api/appointments`** - Récupérer les rendez-vous de l'utilisateur connecté
2. **`POST /api/appointments`** - Créer une nouvelle demande de rendez-vous
3. **`GET /api/appointments/[id]`** - Récupérer un rendez-vous spécifique
4. **`PATCH /api/appointments/[id]`** - Mettre à jour un rendez-vous
5. **`POST /api/appointments/update-status`** - Mise à jour automatique des statuts

## 🔄 Flow Complet des Rendez-vous

### 1. Création de la demande (Côté Propriétaire)

**Interface** : `/dashboard/proprietaire/recherche-pro`

**Processus** :
1. Le propriétaire recherche un professionnel
2. Il clique sur "Demander un rendez-vous"
3. Il remplit le formulaire :
   - Sélection d'un ou plusieurs équidés
   - Créneau principal (date + heure)
   - Créneaux alternatifs (optionnels, max 2)
   - Commentaire obligatoire (motif de consultation)
4. Envoi de la demande → `status = 'pending'`

**Validation** :
- Le professionnel doit être vérifié (`is_verified = true`)
- Le professionnel doit être abonné (`is_subscribed = true`)
- Les équidés doivent appartenir au propriétaire
- Le créneau principal doit être dans le futur
- Le commentaire doit contenir au moins 10 caractères

### 2. Réception et Gestion (Côté Professionnel)

**Interface** : `/dashboard/pro/rendez-vous`

**Statuts et Actions** :

#### 📋 En attente (`pending`)
Le professionnel peut :
- ✅ **Accepter** → `status = 'confirmed'`
- ❌ **Refuser** → `status = 'rejected'`
- 🔄 **Replanifier** → `status = 'rescheduled'` + nouvelle date proposée

#### 📅 À venir (`confirmed`)
- Pas d'action manuelle
- Transition automatique vers `completed` après la date + 1h

#### 🔄 Replanifiés (`rescheduled`)
- En attente de réponse du propriétaire
- Le propriétaire peut accepter ou refuser la nouvelle proposition

#### ✅ Terminés (`completed`)
- Le professionnel peut ajouter/modifier un compte-rendu
- Le propriétaire peut consulter le compte-rendu

#### ❌ Refusés (`rejected`)
- Aucune action possible
- Rendez-vous définitivement annulé

### 3. Gestion des Replanifications

**Côté Professionnel** :
1. Sélectionne "Replanifier"
2. Propose une nouvelle date/heure
3. Le statut passe à `rescheduled`
4. Attente de la réponse du propriétaire

**Côté Propriétaire** :
1. Voit la replanification dans "En attente"
2. Peut accepter → `status = 'confirmed'`
3. Peut refuser → `status = 'rejected'`
4. Peut proposer une nouvelle replanification

### 4. Passage Automatique en Terminé

**Déclencheur** : Appel de `/api/appointments/update-status`

**Condition** : `main_slot < NOW() - 1 hour` ET `status = 'confirmed'`

**Action** : `status = 'completed'`

## 📱 Interfaces Utilisateur

### Côté Propriétaire

#### Recherche de Professionnels
- **Page** : `/dashboard/proprietaire/recherche-pro`
- **Fonctionnalités** :
  - Recherche par localisation
  - Filtrage par spécialité
  - Affichage des professionnels vérifiés
  - Modal de demande de rendez-vous

#### Gestion des Rendez-vous
- **Page** : `/dashboard/proprietaire/rendez-vous`
- **Onglets** :
  - En attente : Demandes en cours de traitement
  - À venir : Rendez-vous confirmés
  - Replanifiés : Replanifications du professionnel
  - Refusés : Rendez-vous refusés
  - Terminés : Rendez-vous passés avec compte-rendus

### Côté Professionnel

#### Gestion des Rendez-vous
- **Page** : `/dashboard/pro/rendez-vous`
- **Onglets** :
  - En attente : Nouvelles demandes + replanifications
  - À venir : Rendez-vous confirmés
  - Replanifiés : Replanifications proposées
  - Refusés : Rendez-vous refusés
  - Terminés : Rendez-vous passés avec gestion des compte-rendus

## 🔧 Configuration et Déploiement

### Prérequis

1. **Table appointments créée** avec la structure définie
2. **RLS activé** avec les politiques appropriées
3. **Variables d'environnement** configurées :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Scripts de Test

```bash
# Test complet du système
node test-appointments-system.js

# Test de la structure de la table
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Test de la table...
"
```

## 🚀 Fonctionnalités Avancées

### Gestion des Créneaux

- **Créneaux alternatifs** : Le propriétaire peut proposer jusqu'à 2 créneaux alternatifs
- **Durée adaptative** : Utilise `average_consultation_duration` du professionnel
- **Validation temporelle** : Tous les créneaux doivent être dans le futur

### Compte-rendus

- **Ajout** : Le professionnel peut ajouter un compte-rendu après le rendez-vous
- **Modification** : Le compte-rendu peut être modifié à tout moment
- **Consultation** : Le propriétaire peut consulter le compte-rendu dans "Terminés"

### Notifications et Suivi

- **Statuts en temps réel** : Mise à jour automatique toutes les 5 minutes
- **Historique complet** : Suivi de tous les changements de statut
- **Traçabilité** : Timestamps pour création et modification

## 🔒 Sécurité et RLS

### Politiques Row Level Security

```sql
-- Les professionnels voient leurs rendez-vous
CREATE POLICY "Pros can view their appointments" ON appointments
  FOR SELECT USING (pro_id = auth.uid());

-- Les propriétaires voient leurs rendez-vous
CREATE POLICY "Proprios can view their appointments" ON appointments
  FOR SELECT USING (proprio_id = auth.uid());

-- Les professionnels peuvent modifier leurs rendez-vous
CREATE POLICY "Pros can update their appointments" ON appointments
  FOR UPDATE USING (pro_id = auth.uid());

-- Les propriétaires peuvent créer leurs rendez-vous
CREATE POLICY "Proprios can create appointments" ON appointments
  FOR INSERT WITH CHECK (proprio_id = auth.uid());

-- Les propriétaires peuvent modifier leurs rendez-vous
CREATE POLICY "Proprios can update their appointments" ON appointments
  FOR UPDATE USING (proprio_id = auth.uid());
```

### Validation des Données

- **Authentification** : Vérification de l'utilisateur connecté
- **Autorisation** : Vérification des permissions selon le rôle
- **Validation** : Contrôle des données avant insertion/mise à jour
- **Intégrité** : Vérification des relations entre les tables

## 📊 Métriques et Monitoring

### Indicateurs Clés

- **Demandes créées** : Nombre de demandes par jour/semaine
- **Taux d'acceptation** : Pourcentage de demandes acceptées
- **Temps de réponse** : Délai moyen de traitement des demandes
- **Replanifications** : Fréquence des replanifications

### Logs et Debugging

- **Logs détaillés** : Toutes les actions sont loggées
- **Gestion d'erreurs** : Messages d'erreur explicites
- **Validation** : Vérification des données à chaque étape

## 🎯 Roadmap et Améliorations Futures

### Fonctionnalités Prévues

1. **Notifications push** : Alertes en temps réel
2. **Calendrier intégré** : Vue calendrier des rendez-vous
3. **Rappels automatiques** : Notifications avant le rendez-vous
4. **Système de notation** : Évaluation des professionnels
5. **Paiement intégré** : Gestion des paiements via Stripe
6. **Planification récurrente** : Rendez-vous réguliers

### Optimisations Techniques

1. **Cache Redis** : Mise en cache des requêtes fréquentes
2. **Indexation** : Optimisation des requêtes de recherche
3. **Pagination** : Gestion des grandes listes de rendez-vous
4. **Websockets** : Mise à jour en temps réel

## 🆘 Dépannage

### Problèmes Courants

1. **Table appointments non accessible**
   - Vérifier la structure de la table
   - Vérifier les permissions RLS

2. **Erreurs de validation**
   - Vérifier les données d'entrée
   - Vérifier les contraintes de la base

3. **Problèmes d'authentification**
   - Vérifier les tokens Supabase
   - Vérifier les politiques RLS

### Commandes de Diagnostic

```bash
# Vérifier la structure de la table
node -e "console.log('Test de la table appointments')"

# Tester les APIs
curl -X GET http://localhost:3000/api/appointments

# Vérifier les logs
tail -f logs/app.log
```

---

## 📞 Support

Pour toute question ou problème :
1. Consulter ce guide
2. Vérifier les logs d'erreur
3. Tester avec le script de test
4. Contacter l'équipe de développement

**Le système de rendez-vous Ekicare est maintenant opérationnel ! 🎉**
