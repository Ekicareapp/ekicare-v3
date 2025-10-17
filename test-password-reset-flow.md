# 🧪 Test du Flow de Réinitialisation de Mot de Passe

## ✅ Checklist de test

### 1. Test du lien "Mot de passe oublié ?"

- [ ] Aller sur `/login`
- [ ] Vérifier que le lien "Mot de passe oublié ?" est présent
- [ ] Cliquer sur le lien
- [ ] Vérifier la redirection vers `/forgot-password`

### 2. Test de la page `/forgot-password`

- [ ] Vérifier le titre : "Réinitialiser votre mot de passe"
- [ ] Vérifier le champ email
- [ ] Tester la validation email (format invalide → erreur)
- [ ] Entrer un email valide
- [ ] Cliquer sur "Envoyer le lien"
- [ ] Vérifier le message de succès : "Email envoyé avec succès !"
- [ ] Vérifier le lien "Retour à la connexion"

### 3. Test de la page `/reset-password` (avec token invalide)

- [ ] Aller directement sur `/reset-password`
- [ ] Vérifier le message : "Lien invalide ou expiré"
- [ ] Vérifier le bouton "Demander un nouveau lien"
- [ ] Cliquer sur le bouton → redirection vers `/forgot-password`

### 4. Test avec un vrai email (optionnel)

- [ ] Utiliser un email de test réel
- [ ] Vérifier la réception de l'email
- [ ] Cliquer sur le lien dans l'email
- [ ] Vérifier la redirection vers `/reset-password` avec token
- [ ] Tester le formulaire de nouveau mot de passe
- [ ] Vérifier la redirection vers `/login` après succès

---

## 🎯 URLs à tester

```
http://localhost:3000/login              → Lien "Mot de passe oublié ?"
http://localhost:3000/forgot-password    → Formulaire de demande
http://localhost:3000/reset-password     → Page avec token invalide
```

---

## ✅ Fonctionnalités attendues

### Page `/forgot-password`
- ✅ Formulaire centré avec design Linear
- ✅ Validation email en temps réel
- ✅ Message de succès avec icône verte
- ✅ Bouton "Retour à la connexion"

### Page `/reset-password`
- ✅ Vérification du token au chargement
- ✅ Écran spécial pour token invalide
- ✅ Formulaire de nouveau mot de passe
- ✅ Validation des mots de passe
- ✅ Redirection automatique après succès

---

## 🚀 Déploiement

Une fois les tests validés :

```bash
git add .
git commit -m "feat: flow de réinitialisation de mot de passe complet"
git push
```

**Puis tester en production :**
```
https://www.ekicare.com/login
https://www.ekicare.com/forgot-password
https://www.ekicare.com/reset-password
```

---

## ⚙️ Configuration Supabase

**N'oubliez pas d'ajouter l'URL de redirection :**

Dans Supabase Dashboard > Authentication > URL Configuration :
```
https://www.ekicare.com/reset-password
```

---

## ✨ Résultat attendu

Un flow complet et fonctionnel :
1. Clic sur "Mot de passe oublié ?" → `/forgot-password`
2. Saisie email → Message de confirmation
3. Email reçu → Clic sur lien → `/reset-password`
4. Nouveau mot de passe → Redirection vers `/login`

**Le flow est prêt pour la production ! 🎉**





