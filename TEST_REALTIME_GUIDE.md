# 🧪 Guide de Test Supabase Realtime

## Test de la synchronisation temps réel

### 1. Préparation du test

1. **Ouvrir deux onglets** dans votre navigateur :
   - Onglet 1 : `localhost:3000/dashboard/pro/rendez-vous` (compte PRO)
   - Onglet 2 : `localhost:3000/dashboard/proprietaire/rendez-vous` (compte PROPRIO)

2. **Ouvrir la console développeur** (F12) sur les deux onglets

### 2. Vérification des logs Realtime

Dans la console, vous devriez voir :
```
🔄 Configuration Realtime pour: proprio_id=eq.USER_ID (côté PROPRIO)
🔄 Configuration Realtime pour: pro_id=eq.PROFILE_ID (côté PRO)
```

### 3. Tests de synchronisation

#### Test 1 : Replanification PROPRIO → PRO
1. **Côté PROPRIO** : Replanifier un rendez-vous "À venir"
2. **Vérifier** : Le rendez-vous passe en "En attente" côté PROPRIO
3. **Côté PRO** : Vérifier que le rendez-vous apparaît dans "En attente"
4. **Console** : Vérifier les logs `📡 Changement Realtime détecté:`

#### Test 2 : Acceptation PRO → PROPRIO
1. **Côté PRO** : Accepter un rendez-vous "En attente"
2. **Vérifier** : Le rendez-vous passe en "À venir" côté PRO
3. **Côté PROPRIO** : Vérifier que le rendez-vous passe en "À venir"
4. **Console** : Vérifier les logs de synchronisation

#### Test 3 : Refus PRO → PROPRIO
1. **Côté PRO** : Refuser un rendez-vous "En attente"
2. **Vérifier** : Le rendez-vous passe en "Refusés" côté PRO
3. **Côté PROPRIO** : Vérifier que le rendez-vous passe en "Refusés"
4. **Console** : Vérifier les logs de synchronisation

### 4. Indicateurs de succès

✅ **Synchronisation instantanée** : Les changements apparaissent immédiatement
✅ **Compteurs mis à jour** : Les nombres dans les tabs se mettent à jour
✅ **Logs Realtime** : Messages `📡 Changement Realtime détecté:` dans la console
✅ **Pas de rafraîchissement** : Aucun besoin de F5

### 5. Dépannage

Si Realtime ne fonctionne pas :
1. **Vérifier la console** pour les erreurs
2. **Vérifier la connexion** : Les logs de configuration doivent apparaître
3. **Fallback** : Le polling de 5 minutes prendra le relais
4. **Vérifier Supabase** : La réplication doit être activée

### 6. Performance

- **Temps de réponse** : < 1 seconde
- **Bande passante** : Optimisée (seulement les changements)
- **Sécurité** : RLS respecté (chaque utilisateur ne voit que ses données)









