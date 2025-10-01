-- CORRECTION CONTRAINTES UPSERT POUR pro_profiles
-- Exécuter ce script dans le SQL Editor du dashboard Supabase

-- 1. VÉRIFIER LES CONTRAINTES EXISTANTES
-- =====================================
SELECT 
  constraint_name, 
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pro_profiles' 
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 2. AJOUTER LA CONTRAINTE UNIQUE SUR user_id
-- ===========================================
-- Vérifier d'abord si la contrainte existe déjà
DO $$
BEGIN
    -- Vérifier si la contrainte unique sur user_id existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'pro_profiles' 
          AND constraint_name = 'pro_profiles_user_id_unique'
          AND constraint_type = 'UNIQUE'
    ) THEN
        -- Ajouter la contrainte unique
        ALTER TABLE pro_profiles 
        ADD CONSTRAINT pro_profiles_user_id_unique UNIQUE (user_id);
        
        RAISE NOTICE 'Contrainte unique ajoutée sur user_id';
    ELSE
        RAISE NOTICE 'Contrainte unique sur user_id existe déjà';
    END IF;
END
$$;

-- 3. VÉRIFIER QUE LA CONTRAINTE A ÉTÉ AJOUTÉE
-- ===========================================
SELECT 
  constraint_name, 
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'pro_profiles' 
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 4. TEST D'UPSERT (OPTIONNEL)
-- ============================
-- Pour tester que l'upsert fonctionne maintenant
/*
-- Test d'upsert avec un utilisateur existant
INSERT INTO pro_profiles (user_id, bio, experience_years, price_range)
VALUES (
  (SELECT id FROM users WHERE role = 'PRO' LIMIT 1),
  'Test upsert après ajout de contrainte unique',
  10,
  '€€€'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  bio = EXCLUDED.bio,
  experience_years = EXCLUDED.experience_years,
  price_range = EXCLUDED.price_range,
  last_activity = NOW();
*/

-- 5. INSTRUCTIONS D'UTILISATION
-- =============================
/*
APRÈS EXÉCUTION DE CE SCRIPT:

1. La contrainte unique sur user_id sera ajoutée
2. L'upsert dans le code frontend fonctionnera:
   - Si le profil existe → UPDATE
   - Si le profil n'existe pas → INSERT
3. Plus d'erreur "no unique or exclusion constraint matching"

UTILISATION DANS LE CODE:
```javascript
const { data, error } = await supabase
  .from('pro_profiles')
  .upsert({
    user_id: user.id,
    ...profileData
  }, {
    onConflict: 'user_id'  // Maintenant supporté
  });
```

SÉCURITÉ:
- Chaque utilisateur ne peut avoir qu'un seul profil
- L'upsert garantit l'unicité des profils par utilisateur
- Les données existantes sont préservées
*/
