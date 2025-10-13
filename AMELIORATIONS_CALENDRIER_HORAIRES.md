# 📅 Améliorations du Calendrier - Horaires de Travail Professionnels

## 🎯 Objectif

Empêcher la sélection de jours et d'heures non travaillés par les professionnels dans le calendrier de prise de rendez-vous.

---

## ✅ Problèmes résolus

### Avant
- ❌ Tous les jours étaient sélectionnables, même les jours non travaillés (ex: dimanche)
- ❌ Aucune validation visuelle des jours fermés
- ❌ Si `working_hours` était `null`, tous les jours étaient considérés comme disponibles (comportement permissif)

### Après
- ✅ Seuls les jours cochés dans `working_hours` sont sélectionnables
- ✅ Les jours non travaillés sont visuellement désactivés (gris, barré, opacité réduite)
- ✅ Si `working_hours` est `null`, tous les jours sont désactivés par défaut (comportement sécurisé)
- ✅ Légende visuelle pour comprendre les états du calendrier
- ✅ Logs de débogage détaillés pour diagnostiquer les problèmes

---

## 🔧 Modifications techniques

### 1. **Fichier: `app/dashboard/proprietaire/utils/workingHours.ts`**

#### Fonction `isWorkingDay`
```typescript
// AVANT (permissif)
if (!workingHours) {
  return true; // Tous les jours considérés comme travaillés
}

// APRÈS (sécurisé)
if (!workingHours) {
  return false; // Tous les jours considérés comme NON travaillés
}
```

**Justification :** Par défaut, si aucun horaire n'est défini, on préfère bloquer la sélection plutôt que de permettre des réservations sur des jours potentiellement fermés.

---

### 2. **Fichier: `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`**

#### Modification de la logique de génération du calendrier
```typescript
// AVANT
const isWorkingDay = isDateWorkingDay(workingHours, date);

// APRÈS
const isWorkingDay = workingHours ? isDateWorkingDay(workingHours, date) : false;
```

**Justification :** Double vérification pour s'assurer que si `workingHours` est `null`, le jour est désactivé.

#### Amélioration visuelle des jours désactivés
```typescript
className={`
  ${!day.isWorkingDay
    ? 'text-neutral-400 cursor-not-allowed bg-neutral-100 line-through opacity-60'
    : 'text-neutral-700 hover:bg-neutral-100 cursor-pointer'
  }
`}
```

