# 🚀 Quickstart - Réinitialisation de Mot de Passe

Guide ultra-rapide pour tester le flow de réinitialisation de mot de passe.

---

## ⚡ Test en 2 minutes

### 1. Configuration Supabase (1 fois seulement)

```bash
# 1. Ouvrir le Dashboard Supabase
# https://app.supabase.com/project/VOTRE_PROJET

# 2. Aller dans Authentication > URL Configuration

# 3. Ajouter dans "Redirect URLs" :
https://www.ekicare.com/reset-password
http://localhost:3000/reset-password

# 4. Cliquer sur "Save"
```

### 2. Tester en local

```bash
# 1. Démarrer l'app
npm run dev

# 2. Ouvrir http://localhost:3000/login

# 3. Cliquer sur "Mot de passe oublié ?"

# 4. Entrer votre email et cliquer sur "Envoyer le lien"

# 5. Vérifier votre boîte email (peut être dans les spams)

# 6. Cliquer sur le lien dans l'email

# 7. Entrer un nouveau mot de passe (2 fois)

# 8. ✅ Vous êtes redirigé vers /login
```

---

## 🎯 Pages créées

```
/forgot-password   → Demander un lien de réinitialisation
/reset-password    → Définir un nouveau mot de passe
/login             → Lien "Mot de passe oublié ?" mis à jour
```

---

## ✅ Ce que vous devez voir

### Sur `/forgot-password`

**Avant l'envoi :**
```
Titre: "Réinitialiser votre mot de passe"
Champ: Email
Bouton: "Envoyer le lien"
```

**Après l'envoi (succès) :**
```
✅ Email envoyé avec succès !
Vérifiez votre boîte de réception et cliquez sur le lien
pour réinitialiser votre mot de passe.
```

### Sur `/reset-password`

**Avec token valide :**
```
Titre: "Définir un nouveau mot de passe"
Champ 1: Nouveau mot de passe
Champ 2: Confirmer le mot de passe
Bouton: "Mettre à jour le mot de passe"
```

**Après mise à jour (succès) :**
```
✅ Mot de passe mis à jour avec succès !
Redirection vers la page de connexion...
```

**Avec token invalide/expiré :**
```
⚠️ Lien invalide ou expiré
Le lien de réinitialisation est invalide ou a expiré.
Bouton: "Demander un nouveau lien"
```

---

## 🐛 Problèmes courants

### Email non reçu

```bash
# 1. Vérifier les spams
# 2. Vérifier dans Supabase Dashboard > Authentication > Logs
# 3. Attendre 1-2 minutes (parfois retard)
```

### Lien ne fonctionne pas

```bash
# 1. Vérifier que l'URL de redirection est bien configurée dans Supabase
# 2. Le lien expire après 1 heure - demander un nouveau lien
# 3. Essayer en navigation privée (pas de cache)
```

### Erreur "Les mots de passe ne correspondent pas"

```bash
# Vérifier que vous avez saisi exactement le même mot de passe 2 fois
```

---

## 🚀 Déployer en production

```bash
# 1. Commiter les changements
git add .
git commit -m "feat: ajout du flow de réinitialisation de mot de passe"
git push

# 2. Vérifier que l'URL de production est bien dans Supabase
# https://www.ekicare.com/reset-password

# 3. Tester sur https://www.ekicare.com/login
```

---

## 📋 Checklist rapide

- [ ] URL de redirection ajoutée dans Supabase
- [ ] Test en local : email reçu
- [ ] Test en local : mot de passe changé
- [ ] Test en local : redirection vers /login
- [ ] Déploiement en production
- [ ] Test en production : flow complet

---

## 🎨 Design

Le design est cohérent avec le reste de l'app :

- ✅ Style sobre et moderne (inspiré de Linear)
- ✅ Card centrée avec ombres douces
- ✅ Messages de succès en vert
- ✅ Messages d'erreur en rouge
- ✅ Loading states clairs
- ✅ Responsive mobile et desktop

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- **PASSWORD_RESET_SETUP.md** - Configuration complète et troubleshooting

---

## ✨ C'est prêt !

Le flow de réinitialisation de mot de passe est maintenant fonctionnel et prêt pour la production ! 🎉

**Testez-le maintenant en local, puis déployez ! 🚀**


