# 🔐 Configuration de la Réinitialisation de Mot de Passe

Guide complet pour configurer le flow de réinitialisation de mot de passe avec Supabase.

---

## 📁 Fichiers créés

```
/app/forgot-password/page.tsx    # Page de demande de réinitialisation
/app/reset-password/page.tsx     # Page de définition du nouveau mot de passe
/app/login/page.tsx              # Mise à jour du lien "Mot de passe oublié"
```

---

## 🎯 Flow complet

### 1. Utilisateur oublie son mot de passe

```
/login → Clic sur "Mot de passe oublié ?" → /forgot-password
```

### 2. Demande de réinitialisation

```
/forgot-password
  ↓ Entre son email
  ↓ Clic sur "Envoyer le lien"
  ↓ Supabase envoie un email avec un lien magique
  ↓ Message de confirmation affiché
```

### 3. Réinitialisation du mot de passe

```
Email reçu
  ↓ Clic sur le lien (redirige vers /reset-password avec token)
  ↓ Vérification du token
  ↓ Formulaire de nouveau mot de passe
  ↓ Mise à jour du mot de passe
  ↓ Redirection automatique vers /login après 3 secondes
```

---

## ⚙️ Configuration Supabase

### 1. Configurer l'URL de redirection

Dans le **Dashboard Supabase** :

1. Allez dans **Authentication** > **URL Configuration**
2. Ajoutez dans **Redirect URLs** :
   ```
   https://www.ekicare.com/reset-password
   http://localhost:3000/reset-password
   ```
3. Cliquez sur **Save**

### 2. Configurer le template d'email (optionnel)

Dans **Authentication** > **Email Templates** > **Reset Password** :

```html
<h2>Réinitialiser votre mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe EkiCare.</p>
<p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
<p>Ce lien expire dans 1 heure.</p>
```

### 3. Vérifier les variables d'environnement

```bash
# .env.local (pour le développement)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

---

## 🧪 Comment tester

### Test en développement local

```bash
# 1. Démarrer l'application
npm run dev

# 2. Ouvrir http://localhost:3000/login

# 3. Cliquer sur "Mot de passe oublié ?"

# 4. Entrer votre email de test

# 5. Vérifier votre boîte email (peut être dans les spams)

# 6. Cliquer sur le lien dans l'email

# 7. Définir un nouveau mot de passe

# 8. Vérifier la redirection vers /login
```

### Test en production

```bash
# 1. Déployer sur Vercel
git add .
git commit -m "feat: ajout du flow de réinitialisation de mot de passe"
git push

# 2. Aller sur https://www.ekicare.com/login

# 3. Suivre le même flow que ci-dessus
```

---

## 🎨 Design

### Style appliqué

- ✅ **Design sobre et moderne** inspiré de Linear
- ✅ **Card centrée** avec max-width 400px
- ✅ **Bords arrondis** (rounded-lg)
- ✅ **Ombres douces** (shadow-lg)
- ✅ **Couleurs cohérentes** avec le reste de l'app
- ✅ **Messages de succès/erreur** bien visibles
- ✅ **États de loading** avec désactivation des champs
- ✅ **Responsive** pour mobile et desktop

### Palette de couleurs

```css
Texte principal: #111827
Texte secondaire: #6b7280
Accent (boutons): #f86f4d
Accent hover: #fa8265
Bordures: #e5e7eb
Fond: #f9fafb
Succès: #d1fae5 / #059669
Erreur: #fee2e2 / #ef4444
```

---

## 🔒 Sécurité

### Validations en place

**Page forgot-password :**
- ✅ Validation format email (regex)
- ✅ Désactivation du formulaire pendant l'envoi
- ✅ Gestion des erreurs Supabase

**Page reset-password :**
- ✅ Vérification du token de session
- ✅ Validation longueur minimale (6 caractères)
- ✅ Vérification que les 2 mots de passe correspondent
- ✅ Feedback en temps réel sur les erreurs
- ✅ Redirection si token invalide ou expiré

---

## 🚨 Gestion d'erreur

### Erreurs possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Veuillez entrer une adresse email valide" | Format email incorrect | Corriger l'email |
| "Lien invalide ou expiré" | Token expiré (> 1h) | Demander un nouveau lien |
| "Les mots de passe ne correspondent pas" | Champs différents | Vérifier la saisie |
| "Le mot de passe doit contenir au moins 6 caractères" | Mot de passe trop court | Utiliser 6+ caractères |

### Messages utilisateur

**Succès - forgot-password :**
```
✅ Email envoyé avec succès !
Vérifiez votre boîte de réception et cliquez sur le lien 
pour réinitialiser votre mot de passe.
```

**Succès - reset-password :**
```
✅ Mot de passe mis à jour avec succès !
Redirection vers la page de connexion...
```

---

## 🔄 Flow alternatif (lien expiré)

Si l'utilisateur clique sur un lien expiré :

```
/reset-password (avec token expiré)
  ↓ Vérification du token
  ↓ Token invalide détecté
  ↓ Affichage message d'erreur
  ↓ Bouton "Demander un nouveau lien"
  ↓ Redirection vers /forgot-password
