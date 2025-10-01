# Correction du champ "Années d'expérience"

## Problème identifié

Le champ `experienceYears` est bien présent et configuré, mais la fonction `handleInputChange` traite toutes les valeurs comme des strings.

## Solution

Modifier la fonction `handleInputChange` dans `app/dashboard/pro/profil/page.tsx` (ligne 142-148) :

### Code actuel :
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};
```

### Code corrigé :
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  
  // Convertir en nombre pour les champs numériques
  const finalValue = type === 'number' || type === 'range' 
    ? (value === '' ? 0 : Number(value))
    : value;
  
  setFormData(prev => ({
    ...prev,
    [name]: finalValue
  }));
};
```

## Vérification

Le champ est déjà correctement configuré :
- ✅ `name="experienceYears"` (ligne 636)
- ✅ `type="number"` (ligne 637)
- ✅ `value={formData.experienceYears}` (ligne 638)
- ✅ `onChange={handleInputChange}` (ligne 639)
- ✅ Sauvegarde en BDD : `experience_years: formData.experienceYears` (ligne 337)

La seule correction nécessaire est la conversion en nombre dans `handleInputChange`.

## Test

Après la correction :
1. Allez sur /dashboard/pro/profil
2. Cliquez sur "Modifier"
3. Changez les années d'expérience
4. Cliquez sur "Enregistrer"
5. Vérifiez que la valeur est bien sauvegardée (rechargez la page)
