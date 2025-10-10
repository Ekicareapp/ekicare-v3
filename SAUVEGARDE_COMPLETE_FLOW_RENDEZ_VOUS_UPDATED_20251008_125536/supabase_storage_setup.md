# Configuration Supabase Storage pour les photos de profil

## Bucket `avatars`

### Configuration requise

1. **Créer le bucket `avatars`** dans Supabase Dashboard
   - Aller dans Storage > Buckets
   - Créer un nouveau bucket nommé `avatars`
   - Activer l'accès public pour les lectures

### Politique de sécurité (RLS)

#### 1. Politique d'upload (INSERT)
```sql
-- Seuls les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 2. Politique de mise à jour (UPDATE)
```sql
-- Seuls les propriétaires peuvent modifier leurs fichiers
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. Politique de suppression (DELETE)
```sql
-- Seuls les propriétaires peuvent supprimer leurs fichiers
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 4. Politique de lecture (SELECT)
```sql
-- Lecture publique pour que les propriétaires voient les photos
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

### Structure des fichiers

```
avatars/
├── {userId1}/
│   └── profile.jpg
├── {userId2}/
│   └── profile.jpg
└── ...
```

### Format de nom de fichier

- **Chemin** : `{userId}/profile.jpg`
- **Exemple** : `123e4567-e89b-12d3-a456-426614174000/profile.jpg`

### Avantages de cette structure

1. **Sécurité** : Chaque utilisateur ne peut accéder qu'à ses propres fichiers
2. **Performance** : Structure organisée par utilisateur
3. **Simplicité** : Un seul fichier par utilisateur (remplacement automatique)
4. **URLs publiques** : Accessibles aux propriétaires pour voir les photos des pros

### Test de la configuration

1. **Upload** : Vérifier qu'un utilisateur peut uploader dans son dossier
2. **Lecture** : Vérifier que l'URL publique fonctionne
3. **Sécurité** : Vérifier qu'un utilisateur ne peut pas accéder aux fichiers d'un autre
4. **Suppression** : Vérifier que la suppression fonctionne correctement

### URLs publiques

Les URLs générées ressembleront à :
```
https://[project-id].supabase.co/storage/v1/object/public/avatars/{userId}/profile.jpg
```

### Monitoring

- Surveiller l'utilisation du storage
- Vérifier les logs d'accès
- Nettoyer les fichiers orphelins si nécessaire
