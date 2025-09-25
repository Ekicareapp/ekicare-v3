# Guide de déploiement - Upload de photos de profil

## 🎯 Objectif
Permettre aux professionnels d'uploader et gérer leurs photos de profil via Supabase Storage.

## 📋 Étapes de déploiement

### 1. Configuration de la base de données

#### Exécuter la migration SQL
```sql
-- Dans Supabase Dashboard > SQL Editor
-- Exécuter le contenu de: migrations/ensure_photo_url_column.sql
```

#### Vérifier la colonne
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_profiles' AND column_name = 'photo_url';
```

### 2. Configuration du bucket Supabase Storage

#### Créer le bucket `avatars`
1. Aller dans **Supabase Dashboard > Storage > Buckets**
2. Cliquer sur **"Create bucket"**
3. Nom: `avatars`
4. **Public bucket**: ✅ Activé (pour permettre la lecture publique)
5. Cliquer sur **"Create bucket"**

#### Configurer les politiques de sécurité
```sql
-- Dans Supabase Dashboard > SQL Editor
-- Exécuter le contenu de: migrations/setup_avatars_bucket.sql
```

### 3. Vérification du déploiement

#### Tester la configuration
```sql
-- Dans Supabase Dashboard > SQL Editor
-- Exécuter le contenu de: migrations/test_photo_upload.sql
```

#### Résultats attendus
- ✅ Colonne photo_url existe
- ✅ Bucket avatars existe
- ✅ Politiques de sécurité configurées
- ✅ URLs de photos valides

## 🔧 Fonctionnalités implémentées

### Upload d'image
- **Format**: JPG, PNG uniquement
- **Taille max**: 5MB
- **Chemin**: `${userId}/profile.jpg`
- **Upload immédiat**: Dès la sélection du fichier

### Preview
- **Aperçu instantané**: Affichage immédiat après upload
- **Chargement existant**: Affichage de la photo au chargement de la page
- **Remplacement**: Possibilité de changer l'image

### Suppression
- **Bouton "Supprimer"**: Supprime du Storage et met `photo_url = NULL`
- **Nettoyage**: Suppression complète des données

### Sécurité
- **Authentification**: Seuls les utilisateurs connectés peuvent uploader
- **Isolation**: Chaque utilisateur ne peut modifier que ses fichiers
- **Lecture publique**: Les propriétaires peuvent voir les photos

## 📁 Structure des fichiers

```
avatars/
├── {userId1}/
│   └── profile.jpg
├── {userId2}/
│   └── profile.jpg
└── ...
```

## 🔍 URLs générées

Les URLs publiques ressemblent à :
```
https://[project-id].supabase.co/storage/v1/object/public/avatars/{userId}/profile.jpg
```

## ✅ Tests de validation

### Test 1: Upload d'image
1. Se connecter en tant que professionnel
2. Aller sur la page "Mon profil"
3. Cliquer sur "Modifier"
4. Cliquer sur "Changer la photo"
5. Sélectionner une image JPG/PNG
6. Vérifier l'upload et l'aperçu

### Test 2: Remplacement d'image
1. Avec une image déjà uploadée
2. Cliquer sur "Remplacer la photo"
3. Sélectionner une nouvelle image
4. Vérifier le remplacement

### Test 3: Suppression d'image
1. Avec une image uploadée
2. Cliquer sur "Supprimer"
3. Vérifier la suppression de l'aperçu
4. Vérifier que `photo_url = NULL` en base

### Test 4: Récupération des données
```sql
-- Vérifier que les photos sont récupérables
SELECT prenom, nom, photo_url 
FROM pro_profiles 
WHERE photo_url IS NOT NULL;
```

## 🚨 Dépannage

### Erreur: "Bucket avatars not found"
- Vérifier que le bucket `avatars` existe
- Vérifier qu'il est public

### Erreur: "Permission denied"
- Vérifier les politiques RLS
- Vérifier que l'utilisateur est authentifié

### Erreur: "Column photo_url does not exist"
- Exécuter la migration SQL
- Vérifier que la colonne a été ajoutée

### Image ne s'affiche pas
- Vérifier l'URL générée
- Vérifier que le bucket est public
- Vérifier les permissions de lecture

## 📊 Monitoring

### Vérifier l'utilisation du storage
```sql
-- Taille du bucket avatars
SELECT 
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects 
WHERE bucket_id = 'avatars';
```

### Vérifier les photos orphelines
```sql
-- Photos en storage mais pas en DB
SELECT path_tokens[2] as user_id
FROM storage.objects 
WHERE bucket_id = 'avatars'
AND path_tokens[2] NOT IN (
  SELECT user_id::text FROM pro_profiles WHERE photo_url IS NOT NULL
);
```

## 🎉 Résultat final

Une fois déployé, les professionnels peuvent :
- ✅ Uploader leur photo de profil
- ✅ Voir un aperçu immédiat
- ✅ Remplacer leur photo
- ✅ Supprimer leur photo
- ✅ Les propriétaires peuvent voir les photos dans les résultats de recherche
