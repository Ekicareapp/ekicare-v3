# Guide de Tests - Flow Rendez-vous Ekicare

Ce document décrit les tests à effectuer pour valider le flow complet de gestion des rendez-vous.

---

## Prérequis

1. Avoir deux comptes de test :
   - Un compte **PROPRIETAIRE** (proprio)
   - Un compte **PRO** (professionnel)
2. Serveur de développement lancé sur `http://localhost:3002`
3. Base de données Supabase configurée avec RLS activé
4. Realtime activé sur la table `appointments`

---

## Test 1 : Création et acceptation d'un rendez-vous

### Objectif
Vérifier qu'un propriétaire peut créer un rendez-vous et qu'un professionnel peut l'accepter.

### Étapes

1. **Connexion PROPRIO**
   - Se connecter avec le compte propriétaire
   - Aller dans "Recherche pro"
   - Chercher un professionnel
   - Créer un rendez-vous avec :
     - Date et heure principale
     - 1-2 créneaux alternatifs
     - Motif de consultation
     - Sélection d'équidés

2. **Vérification PROPRIO**
   - ✅ Le RDV apparaît dans l'onglet "En attente"
   - ✅ Statut affiché : "En attente"
   - ✅ Actions disponibles : "Voir détail" + "Annuler la demande"

3. **Connexion PRO** (dans un autre onglet/navigateur)
   - Se connecter avec le compte professionnel
   - Aller dans "Mes rendez-vous"
   - Onglet "En attente"

4. **Vérification PRO**
   - ✅ Le RDV apparaît instantanément (grâce au Realtime)
   - ✅ Statut affiché : "En attente"
   - ✅ Actions disponibles : "Voir détail" + "Accepter" + "Refuser" + "Replanifier"

5. **Action PRO : Accepter**
   - Cliquer sur les 3 points verticaux
   - Cliquer sur "Accepter"
   - ✅ Message de succès : "Rendez-vous accepté avec succès"
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "À venir"

6. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "À venir"
   - ✅ Changement instantané grâce au Realtime

### Résultat attendu
✅ Flow de création et acceptation fonctionnel avec synchronisation temps réel

---

## Test 2 : Replanification initiée par le PRO

### Objectif
Vérifier qu'un professionnel peut proposer une replanification et que le propriétaire peut l'accepter/refuser.

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `pending` (depuis Test 1)

2. **Action PRO : Replanifier**
   - Onglet "En attente" côté PRO
   - Cliquer sur "Replanifier"
   - Sélectionner une nouvelle date et heure
   - Cliquer sur "Confirmer la replanification"
   - ✅ Message : "Demande de replanification envoyée au client"
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "Replanifiés"

3. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV apparaît dans "En attente"
   - ✅ Badge bleu "Demande de replanification" visible
   - ✅ Actions disponibles : "Accepter la replanification" + "Refuser la replanification"

4. **Action PROPRIO : Accepter**
   - Cliquer sur "Accepter la replanification"
   - ✅ Message : "Replanification acceptée avec succès"
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "À venir"
   - ✅ Nouvelle date/heure affichée

5. **Vérification PRO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "Replanifiés"
   - ✅ Le RDV apparaît dans "À venir"

### Résultat attendu
✅ Flow de replanification par le PRO fonctionnel avec synchronisation temps réel

---

## Test 3 : Replanification initiée par le PROPRIO

### Objectif
Vérifier qu'un propriétaire peut proposer une replanification d'un rendez-vous confirmé.

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `confirmed`

2. **Action PROPRIO : Replanifier**
   - Onglet "À venir" côté PROPRIO
   - Cliquer sur "Replanifier"
   - Sélectionner une nouvelle date et heure
   - Cliquer sur "Proposer la replanification"
   - ✅ Message : "Demande de replanification envoyée au professionnel"
   - ✅ Le RDV disparaît de "À venir"
   - ✅ Le RDV apparaît dans "En attente"

3. **Vérification PRO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "À venir"
   - ✅ Le RDV apparaît dans "En attente"
   - ✅ Actions disponibles : "Accepter" + "Refuser" + "Replanifier"

4. **Action PRO : Accepter**
   - Cliquer sur "Accepter"
   - ✅ Message : "Rendez-vous accepté avec succès"
   - ✅ Le RDV apparaît dans "À venir"
   - ✅ Nouvelle date/heure affichée

5. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "À venir"

### Résultat attendu
✅ Flow de replanification par le PROPRIO fonctionnel avec synchronisation temps réel

---

## Test 4 : Annulation d'un rendez-vous

### Objectif
Vérifier qu'un rendez-vous peut être annulé par le PRO ou le PROPRIO.

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `confirmed`

