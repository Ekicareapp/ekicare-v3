# 🔄 Guide d'activation Supabase Realtime

## Étapes pour activer Realtime dans Supabase

### 1. Activer Realtime dans Supabase Dashboard

1. **Aller dans Supabase Dashboard** → Votre projet
2. **Database** → **Replication**
3. **Activer** la réplication pour la table `appointments`

### 2. Configuration RLS pour Realtime

Exécuter ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Activer la réplication pour la table appointments
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Vérifier que RLS est activé
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies existantes (déjà en place)
-- Les policies RLS existantes permettront aux utilisateurs de voir seulement leurs rendez-vous
```

### 3. Vérification

Après activation, vous devriez voir dans la console :
- `🔄 Configuration Realtime pour: proprio_id=eq.USER_ID` (côté PROPRIO)
- `🔄 Configuration Realtime pour: pro_id=eq.PROFILE_ID` (côté PRO)
- `📡 Changement Realtime détecté:` quand un changement se produit

### 4. Test

1. **Ouvrir deux onglets** : Un côté PRO, un côté PROPRIO
2. **Effectuer une action** (accepter, refuser, replanifier)
3. **Vérifier** que l'autre onglet se met à jour automatiquement

## Fonctionnalités Realtime

✅ **Synchronisation automatique** : Plus besoin de rafraîchir manuellement
✅ **Notifications temps réel** : Les changements apparaissent instantanément
✅ **Sécurité RLS** : Chaque utilisateur ne voit que ses rendez-vous
✅ **Fallback** : Le polling de 5 minutes reste en place comme sécurité

## Dépannage

Si Realtime ne fonctionne pas :
1. Vérifier que la réplication est activée dans Supabase
2. Vérifier les logs de la console pour les erreurs
3. Le polling de 5 minutes prendra le relais automatiquement










