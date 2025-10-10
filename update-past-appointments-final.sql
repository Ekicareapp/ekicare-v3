-- 🔄 MISE À JOUR IMMÉDIATE DES ANCIENS RENDEZ-VOUS PASSÉS
-- À exécuter dans Supabase SQL Editor

-- 1. Voir l'état actuel
SELECT 
  'AVANT MISE À JOUR' as etape,
  status,
  COUNT(*) as nombre
FROM appointments 
WHERE main_slot < NOW()
GROUP BY status
ORDER BY status;

-- 2. Voir les rendez-vous concernés (détails)
SELECT 
  id,
  main_slot,
  status,
  LEFT(comment, 50) as comment_court,
  created_at
FROM appointments 
WHERE main_slot < NOW()
  AND status IN ('confirmed', 'pending', 'rescheduled')
ORDER BY main_slot DESC;

-- 3. METTRE À JOUR tous les rendez-vous passés
UPDATE appointments 
SET 
  status = 'terminé',
  updated_at = NOW()
WHERE main_slot < NOW()
  AND status IN ('confirmed', 'pending', 'rescheduled');

-- 4. Voir le résultat
SELECT 
  'APRÈS MISE À JOUR' as etape,
  status,
  COUNT(*) as nombre
FROM appointments 
WHERE main_slot < NOW()
GROUP BY status
ORDER BY status;

-- 5. Confirmer les rendez-vous mis à jour aujourd'hui
SELECT 
  COUNT(*) as rendez_vous_mis_a_jour,
  MIN(main_slot) as plus_ancien,
  MAX(main_slot) as plus_recent
FROM appointments 
WHERE status = 'terminé'
  AND updated_at >= CURRENT_DATE;

-- 6. Voir quelques exemples des rendez-vous terminés
SELECT 
  id,
  main_slot,
  status,
  LEFT(comment, 40) as comment_court,
  updated_at
FROM appointments 
WHERE status = 'terminé'
  AND updated_at >= CURRENT_DATE
ORDER BY main_slot DESC
LIMIT 5;
