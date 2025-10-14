# 🔧 Corrections du Calendrier - Mapping des Jours de la Semaine

## 🎯 Problèmes identifiés et résolus

### Avant les corrections :
- ❌ **Lundi désactivé** alors que le pro travaille ce jour-là
- ❌ **Dimanche activé** alors que le pro ne travaille pas
- ❌ **Décalage entre les jours cochés** et les jours affichés dans le calendrier
- ❌ **Légende inutile** affichée sous le calendrier ("Sélectionné / Fermé / Passé")
- ❌ **Incohérence** entre `getDay()` et `getUTCDay()` provoquant des erreurs de mapping

### Après les corrections :
- ✅ **Mapping correct** entre les jours du calendrier et `working_hours`
- ✅ **Lundi = premier jour** de la semaine dans le calendrier
- ✅ **Désactivation fiable** des jours non travaillés
- ✅ **Légende supprimée** pour un affichage plus épuré
- ✅ **Cohérence** entre toutes les fonctions utilisant les jours

---

## 🔍 Cause du problème

### Incohérence entre `getDay()` et `getUTCDay()`

Le calendrier utilisait un mélange de :
- `date.getDay()` pour le calcul des positions dans le calendrier
- `date.getUTCDay()` pour la vérification des jours travaillés
- Dates locales vs dates UTC

**Résultat :** Décalage d'un jour selon le fuseau horaire et l'heure de la journée.

### Exemple de décalage :
```javascript
// AVANT (problématique)
const date = new Date(2025, 0, 13); // Lundi 13 janvier 2025
date.getDay();    // Retourne 1 (lundi) ✅
date.getUTCDay(); // Peut retourner 0 (dimanche) ❌ selon l'heure locale

// APRÈS (corrigé)
const date = new Date(2025, 0, 13);
date.setHours(0, 0, 0, 0); // Reset de l'heure
date.getDay(); // Retourne toujours 1 (lundi) ✅
```

---

## 🔧 Corrections techniques apportées

### 1. **Unification du mapping des jours**

**Fichier :** `app/dashboard/proprietaire/utils/workingHours.ts`

#### Fonction `isWorkingDay` corrigée :
```typescript
// AVANT
const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const dayName = days[dayOfWeek];

// APRÈS (avec documentation)
/**
 * @param dayOfWeek - Index du jour (0 = dimanche, 1 = lundi, ..., 6 = samedi)
 */
// Mapping JS standard : 0=dimanche, 1=lundi, 2=mardi, 3=mercredi, 4=jeudi, 5=vendredi, 6=samedi
const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const dayName = days[dayOfWeek];
```

#### Fonction `isDateWorkingDay` corrigée :
```typescript
// AVANT (problématique)
export const isDateWorkingDay = (workingHours: WorkingHours | null, date: Date): boolean => {
  const dayOfWeek = date.getUTCDay(); // ❌ UTC
  return isWorkingDay(workingHours, dayOfWeek);
};

// APRÈS (corrigé)
export const isDateWorkingDay = (workingHours: WorkingHours | null, date: Date): boolean => {
  const dayOfWeek = date.getDay(); // ✅ Local, cohérent avec le calendrier
  return isWorkingDay(workingHours, dayOfWeek);
};
```

---

### 2. **Calendrier - Calcul des jours travaillés**

**Fichier :** `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`

#### Avant (logique déléguée) :
```typescript
const isWorkingDay = workingHours ? isDateWorkingDay(workingHours, date) : false;
```

**Problème :** `isDateWorkingDay` utilisait `getUTCDay()`, créant un décalage.

#### Après (logique directe et cohérente) :
```typescript
// Vérifier si c'est un jour de travail en utilisant getDay() (0=dimanche, 1=lundi, ...)
let isWorkingDay = false;
if (workingHours) {
  const dayOfWeekIndex = date.getDay(); // 0=dimanche, 1=lundi, 2=mardi, etc.
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const dayName = dayNames[dayOfWeekIndex];
  const dayHours = workingHours[dayName];
  isWorkingDay = dayHours?.active === true;
  
  // Debug log pour diagnostic
  if (i === 0 || (isCurrentMonth && date.getDate() === 1)) {
    console.log(`📅 Calendrier - Premier jour: ${dayName} (index ${dayOfWeekIndex}), active: ${dayHours?.active}`);
  }
}
```

