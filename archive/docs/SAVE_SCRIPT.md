# Script de Sauvegarde Git Rapide

## 🚀 Utilisation

### Sauvegarde rapide
```bash
npm run save
```

Ce script exécute automatiquement :
1. `git add .` - Ajoute tous les fichiers modifiés
2. Vérifie s'il y a des changements à commiter
3. Si oui : commit avec timestamp + push vers origin/main
4. Si non : affiche un message informatif

### Messages de retour
- ✅ **Avec changements** : "Sauvegarde effectuée avec succès"
- ✅ **Sans changements** : "Aucun changement à sauvegarder"

## 📝 Format des commits

### Commits de sauvegarde (automatiques)
```
savepoint: 2025-09-24 11:44:26
```

### Commits manuels (recommandés pour les changements importants)
```bash
git commit -m "feat: ajout du système de rendez-vous"
git commit -m "fix: correction du bug de connexion"
git commit -m "style: amélioration de l'UI des cards"
```

## 🎯 Avantages

- **Protection** : Évite toute perte de code
- **Rapidité** : Une seule commande
- **Sécurité** : Gestion des cas sans changements
- **Flexibilité** : Commits manuels toujours possibles
- **Traçabilité** : Timestamp automatique

## ⚠️ Notes importantes

- Le script pousse automatiquement vers `origin/main`
- Les commits de sauvegarde sont préfixés par "savepoint:"
- Utilisez les commits manuels pour les changements importants
- Le script ne remplace pas les bonnes pratiques Git