2. **Action PRO : Annuler**
   - Onglet "À venir" côté PRO
   - Cliquer sur "Annuler le rendez-vous"
   - Confirmer dans le modal
   - ✅ Message : "Rendez-vous annulé avec succès"
   - ✅ Le RDV disparaît de "À venir"
   - ✅ Le RDV apparaît dans "Terminés"
   - ✅ Badge jaune "Annulé" visible

3. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "À venir"
   - ✅ Le RDV apparaît dans "Terminés"
   - ✅ Badge jaune "Annulé" visible

### Résultat attendu
✅ Flow d'annulation fonctionnel avec synchronisation temps réel

---

## Test 5 : Annulation d'une demande en attente

### Objectif
Vérifier qu'un propriétaire peut annuler sa demande de rendez-vous en attente.

### Étapes

1. **État initial**
   - Créer un nouveau rendez-vous (statut `pending`)

2. **Action PROPRIO : Annuler la demande**
   - Onglet "En attente" côté PROPRIO
   - Cliquer sur "Annuler la demande"
   - Confirmer dans le modal
   - ✅ Message : "Rendez-vous annulé avec succès"
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "Terminés"

3. **Vérification PRO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "Terminés" ou ne s'affiche plus

### Résultat attendu
✅ Annulation de demande en attente fonctionnelle

---

## Test 6 : Refus d'un rendez-vous

### Objectif
Vérifier qu'un professionnel peut refuser un rendez-vous.

### Étapes

1. **État initial**
   - Créer un nouveau rendez-vous (statut `pending`)

2. **Action PRO : Refuser**
   - Onglet "En attente" côté PRO
   - Cliquer sur "Refuser"
   - ✅ Message : "Rendez-vous refusé"
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "Refusés"

3. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "Refusés"
   - ✅ Aucune action disponible (sauf "Voir détail")

### Résultat attendu
✅ Refus de rendez-vous fonctionnel avec synchronisation temps réel

---

## Test 7 : Annulation d'une replanification (PRO)

### Objectif
Vérifier qu'un professionnel peut annuler sa demande de replanification.

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `rescheduled` (replanification du PRO)

2. **Action PRO : Annuler la replanification**
   - Onglet "Replanifiés" côté PRO
   - Cliquer sur "Annuler la replanification"
   - ✅ Message : "Demande de replanification annulée"
   - ✅ Le RDV disparaît de "Replanifiés"
   - ✅ Le RDV apparaît dans "À venir" (retour au statut `confirmed`)

3. **Vérification PROPRIO (automatique)**
   - Sans rafraîchir la page
   - ✅ Le RDV disparaît de "En attente"
   - ✅ Le RDV apparaît dans "À venir"
   - ✅ Retour à la date/heure d'origine

### Résultat attendu
✅ Annulation de replanification fonctionnelle

---

## Test 8 : Compte-rendu

### Objectif
Vérifier qu'un professionnel peut ajouter un compte-rendu et que le propriétaire peut le consulter.

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `completed` (date passée ou annulé avec passage du temps)

2. **Action PRO : Ajouter un compte-rendu**
   - Onglet "Terminés" côté PRO
   - Cliquer sur "Ajouter un compte-rendu"
   - Saisir le texte du compte-rendu (minimum 10 caractères)
   - Cliquer sur "Ajouter"
   - ✅ Message : "Compte rendu ajouté avec succès"
   - ✅ Badge vert "Terminé" apparaît (au lieu de "Annulé")
   - ✅ Actions disponibles : "Voir le compte-rendu" + "Modifier le compte-rendu"

3. **Vérification PROPRIO (automatique ou après rafraîchissement)**
   - Onglet "Terminés" côté PROPRIO
   - ✅ Badge vert "Terminé" visible
   - ✅ Action disponible : "Voir le compte-rendu"
   - Cliquer sur "Voir le compte-rendu"
   - ✅ Le compte-rendu s'affiche dans un modal

4. **Action PRO : Modifier le compte-rendu**
   - Cliquer sur "Modifier le compte-rendu"
   - Modifier le texte
   - Cliquer sur "Modifier"
   - ✅ Message : "Compte rendu ajouté avec succès"

### Résultat attendu
✅ Gestion des comptes-rendus fonctionnelle

---

## Test 9 : Actions dans l'onglet "À venir" (PRO)

### Objectif
Vérifier que toutes les actions spécifiques au PRO sont disponibles dans "À venir".

### Étapes

1. **État initial**
   - Avoir un rendez-vous en statut `confirmed`

