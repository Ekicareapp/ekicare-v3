# Migrations Supabase

## Migration des champs de profil professionnel

### Fichier: `add_pro_profile_fields.sql`

Cette migration ajoute les champs manquants à la table `pro_profiles` pour supporter les nouvelles fonctionnalités du profil professionnel.

### Champs ajoutés :

1. **`experience_years`** (INTEGER)
   - Nombre d'années d'expérience professionnelle
   - Contrainte : 0 ≤ experience_years ≤ 60
   - Valeur par défaut : 0

2. **`bio`** (TEXT)
   - Description professionnelle du vétérinaire
   - Champ libre pour la bio

3. **`price_range`** (TEXT)
   - Fourchette tarifaire : €, €€, €€€
   - Valeur par défaut : €€
   - Contrainte : valeurs autorisées uniquement

4. **`payment_methods`** (TEXT[])
   - Array des moyens de paiement acceptés
   - Valeur par défaut : tableau vide
   - Exemple : ["CB", "Espèces", "Chèque", "Virement"]

### Index ajoutés :

- `idx_pro_profiles_experience_years` : pour les recherches par expérience
- `idx_pro_profiles_price_range` : pour les recherches par fourchette tarifaire

### Comment appliquer la migration :

1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'onglet "SQL Editor"
3. Copiez le contenu du fichier `add_pro_profile_fields.sql`
4. Exécutez la requête

### Vérification :

Après l'exécution, vérifiez que les colonnes ont été ajoutées :
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'pro_profiles'
ORDER BY ordinal_position;
```

### Rollback (si nécessaire) :

```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE pro_profiles DROP COLUMN IF EXISTS experience_years;
ALTER TABLE pro_profiles DROP COLUMN IF EXISTS bio;
ALTER TABLE pro_profiles DROP COLUMN IF EXISTS price_range;
ALTER TABLE pro_profiles DROP COLUMN IF EXISTS payment_methods;

-- Supprimer les index
DROP INDEX IF EXISTS idx_pro_profiles_experience_years;
DROP INDEX IF EXISTS idx_pro_profiles_price_range;
```