```

---

## 📱 Responsive Design

Les pages s'adaptent automatiquement :

**Mobile (< 640px) :**
- Padding réduit (p-4)
- Titres plus petits (text-xl)
- Espacements adaptés

**Desktop (≥ 640px) :**
- Padding normal (p-8)
- Titres plus grands (text-2xl)
- Espacements généreux

---

## ✅ Checklist de déploiement

### Configuration Supabase

- [ ] URL de redirection ajoutée dans Supabase Dashboard
- [ ] Template d'email configuré (optionnel)
- [ ] Variables d'environnement vérifiées dans Vercel

### Tests

- [ ] Test en local : demande de réinitialisation
- [ ] Test en local : réception de l'email
- [ ] Test en local : changement de mot de passe
- [ ] Test en production : flow complet

### UI/UX

- [ ] Lien "Mot de passe oublié ?" visible sur /login
- [ ] Messages de succès clairs
- [ ] Messages d'erreur explicites
- [ ] Loading states fonctionnels
- [ ] Redirection automatique après succès

---

## 🎯 Améliorations futures (optionnelles)

### Fonctionnalités

- [ ] Afficher un timer pour la redirection (3... 2... 1...)
- [ ] Ajouter un bouton "Renvoyer l'email" si pas reçu
- [ ] Historique des tentatives de réinitialisation
- [ ] Notifications par SMS en plus de l'email

### Sécurité

- [ ] Rate limiting sur les demandes de réinitialisation
- [ ] Captcha pour éviter les abus
- [ ] Validation de la force du mot de passe
- [ ] Email de confirmation après changement de mot de passe

---

## 📊 Analytics (optionnel)

Tracker les événements suivants :

```typescript
// forgot-password
analytics.track('password_reset_requested', { email });

// reset-password
analytics.track('password_reset_completed', { userId });

// reset-password (erreur)
analytics.track('password_reset_failed', { reason: 'invalid_token' });
```

---

## 🐛 Troubleshooting

### Email non reçu

1. **Vérifier les spams**
2. **Vérifier l'email dans Supabase Dashboard** (Authentication > Logs)
3. **Vérifier que l'email est correct**
4. **Attendre quelques minutes** (parfois retard)

### Lien ne fonctionne pas

1. **Vérifier que l'URL de redirection est configurée** dans Supabase
2. **Vérifier que le lien n'a pas expiré** (1 heure max)
3. **Demander un nouveau lien**

### Mot de passe non mis à jour

1. **Vérifier les logs de la console navigateur**
2. **Vérifier que le token est valide** (session active)
3. **Tester avec un autre navigateur** (pas de cache)

---

## 📚 Ressources

- **Documentation Supabase Auth** : [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Reset Password API** : [supabase.com/docs/reference/javascript/auth-resetpasswordforemail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- **Update User API** : [supabase.com/docs/reference/javascript/auth-updateuser](https://supabase.com/docs/reference/javascript/auth-updateuser)

---

## ✨ Résumé

Vous avez maintenant :

✅ **2 pages complètes** pour la réinitialisation de mot de passe  
✅ **Design cohérent** avec le reste de l'application  
✅ **Validations robustes** côté client  
✅ **Messages clairs** pour l'utilisateur  
✅ **Gestion d'erreur** appropriée  
✅ **Redirection automatique** après succès  
✅ **Responsive** pour tous les écrans  

**Le flow de réinitialisation est prêt pour la production ! 🎉**






