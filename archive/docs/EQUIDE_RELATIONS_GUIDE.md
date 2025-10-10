# Guide des Relations Équidés ↔ Propriétaires

## 🎯 Objectif

Ce guide documente la structure correcte des relations entre les équidés et les propriétaires dans Ekicare, garantissant qu'**un équidé ne peut jamais être assigné directement à un professionnel**.

## 📋 Structure Correcte

### 1. Table `equides`
```sql
CREATE TABLE equides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprio_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    age INTEGER,
    sexe VARCHAR(50),
    race VARCHAR(255),
    robe VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**✅ Relations autorisées :**
- `proprio_id` → `users(id)` (propriétaire)

**❌ Relations interdites :**
- Aucune colonne `pro_id`
- Aucune relation directe avec `pro_profiles`

### 2. Table `appointments`
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprio_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    equide_id UUID NOT NULL REFERENCES equides(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    -- autres champs...
    created_at TIMESTAMP DEFAULT NOW()
);
```

**✅ Relations autorisées :**
- `proprio_id` → `users(id)` (propriétaire)
- `pro_id` → `users(id)` (professionnel)
- `equide_id` → `equides(id)` (équidé)

## 🔒 Politiques RLS (Row Level Security)

### Pour la table `equides`
```sql
-- Les propriétaires peuvent gérer leurs équidés
CREATE POLICY "Proprietaires can manage own equides" ON equides
  FOR ALL USING (auth.uid() = proprio_id);

-- Les pros peuvent voir les équidés UNIQUEMENT via leurs appointments
CREATE POLICY "Pros can view equides from their appointments" ON equides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.equide_id = equides.id 
      AND appointments.pro_id = auth.uid()
    )
  );
```

### Pour la table `appointments`
```sql
-- Les propriétaires peuvent gérer leurs rendez-vous
CREATE POLICY "Proprietaires can manage own appointments" ON appointments
  FOR ALL USING (auth.uid() = proprio_id);

-- Les pros peuvent voir leurs rendez-vous
CREATE POLICY "Pros can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = pro_id);
```

## 🔄 Flux de Données Correct

### 1. Création d'un équidé
```javascript
// ✅ CORRECT - Seul le propriétaire peut créer un équidé
const { data, error } = await supabase
  .from('equides')
  .insert({
    proprio_id: user.id, // ID du propriétaire connecté
    nom: 'Bella',
    age: 8,
    sexe: 'Jument',
    race: 'Pur-sang',
    robe: 'Bai'
  });
```

### 2. Demande de rendez-vous
```javascript
// ✅ CORRECT - Le propriétaire choisit parmi SES équidés
const appointments = selectedEquides.map(equide_id => ({
  proprio_id: user.id,           // Propriétaire
  pro_id: selectedPro.user_id,   // Professionnel choisi
  equide_id: equide_id,          // Équidé du propriétaire
  date: selectedDate,
  heure: selectedTime,
  statut: 'EN_ATTENTE'
}));
```

### 3. Accès du professionnel aux équidés
```javascript
// ✅ CORRECT - Le pro accède aux équidés via les appointments
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    id,
    date,
    heure,
    equides!inner(id, nom, race, age)
  `)
  .eq('pro_id', user.id);
```

## ❌ Ce qui est INTERDIT

### 1. Relations directes equides ↔ pro_profiles
```sql
-- ❌ INTERDIT - Ne jamais faire cela
ALTER TABLE equides ADD COLUMN pro_id UUID REFERENCES pro_profiles(user_id);
```

### 2. Accès direct aux équidés par les pros
```javascript
// ❌ INTERDIT - Les pros ne peuvent pas accéder directement aux équidés
const { data } = await supabase
  .from('equides')
  .select('*'); // RLS devrait bloquer cela
```

### 3. Assignation d'équidés à des pros
```javascript
// ❌ INTERDIT - Un équidé ne peut pas être assigné à un pro
const { data } = await supabase
  .from('equides')
  .update({ pro_id: proUserId }); // Cette colonne ne doit pas exister
```

## 🧪 Scripts de Vérification

### 1. Vérification de la structure
```bash
# Exécuter le script de vérification
psql -d your_database -f verify-equide-relations.sql
```

### 2. Test automatisé
```bash
# Exécuter le test JavaScript
node test-equide-relations.js
```

### 3. Correction si nécessaire
```bash
# Exécuter le script de correction
psql -d your_database -f fix-equide-relations.sql
```

## 📊 Contraintes de Validation

### 1. Contraintes de base de données
- `equides.proprio_id` doit être NOT NULL
- `equides.proprio_id` doit référencer un `users.id` avec `role = 'PROPRIETAIRE'`
- `appointments.equide_id` doit être NOT NULL
- `appointments.equide_id` doit référencer un `equides.id` valide

### 2. Contraintes applicatives
- Un propriétaire ne peut créer des équidés que pour lui-même
- Un propriétaire ne peut demander des RDV que pour ses propres équidés
- Un professionnel ne peut voir les équidés que via les appointments qui le concernent

## 🎯 Avantages de cette Structure

1. **Sécurité** : Aucun accès direct des pros aux équidés
2. **Intégrité** : Relations claires et contrôlées
3. **Auditabilité** : Traçabilité complète via les appointments
4. **Flexibilité** : Un équidé peut avoir plusieurs RDV avec différents pros
5. **Performance** : Index optimisés sur les relations clés

## 🔧 Maintenance

### Vérifications régulières
- Exécuter `verify-equide-relations.sql` après chaque migration
- Surveiller les logs RLS pour détecter les tentatives d'accès non autorisées
- Valider que les nouvelles fonctionnalités respectent cette structure

### En cas de problème
1. Exécuter `fix-equide-relations.sql`
2. Vérifier les logs d'erreur
3. Tester avec `test-equide-relations.js`
4. Documenter les corrections apportées

---

**⚠️ Important** : Cette structure est critique pour la sécurité et l'intégrité des données. Toute modification doit être validée et testée avant déploiement.