#### Reset de l'heure pour comparaisons fiables :
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0); // ✅ Reset time for comparison

const minDateObj = new Date(minDate);
minDateObj.setHours(0, 0, 0, 0);

const date = new Date(startDate);
date.setDate(startDate.getDate() + i);
date.setHours(0, 0, 0, 0); // ✅ Reset time
```

---

### 3. **Page de recherche - Fonctions corrigées**

**Fichier :** `app/dashboard/proprietaire/recherche-pro/page.tsx`

#### Fonction `isWorkingDate` :
```typescript
// AVANT (UTC)
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(Date.UTC(year, month - 1, day)); // ❌ UTC
return isDateWorkingDay(selectedProfWorkingHours, date);

// APRÈS (Local)
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day); // ✅ Local
date.setHours(0, 0, 0, 0);
return isDateWorkingDay(selectedProfWorkingHours, date);
```

#### Fonction `loadAvailableTimes` :
```typescript
// AVANT (UTC)
const dateObj = new Date(Date.UTC(year, month - 1, day));
const dayOfWeek = dateObj.getUTCDay(); // ❌

// APRÈS (Local)
const dateObj = new Date(year, month - 1, day);
dateObj.setHours(0, 0, 0, 0);
const dayOfWeek = dateObj.getDay(); // ✅
const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const dayName = days[dayOfWeek];
```

#### Fonction `generateAvailableTimeSlots` :
```typescript
// AVANT
const dayOfWeek = date.getUTCDay(); // ❌

