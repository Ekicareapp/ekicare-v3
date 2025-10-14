# Flow Complet des Rendez-vous Ekicare

## Vue d'ensemble

Ce document décrit le flow complet de gestion des rendez-vous entre les propriétaires d'équidés et les professionnels de santé équine.

## Statuts des rendez-vous

Le système utilise 5 statuts principaux :

1. **`pending`** - En attente de validation/réponse
2. **`confirmed`** - Rendez-vous confirmé
3. **`rescheduled`** - Demande de replanification en attente
4. **`rejected`** - Rendez-vous refusé
5. **`completed`** - Rendez-vous terminé ou annulé

---

## Côté Professionnel (PRO)

### Onglets (5 tabs)

#### 1. En attente (`pending`)
**Contenu :**
- Demandes de rendez-vous reçues des propriétaires
- Demandes de replanification envoyées par les propriétaires

**Actions disponibles :**
- ✅ **Accepter** → Change le statut en `confirmed`
- ❌ **Refuser** → Change le statut en `rejected`
- 🔄 **Replanifier** → Change le statut en `rescheduled` (le pro propose une nouvelle date)

#### 2. À venir (`confirmed`)
**Contenu :**
- Rendez-vous acceptés et confirmés

**Actions disponibles :**
- 👤 **Fiche client** → Affiche les informations du client
- 📞 **Appeler** → Lance un appel téléphonique
- 📍 **Ouvrir GPS** → Ouvre Google Maps
- 🔄 **Replanifier** → Change le statut en `rescheduled`
- ❌ **Annuler le rendez-vous** → Change le statut en `completed` (sans compte-rendu)

#### 3. Replanifiés (`rescheduled`)
**Contenu :**
- Demandes de replanification envoyées par le pro (en attente de validation du propriétaire)

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous
- ❌ **Annuler la replanification** → Remet le statut en `confirmed`

#### 4. Terminés (`completed`)
**Contenu :**
- Rendez-vous dont la date est passée
- Rendez-vous annulés (avec ou sans compte-rendu)

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous
- ✏️ **Ajouter un compte-rendu** → Permet de rédiger un compte-rendu
- ✏️ **Modifier le compte-rendu** → Permet de modifier un compte-rendu existant
- 📄 **Voir le compte-rendu** → Affiche le compte-rendu (si existant)

#### 5. Refusés (`rejected`)
**Contenu :**
- Rendez-vous refusés par le pro
- Demandes de replanification refusées par le propriétaire

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous uniquement

---

## Côté Propriétaire (PROPRIO)

### Onglets (4 tabs)

#### 1. En attente (`pending`)
**Contenu :**
- Demandes de rendez-vous envoyées aux professionnels
- Demandes de replanification reçues des professionnels (statut `rescheduled` du pro)

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous
- ❌ **Annuler la demande** → Change le statut en `completed`

**Note :** Quand le proprio voit un rendez-vous en statut `rescheduled`, il peut :
- ✅ **Accepter la replanification** → Change le statut en `confirmed`
- ❌ **Refuser la replanification** → Change le statut en `rejected`

#### 2. À venir (`confirmed`)
**Contenu :**
- Rendez-vous confirmés par le professionnel

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous
- 🔄 **Replanifier** → Renvoie une demande (le rendez-vous repasse en `pending`)
- ❌ **Annuler le rendez-vous** → Change le statut en `completed`

#### 3. Terminés (`completed`)
**Contenu :**
- Rendez-vous passés
- Rendez-vous annulés

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous
- 📄 **Voir le compte-rendu** → Affiche le compte-rendu du pro (si disponible)

#### 4. Refusés (`rejected`)
**Contenu :**
- Demandes de rendez-vous refusées par le professionnel
- Demandes de replanification refusées

**Actions disponibles :**
- 👁️ **Voir détail** → Affiche les informations du rendez-vous uniquement

---

## Transitions de statuts

### Schéma des transitions

```
PROPRIO crée un RDV
    ↓
[PENDING] ──────────────────────────────────┐
    │                                       │
    │ PRO accepte                           │ PRO refuse
    ↓                                       │
[CONFIRMED] ─────────────────┐              │
    │                        │              │
    │ PRO/PROPRIO            │ PRO/PROPRIO  │
    │ replanifie             │ annule       │
    ↓                        ↓              ↓
[RESCHEDULED]           [COMPLETED]    [REJECTED]
    │
    │ PROPRIO accepte
    └──→ [CONFIRMED]
    │
    │ PROPRIO refuse
    └──→ [REJECTED]
```

### Détails des transitions

| Statut actuel | Action | Qui peut faire | Nouveau statut |
|--------------|---------|----------------|----------------|
| `pending` | Accepter | PRO | `confirmed` |
| `pending` | Refuser | PRO | `rejected` |
| `pending` | Replanifier | PRO | `rescheduled` |
| `pending` | Annuler | PROPRIO | `completed` |
| `confirmed` | Replanifier | PRO ou PROPRIO | `rescheduled` ou `pending` |
| `confirmed` | Annuler | PRO ou PROPRIO | `completed` |
| `rescheduled` | Accepter | PROPRIO | `confirmed` |
| `rescheduled` | Refuser | PROPRIO | `rejected` |
| `rescheduled` | Annuler | PRO | `confirmed` |
| `completed` | Ajouter compte-rendu | PRO | `completed` |