**États visuels :**
- **Jour fermé** : Fond gris clair, texte barré, opacité réduite, curseur interdit
- **Jour passé** : Gris clair, opacité 50%, non cliquable
- **Jour disponible** : Texte normal, hover effet, cliquable
- **Jour sélectionné** : Fond orange (#ff6b35), texte blanc

#### Ajout d'une légende
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

**Justification :** Aide l'utilisateur à comprendre visuellement les différents états du calendrier.

---

### 3. **Fichier: `app/dashboard/proprietaire/recherche-pro/page.tsx`**

#### Fonction `isWorkingDate`
```typescript
// AVANT
if (!selectedProfWorkingHours) {
  return true; // Permissif
}

// APRÈS
if (!selectedProfWorkingHours) {
  return false; // Sécurisé
}
```

#### Ajout de logs de débogage détaillés
```typescript
const handleTakeRdv = async (professionnel: Professionnel) => {
  // ...
  const workingHours = await getProfessionalWorkingHours(professionnel.user_id);
  console.log('📅 Horaires récupérés:', workingHours);
  
  // Debug: Vérifier le statut de chaque jour
  if (workingHours) {
    console.log('📋 Détail des horaires par jour:');
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    days.forEach((day, index) => {
      const dayHours = workingHours[day];
      console.log(`  ${day} (${index}):`, dayHours?.active ? `✅ ${dayHours.start}-${dayHours.end}` : '❌ fermé');
    });
  } else {
    console.warn('⚠️ Aucun horaire défini pour ce professionnel');
  }
  // ...
}
```

**Justification :** Facilite le diagnostic des problèmes d'horaires en affichant clairement dans la console le statut de chaque jour.

---

## 📋 Structure des données `working_hours`

Les horaires de travail sont stockés dans la table `pro_profiles` au format suivant :

```json
{
  "lundi": { "active": true, "start": "08:00", "end": "17:00" },
  "mardi": { "active": true, "start": "08:00", "end": "17:00" },
  "mercredi": { "active": true, "start": "08:00", "end": "17:00" },
  "jeudi": { "active": true, "start": "08:00", "end": "17:00" },
  "vendredi": { "active": true, "start": "08:00", "end": "17:00" },
  "samedi": { "active": false, "start": "08:00", "end": "17:00" },
  "dimanche": { "active": false, "start": "08:00", "end": "17:00" }
}
```

### Champs par jour :
- **`active`** (boolean) : Indique si le professionnel travaille ce jour-là
- **`start`** (string) : Heure de début (format `HH:MM`)
- **`end`** (string) : Heure de fin (format `HH:MM`)

---

## 🎨 Design

### Jours désactivés (non travaillés)
- **Apparence** : Fond gris clair (`bg-neutral-100`), texte barré (`line-through`), opacité 60%
- **Curseur** : `cursor-not-allowed`
- **Interaction** : Aucune (bouton désactivé)

### Jours passés
- **Apparence** : Texte gris clair, opacité 50%
- **Curseur** : `cursor-not-allowed`
- **Interaction** : Aucune (bouton désactivé)

### Jours disponibles
- **Apparence** : Texte normal (`text-neutral-700`)
- **Hover** : Fond gris léger (`hover:bg-neutral-100`)
- **Curseur** : `cursor-pointer`
- **Interaction** : Cliquable

### Jour sélectionné
- **Apparence** : Fond orange (#ff6b35), texte blanc
- **Hover** : Fond orange foncé (#e55a2b)
- **Ombre** : `shadow-sm`

### Jour actuel (aujourd'hui)
- **Indicateur** : Point orange en bas du jour
- **Si disponible** : Anneau orange (`ring-2 ring-[#ff6b35]`)
- **Si non disponible** : Styles de jour désactivé

---

## 🧪 Tests

### Scénario 1 : Professionnel avec horaires complets
1. Ouvrir la popup de prise de RDV
2. Vérifier dans la console les logs : `📋 Détail des horaires par jour:`
3. Constater que seuls les jours avec `active: true` sont cliquables
4. Vérifier que les jours fermés ont un fond gris et sont barrés

### Scénario 2 : Professionnel sans horaires définis
1. Ouvrir la popup de prise de RDV
2. Vérifier dans la console : `⚠️ Aucun horaire défini pour ce professionnel`
3. Constater que **tous les jours sont désactivés** (comportement sécurisé)
4. Aucun jour ne peut être sélectionné

### Scénario 3 : Dimanche non travaillé
1. Professionnel avec `dimanche: { active: false }`
2. Ouvrir le calendrier
3. Constater que les dimanches sont barrés et gris
4. Impossible de cliquer sur un dimanche
5. Log console : `dimanche (0): ❌ fermé`

### Scénario 4 : Créneaux horaires dynamiques
1. Sélectionner un jour travaillé (ex: lundi)
2. Le dropdown "Heure" se remplit avec les créneaux entre `start` et `end`
3. Les créneaux sont générés selon la `average_consultation_duration` du pro
4. Les créneaux déjà réservés sont grisés et marqués "(Réservé)"

---

## 📝 Logs de débogage

Lorsqu'un utilisateur ouvre la popup de RDV, les logs suivants s'affichent dans la console :

```
🔍 Chargement des horaires pour user_id: abc123
📅 Horaires récupérés: { lundi: { active: true, ... }, ... }
📋 Détail des horaires par jour:
  dimanche (0): ❌ fermé
  lundi (1): ✅ 08:00-17:00
  mardi (2): ✅ 08:00-17:00
  mercredi (3): ✅ 08:00-17:00
  jeudi (4): ✅ 08:00-17:00
  vendredi (5): ✅ 08:00-17:00
  samedi (6): ❌ fermé
```

**Utilité :** Diagnostiquer rapidement les problèmes d'horaires et vérifier que les jours sont correctement configurés.

---

## 🚀 Déploiement

### Fichiers modifiés :
1. `app/dashboard/proprietaire/utils/workingHours.ts`
2. `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`
3. `app/dashboard/proprietaire/recherche-pro/page.tsx`

### Commandes :
```bash
# Vérifier la compilation
npm run build

# Déployer sur Vercel
git add .
git commit -m "feat: amélioration calendrier - désactivation jours non travaillés"
git push origin main
```

---

## ✨ Résultat final

### Comportement attendu :
✅ **Jours non travaillés désactivés** : Dimanche et autres jours fermés sont grisés et impossibles à sélectionner  
✅ **Validation stricte** : Si `working_hours` est `null`, tous les jours sont désactivés par défaut  
✅ **Feedback visuel clair** : Légende explicative + styles différenciés (barré, opacité, couleur)  
✅ **Logs de débogage** : Affichage détaillé dans la console pour diagnostiquer les problèmes  
✅ **Créneaux horaires dynamiques** : Seuls les créneaux dans l'intervalle `start`-`end` sont proposés  
✅ **Responsive** : Fonctionne sur mobile et desktop  

### UX améliorée :
- ✅ L'utilisateur comprend immédiatement quels jours sont disponibles
- ✅ Impossible de sélectionner un jour fermé par erreur
- ✅ Légende visuelle pour guider l'utilisateur
- ✅ Expérience cohérente et sécurisée

---

## 📌 Points importants

1. **Sécurité par défaut** : Si `working_hours` est `null` ou non défini, tous les jours sont désactivés
2. **Validation stricte** : Seuls les jours avec `active: true` sont sélectionnables
3. **Feedback visuel** : Jours fermés = fond gris + texte barré + opacité réduite
4. **Logs de débogage** : Affichage détaillé dans la console pour faciliter le diagnostic
5. **Légende** : Aide l'utilisateur à comprendre les états du calendrier

---

## 🔍 Debugging

Si un jour est sélectionnable alors qu'il ne devrait pas l'être :

1. **Ouvrir la console** et chercher : `📋 Détail des horaires par jour:`
2. **Vérifier** que le jour en question a `active: false`
3. **Vérifier** que `workingHours` n'est pas `null`
4. **Vérifier** la structure des données dans la BDD (table `pro_profiles`)
5. **Vérifier** le fuseau horaire (UTC vs local) avec les logs

Si aucun jour n'est sélectionnable :

1. **Ouvrir la console** et chercher : `⚠️ Aucun horaire défini pour ce professionnel`
2. **Vérifier** que le professionnel a bien renseigné ses horaires
3. **Vérifier** la table `pro_profiles` : colonne `working_hours`
4. **Vérifier** que la requête Supabase récupère bien les horaires

---

## 📚 Ressources

- **Composant calendrier** : `app/dashboard/proprietaire/components/WorkingHoursCalendar.tsx`
- **Utilitaires horaires** : `app/dashboard/proprietaire/utils/workingHours.ts`
- **Page de recherche** : `app/dashboard/proprietaire/recherche-pro/page.tsx`
- **Table BDD** : `pro_profiles` (colonne `working_hours`)

---

**Date de mise à jour** : 13 octobre 2025  
**Version** : 1.0  
**Status** : ✅ Implémenté et testé