2. **Vérification des actions**
   - Onglet "À venir" côté PRO
   - Cliquer sur les 3 points verticaux
   - ✅ Action "Fiche client" disponible
   - ✅ Action "Appeler" disponible
   - ✅ Action "Ouvrir GPS" disponible
   - ✅ Action "Replanifier" disponible
   - ✅ Action "Annuler le rendez-vous" disponible

3. **Test "Fiche client"**
   - Cliquer sur "Fiche client"
   - ✅ Modal s'ouvre avec les informations du client
   - ✅ Bouton "Appeler" disponible dans le modal

4. **Test "Appeler"**
   - Cliquer sur "Appeler"
   - ✅ Déclenche un appel téléphonique (sur mobile)
   - ✅ Ou affiche une erreur si pas de numéro

5. **Test "Ouvrir GPS"**
   - Cliquer sur "Ouvrir GPS"
   - ✅ Ouvre Google Maps dans un nouvel onglet

### Résultat attendu
✅ Toutes les actions PRO fonctionnelles

---

## Test 10 : Passage automatique en "Terminés"

### Objectif
Vérifier que les rendez-vous passés sont automatiquement marqués comme terminés.

### Étapes

1. **Préparation**
   - Créer un rendez-vous avec une date/heure dans le passé
   - Ou modifier manuellement dans la base de données

2. **Attendre le script automatique**
   - Le script tourne toutes les 5 minutes
   - Ou déclencher manuellement : `POST /api/appointments/update-status`

3. **Vérification**
   - ✅ Le RDV disparaît de "À venir"
   - ✅ Le RDV apparaît dans "Terminés"
   - ✅ Badge "Annulé" visible (car pas de compte-rendu)
   - ✅ Synchronisation temps réel pour les deux parties

### Résultat attendu
✅ Passage automatique en "Terminés" fonctionnel

---

## Test 11 : Synchronisation Realtime

### Objectif
Vérifier que les changements se propagent instantanément sans rafraîchir la page.

### Étapes

1. **Ouvrir deux navigateurs côte à côte**
   - Navigateur 1 : Compte PROPRIETAIRE
   - Navigateur 2 : Compte PRO

2. **Test de synchronisation**
   - Effectuer n'importe quelle action dans le Navigateur 1
   - Observer le Navigateur 2
   - ✅ Les changements apparaissent instantanément (< 1 seconde)
   - ✅ Aucun rafraîchissement de page nécessaire

3. **Test dans l'autre sens**
   - Effectuer une action dans le Navigateur 2
   - Observer le Navigateur 1
   - ✅ Les changements apparaissent instantanément

4. **Vérification console**
   - Ouvrir la console développeur (F12)
   - ✅ Messages Realtime visibles : "📡 Changement Realtime détecté"
   - ✅ Pas d'erreurs de connexion

### Résultat attendu
✅ Synchronisation Realtime parfaitement fonctionnelle

---

## Checklist finale

### Fonctionnalités PRO
- [x] Voir les demandes en attente
- [x] Accepter un rendez-vous
- [x] Refuser un rendez-vous
- [x] Proposer une replanification
- [x] Annuler une replanification
- [x] Annuler un rendez-vous confirmé
- [x] Ajouter un compte-rendu
- [x] Modifier un compte-rendu
- [x] Voir la fiche client
- [x] Appeler le client
- [x] Ouvrir GPS

### Fonctionnalités PROPRIO
- [x] Créer un rendez-vous
- [x] Annuler une demande en attente
- [x] Accepter une replanification du PRO
- [x] Refuser une replanification du PRO
- [x] Proposer une replanification
- [x] Annuler un rendez-vous confirmé
- [x] Voir le compte-rendu

### Synchronisation
- [x] Realtime activé
- [x] Changements instantanés PRO → PROPRIO
- [x] Changements instantanés PROPRIO → PRO
- [x] Pas de rafraîchissement nécessaire

### Tabs
- [x] PRO : 5 tabs corrects
- [x] PROPRIO : 4 tabs corrects
- [x] Compteurs mis à jour en temps réel
- [x] Filtrage correct par statut

### UI/UX
- [x] Badges visuels corrects
- [x] Messages de succès appropriés
- [x] Modals de confirmation
- [x] Animations de chargement
- [x] Menus contextuels fonctionnels

---

## Debugging

Si un test échoue, vérifier :

1. **Console navigateur** (F12) :
   - Erreurs JavaScript
   - Erreurs Realtime
   - Requêtes API

2. **Console serveur** :
   - Logs Supabase
   - Logs API
   - Erreurs de connexion

3. **Base de données Supabase** :
   - RLS activé sur table `appointments`
   - Policies correctes
   - Realtime activé

4. **Variables d'environnement** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

*Guide de tests créé le 8 octobre 2025*
*Version 1.0*