---

## Gestion automatique

### Passage automatique en `completed`

Un script automatique (`/api/appointments/update-status`) vérifie toutes les 5 minutes si des rendez-vous ont une date passée et les passe automatiquement en statut `completed`.

### Synchronisation temps réel

Grâce à **Supabase Realtime**, les deux parties (PRO et PROPRIO) voient les changements de statut en temps réel sans avoir besoin de rafraîchir la page.

---

## Compte-rendu

### Création et modification

- **Qui peut :** Seul le PRO peut créer ou modifier un compte-rendu
- **Quand :** Uniquement pour les rendez-vous en statut `completed`
- **Où :** Dans l'onglet "Terminés" côté PRO

### Consultation

- **Qui peut :** Le PROPRIO peut consulter le compte-rendu
- **Quand :** Uniquement si le PRO a créé un compte-rendu
- **Où :** Dans l'onglet "Terminés" côté PROPRIO

---

## Distinction entre "Terminé" et "Annulé"

Dans l'onglet "Terminés", on distingue :

- **Terminé** = Rendez-vous qui a eu lieu + compte-rendu présent
- **Annulé** = Rendez-vous qui n'a pas eu lieu (statut `completed` sans compte-rendu)

Un badge visuel indique cette différence :
- Badge vert "Terminé" si compte-rendu présent
- Badge jaune "Annulé" si pas de compte-rendu

---

## Notifications et messages

### Messages de succès

| Action | Message affiché |
|--------|----------------|
| Accepter un RDV | "Rendez-vous accepté avec succès" |
| Refuser un RDV | "Rendez-vous refusé" |
| Replanifier (PRO) | "Demande de replanification envoyée au client" |
| Replanifier (PROPRIO) | "Demande de replanification envoyée au professionnel" |
| Annuler un RDV | "Rendez-vous annulé avec succès" |
| Annuler une replanification | "Demande de replanification annulée" |
| Ajouter un compte-rendu | "Compte rendu ajouté avec succès" |

---

## Fichiers concernés

### Frontend
- `/app/dashboard/pro/rendez-vous/page.tsx` - Interface PRO
- `/app/dashboard/proprietaire/rendez-vous/page.tsx` - Interface PROPRIO
- `/app/dashboard/pro/components/` - Composants réutilisables (Card, Button, Modal, Tabs, Toast)
- `/app/dashboard/proprietaire/components/` - Composants réutilisables

### Backend
- `/app/api/appointments/route.ts` - GET et POST pour les rendez-vous
- `/app/api/appointments/[id]/route.ts` - PATCH pour mettre à jour un rendez-vous
- `/app/api/appointments/update-status/route.ts` - Script automatique pour passer les RDV en "completed"

### Utilitaires
- `/lib/dateUtils.ts` - Fonctions pour gérer les dates et heures (UTC, affichage)
- `/lib/supabaseClient.ts` - Client Supabase pour les appels API

---

## Tests recommandés

### Scénario 1 : Création et acceptation
1. PROPRIO crée un rendez-vous → Statut `pending`
2. PRO accepte → Statut `confirmed`
3. RDV s'affiche dans "À venir" des deux côtés

### Scénario 2 : Replanification par le PRO
1. PROPRIO crée un rendez-vous → Statut `pending`
2. PRO demande une replanification → Statut `rescheduled`
3. PROPRIO accepte → Statut `confirmed`

### Scénario 3 : Replanification par le PROPRIO
1. Rendez-vous confirmé → Statut `confirmed`
2. PROPRIO demande une replanification → Statut `pending`
3. PRO accepte → Statut `confirmed`

### Scénario 4 : Annulation
1. Rendez-vous confirmé → Statut `confirmed`
2. PRO ou PROPRIO annule → Statut `completed`
3. RDV s'affiche dans "Terminés" avec badge "Annulé"

### Scénario 5 : Compte-rendu
1. Rendez-vous terminé → Statut `completed`
2. PRO ajoute un compte-rendu
3. PROPRIO peut consulter le compte-rendu
4. Badge "Terminé" apparaît

---

## Notes importantes

1. **Synchronisation temps réel** : Les changements sont visibles instantanément grâce à Supabase Realtime
2. **Sécurité** : Chaque action vérifie les permissions (seul le PRO concerné peut accepter, seul le PROPRIO concerné peut annuler sa demande, etc.)
3. **Historique** : Tous les changements sont tracés via `updated_at` dans la base de données
4. **Alternative slots** : Lors de la création ou replanification, le demandeur peut proposer des créneaux alternatifs

---

*Document créé le 8 octobre 2025*
*Version 1.0*