// APRÈS
const dayOfWeek = date.getDay(); // ✅
```

---

### 4. **Suppression de la légende inutile**

**Fichier :** `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`

#### Code supprimé :
```typescript
{/* Légende */}
{workingHours && (
  <div className="mt-4 pt-3 border-t border-neutral-200">
    <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 rounded bg-[#ff6b35] ...">15</div>
        <span>Sélectionné</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 rounded bg-neutral-100 line-through ...">15</div>
        <span>Fermé</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-6 h-6 rounded opacity-50 ...">15</div>
        <span>Passé</span>
      </div>
    </div>
  </div>
)}
```

**Résultat :** Calendrier plus épuré et professionnel.

---

## 📋 Mapping des jours - Standard JavaScript

### Index retourné par `getDay()` :
```javascript
0 → Dimanche
1 → Lundi
2 → Mardi
3 → Mercredi
4 → Jeudi
5 → Vendredi
6 → Samedi
```

### Correspondance avec `working_hours` :
```json
{
  "dimanche": { "active": false, "start": "08:00", "end": "17:00" },  // 0
  "lundi": { "active": true, "start": "08:00", "end": "19:00" },      // 1
  "mardi": { "active": true, "start": "08:00", "end": "19:00" },      // 2
  "mercredi": { "active": true, "start": "08:00", "end": "19:00" },   // 3
  "jeudi": { "active": true, "start": "08:00", "end": "19:00" },      // 4
  "vendredi": { "active": true, "start": "08:00", "end": "19:00" },   // 5
  "samedi": { "active": true, "start": "08:00", "end": "15:00" }      // 6
}
```

### Calendrier visuel :
```
Lun | Mar | Mer | Jeu | Ven | Sam | Dim
 1  |  2  |  3  |  4  |  5  |  6  |  0
```

---

## 🔍 Logs de débogage améliorés

### Console - Vérification des horaires chargés :
```
📋 Détail des horaires par jour:
  dimanche (0): ❌ fermé
  lundi (1): ✅ 08:00-19:00
  mardi (2): ✅ 08:00-19:00
  mercredi (3): ✅ 08:00-19:00
  jeudi (4): ✅ 08:00-19:00
  vendredi (5): ✅ 08:00-19:00
  samedi (6): ✅ 08:00-15:00
```

### Console - Premier jour du mois :
```
📅 Calendrier - Premier jour: lundi (index 1), active: true
```

### Console - Sélection d'un jour :
```
🔍 Jour: lundi (index: 1), Horaires: { active: true, start: "08:00", end: "19:00" }
```

### Console - Vérification d'un jour :
```
🔍 isWorkingDay: dayOfWeek=1, dayName=lundi, active=true
```

---

## 🧪 Tests de validation

### Test 1 : Lundi travaillé
1. **Configurer le pro** avec `lundi: { active: true }`
2. **Ouvrir le calendrier**
3. **Vérifier** : Les lundis sont cliquables et normaux
4. **Console** : `lundi (1): ✅ 08:00-19:00`

### Test 2 : Dimanche fermé
1. **Configurer le pro** avec `dimanche: { active: false }`
2. **Ouvrir le calendrier**
3. **Vérifier** : Les dimanches sont grisés et barrés
4. **Console** : `dimanche (0): ❌ fermé`

### Test 3 : Créneaux horaires
1. **Sélectionner un lundi** (travaillé de 08:00 à 19:00)
2. **Vérifier le dropdown** : Créneaux de 08:00 à 19:00 affichés
3. **Console** : `🔍 Jour: lundi (index: 1), Horaires: {...}`

### Test 4 : Changement de professionnel
1. **Sélectionner le Pro A** (lundi travaillé)
2. **Vérifier** : Lundi cliquable
3. **Changer pour le Pro B** (lundi fermé)
4. **Vérifier** : Lundi grisé
5. **Console** : Logs mis à jour pour le Pro B

---

## 📊 Résultat final

### Comportement attendu :
✅ **Lundi = premier jour** du calendrier  
✅ **Mapping correct** : Index 0=dimanche, 1=lundi, ..., 6=samedi  
✅ **Jours fermés désactivés** visuellement et fonctionnellement  
✅ **Jours travaillés cliquables** et normaux  
✅ **Créneaux horaires dynamiques** selon le jour sélectionné  
✅ **Pas de légende** sous le calendrier  
✅ **Logs de debug clairs** pour diagnostiquer les problèmes  

### États visuels :
- **Jour fermé** : Fond gris clair, texte barré, opacité 60%, curseur interdit
- **Jour passé** : Gris clair, opacité 50%, non cliquable
- **Jour disponible** : Texte normal, hover effet, cliquable
- **Jour sélectionné** : Fond orange #ff6b35, texte blanc

---

## 🚀 Déploiement

### Fichiers modifiés :
1. `app/dashboard/proprietaire/utils/workingHours.ts`
   - Correction de `isWorkingDay` (doc + logs)
   - Correction de `isDateWorkingDay` (getDay au lieu de getUTCDay)
   - Correction de `generateAvailableTimeSlots`

2. `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`
   - Logique de calcul des jours travaillés directement dans le composant
   - Reset de l'heure pour comparaisons fiables
   - Suppression de la légende
   - Ajout de logs de debug

3. `app/dashboard/proprietaire/recherche-pro/page.tsx`
   - Correction de `isWorkingDate` (local au lieu de UTC)
   - Correction de `loadAvailableTimes` (getDay au lieu de getUTCDay)
   - Logs de debug améliorés

### Commandes de déploiement :
```bash
# Vérifier la compilation
npm run build

# Déployer sur Vercel
git add .
git commit -m "fix: correction mapping des jours du calendrier - lundi premier jour"
git push origin main
```

---

## 📌 Points importants

1. **Cohérence** : Toujours utiliser `getDay()` (local) pour le mapping des jours
2. **Reset de l'heure** : Toujours utiliser `setHours(0, 0, 0, 0)` avant les comparaisons
3. **Dates locales** : Ne pas utiliser `Date.UTC()` pour le calendrier
4. **Logs de debug** : Faciliter le diagnostic avec des logs clairs
5. **Mapping standard** : 0=dimanche, 1=lundi, ..., 6=samedi (standard JavaScript)

---

## 🔍 Debugging

### Si un jour est mal mappé :
1. **Ouvrir la console** du navigateur
2. **Chercher** : `📅 Calendrier - Premier jour:`
3. **Vérifier** l'index du jour (doit correspondre à getDay())
4. **Chercher** : `🔍 isWorkingDay: dayOfWeek=...`
5. **Comparer** avec `working_hours` dans Supabase

### Si les horaires ne se chargent pas :
1. **Chercher** : `📋 Détail des horaires par jour:`
2. **Vérifier** que tous les jours sont listés
3. **Vérifier** le statut ✅/❌ de chaque jour
4. **Vérifier** la table `pro_profiles` dans Supabase

---

**Date de mise à jour** : 13 octobre 2025  
**Version** : 2.0  
**Status** : ✅ Corrigé et testé



