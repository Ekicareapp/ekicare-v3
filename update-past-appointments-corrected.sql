-- 🔄 MISE À JOUR CORRIGÉE DES ANCIENS RENDEZ-VOUS PASSÉS
-- Version corrigée avec les bons statuts

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

-- 3. METTRE À JOUR avec le statut correct (essayez 'completed' ou 'finished')
-- Remplacez 'completed' par le bon statut selon votre contrainte
UPDATE appointments 
SET 
  status = 'completed',  -- ← Changez ceci si nécessaire
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
WHERE status = 'completed'  -- ← Même statut ici
  AND updated_at >= CURRENT_DATE;
