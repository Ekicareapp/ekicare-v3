-- Script SQL simple pour mettre à jour tous les anciens rendez-vous passés
-- À exécuter dans Supabase SQL Editor

-- 1. Voir combien de rendez-vous sont concernés
SELECT 
  COUNT(*) as total_past_appointments,
  status,
  COUNT(*) as count_by_status
FROM appointments 
WHERE main_slot < NOW()
  AND status IN ('confirmed', 'pending', 'rescheduled')
GROUP BY status;

-- 2. Voir les détails des rendez-vous à mettre à jour
SELECT 
  id,
  main_slot,
  status,
  comment,
  created_at
FROM appointments 
WHERE main_slot < NOW()
  AND status IN ('confirmed', 'pending', 'rescheduled')
ORDER BY main_slot DESC;

-- 3. Mettre à jour tous les rendez-vous passés
UPDATE appointments 
SET 
  status = 'terminé',
  updated_at = NOW()
WHERE main_slot < NOW()
  AND status IN ('confirmed', 'pending', 'rescheduled');

-- 4. Vérifier le résultat
SELECT 
  COUNT(*) as updated_appointments,
  MIN(updated_at) as first_update,
  MAX(updated_at) as last_update
FROM appointments 
WHERE status = 'terminé'
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- 5. Voir quelques exemples des rendez-vous mis à jour
SELECT 
  id,
  main_slot,
  status,
  comment,
  updated_at
FROM appointments 
WHERE status = 'terminé'
  AND updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY main_slot DESC
LIMIT 10;
