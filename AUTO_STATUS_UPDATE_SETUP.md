# 🔄 Mise à jour automatique des statuts des rendez-vous

## 📋 Problème résolu

Les rendez-vous passés n'étaient pas automatiquement mis à jour en statut "terminé", causant des incohérences entre les interfaces pro et propriétaire.

## ✅ Solution implémentée

### 1. **Trigger Supabase automatique**
- Fonction `update_past_appointment_statuses()` qui s'exécute automatiquement
- Tâche cron qui s'exécute toutes les minutes (si pg_cron est activé)
- Mise à jour automatique des rendez-vous passés en statut "terminé"

### 2. **API de secours**
- Route `/api/appointments/update-statuses` pour déclencher manuellement
- Fonction `manual_update_appointment_statuses()` pour les cas où pg_cron n'est pas disponible
- Endpoint GET pour vérifier les rendez-vous en attente

### 3. **Optimisations**
- Index sur `(status, main_slot)` pour des requêtes rapides
- Colonne `updated_at` pour tracer les mises à jour
- Trigger pour mettre à jour automatiquement `updated_at`

## 🚀 Installation

### Étape 1 : Exécuter la migration
```bash
# Dans Supabase SQL Editor, exécuter :
migrations/auto-update-appointment-statuses.sql
```

### Étape 2 : Vérifier pg_cron
```sql
-- Vérifier si pg_cron est activé
SELECT * FROM cron.job;
```

Si pg_cron n'est pas disponible, la fonction `manual_update_appointment_statuses()` sera utilisée.

### Étape 3 : Tester le système
```bash
# Tester la mise à jour manuelle
node test-auto-status-update.js

# Ou via l'API
curl -X POST http://localhost:3000/api/appointments/update-statuses
```

## 🔧 Configuration

### Option 1 : pg_cron automatique (recommandé)
Si pg_cron est activé, la mise à jour se fait automatiquement toutes les minutes.

### Option 2 : API manuelle
Si pg_cron n'est pas disponible, vous pouvez :
1. Créer un webhook qui appelle `/api/appointments/update-statuses` périodiquement
2. Utiliser un service externe (Vercel Cron, GitHub Actions, etc.)
3. Déclencher manuellement via l'API

## 📊 Fonctionnement

### Critères de mise à jour
Un rendez-vous passe automatiquement en "terminé" si :
- ✅ Statut actuel : `confirmed`, `pending`, ou `rescheduled`
- ✅ `main_slot` < heure actuelle
- ✅ Statut actuel ≠ `terminé`

### Logs et monitoring
- Les mises à jour sont loggées dans les logs Supabase
- L'API retourne le nombre de rendez-vous mis à jour
- Colonne `updated_at` pour tracer les modifications

## 🧪 Test

### Créer un rendez-vous de test dans le passé
```sql
INSERT INTO appointments (
  pro_id, 
  proprio_id, 
  equide_ids, 
  main_slot, 
  comment, 
  address, 
  status
) VALUES (
  'your-pro-id',
  'test-proprio-id',
  '["test-equide"]',
  NOW() - INTERVAL '2 hours', -- 2h dans le passé
  'Test rendez-vous passé',
  'Adresse test',
  'confirmed'
);
```

### Vérifier la mise à jour
```sql
-- Vérifier les rendez-vous terminés
SELECT id, main_slot, status, updated_at 
FROM appointments 
WHERE status = 'terminé' 
AND updated_at > NOW() - INTERVAL '1 hour';
```

## 🔒 Sécurité

- ✅ Utilise `SECURITY DEFINER` pour les privilèges appropriés
- ✅ Validation des statuts avant mise à jour
- ✅ Logs pour audit et debugging
- ✅ API protégée (nécessite service role key)

## 📈 Performance

- ✅ Index optimisé sur `(status, main_slot)`
- ✅ Requêtes ciblées (seulement les rendez-vous concernés)
- ✅ Exécution toutes les minutes (pas trop fréquent)
- ✅ Fonction optimisée avec `ROW_COUNT`

---

**🎉 Le système est maintenant entièrement automatisé !**

Les rendez-vous passés seront automatiquement mis à jour en statut "terminé", synchronisant toutes les interfaces (pro et propriétaire) sans intervention manuelle.
