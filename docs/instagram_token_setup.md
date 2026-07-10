# Renouvellement du Token Instagram (Meta Graph API)

Ce guide explique comment résoudre l'erreur d'expiration du token d'accès Instagram (`INSTAGRAM_ACCESS_TOKEN`) et comment en générer un nouveau qui soit **durable** (60 jours) ou **permanent** (sans expiration).

---

## Pourquoi le script a échoué ?

Le log dans `0_publish.txt` indique :
```
Error validating access token: Session has expired on Wednesday, 08-Jul-26 09:59:20 PDT. The current time is Friday, 10-Jul-26 03:28:40 PDT.
```
Le token Instagram configuré dans les Secrets de ton dépôt GitHub a expiré le **8 juillet 2026**. Par conséquent, l'API Meta rejette les appels de publication.

---

## Étape 1 : Générer un nouveau token de courte durée (2 heures)

1. Rends-toi sur le [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Dans la colonne de droite :
   - **Meta App** : Sélectionne ton application Meta liée à CinéLyon.
   - **User or Page** : Sélectionne **User Token**.
   - **Permissions** : Assure-toi d'ajouter les permissions suivantes :
     - pages_show_list
     - business_management
     - instagram_basic
     - instagram_manage_comments
     - instagram_content_publish
     - pages_read_engagement
3. Clique sur **Generate Access Token**.
4. Copie le token généré (il commence par `EA...` et dure 2 heures).

---

## Étape 2 : Transformer ce token en Token Longue Durée (60 jours)

Les tokens générés par l'explorateur d'API expirent après 2 heures. Tu dois l'échanger contre un token de 60 jours.

### Option A : Utiliser le script `refresh_token.ts`
1. Assure-toi d'avoir configuré ton fichier `.env` à la racine du projet.
2. Ajoute les deux variables suivantes dans ton fichier `.env` :
   ```env
   META_APP_ID=ton-app-id
   META_APP_SECRET=ton-app-secret
   ```
   *(Tu trouveras ces identifiants dans le tableau de bord de ton application sur [Meta for Developers](https://developers.facebook.com/apps/))*
3. Mets à jour la variable `INSTAGRAM_ACCESS_TOKEN` dans ton `.env` avec le **token de courte durée** généré à l'Étape 1.
4. Exécute le script pour générer le token longue durée :
   ```bash
   cd scripts/instagram
   npx ts-node refresh_token.ts
   ```
5. Copie le token longue durée affiché dans la console.

### Option B : Faire la requête manuellement (via curl ou navigateur)
Entre l'URL suivante dans ton navigateur (en remplaçant les valeurs entre accolades) :
```
https://graph.facebook.com/v21.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={ton-app-id}&
  client_secret={ton-app-secret}&
  fb_exchange_token={ton-token-de-courte-duree-etape-1}
```
L'API te renverra un JSON contenant le nouveau `access_token` valide pour 60 jours.

---

## Étape 3 : Générer un Token Permanent (Optionnel mais Recommandé)

Si ton application utilise un **Token d'Accès Page** pour agir au nom de ta page Facebook (liée à ton compte Instagram Business), tu peux obtenir un token qui **n'expire jamais** :

1. Génère d'abord un token utilisateur longue durée (60 jours) comme expliqué à l'Étape 2.
2. Fais une requête GET sur le endpoint `/me/accounts` avec ce token longue durée :
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token={ton-token-longue-duree-etape-2}
   ```
3. Dans la réponse, trouve la page Facebook liée à ton compte Instagram Business.
4. Récupère la valeur du champ `access_token` associé à cette page. **Ce token n'a pas de date d'expiration** (sauf si tu modifies le mot de passe de ton compte Facebook ou révoques les permissions de l'application).

---

## Étape 4 : Mettre à jour les secrets sur GitHub

Une fois le nouveau token longue durée ou permanent obtenu :

1. Va sur ton dépôt GitHub : [abdu-63/cinelyon](https://github.com/abdu-63/cinelyon).
2. Rends-toi dans **Settings** > **Secrets and variables** > **Actions**.
3. Trouve le secret nommé `INSTAGRAM_ACCESS_TOKEN`.
4. Clique sur l'icône de crayon (Edit) pour modifier sa valeur.
5. Colle ton nouveau token et enregistre.
6. Pense également à mettre à jour la valeur locale dans ton fichier `.env` si tu l'utilises pour tester en local.

---

## Étape 5 : Relancer le Workflow

Une fois le secret mis à jour :
1. Sur GitHub, va dans l'onglet **Actions**.
2. Clique sur le workflow **Instagram Daily Poster** à gauche.
3. Clique sur **Run workflow** en haut à droite pour déclencher une exécution manuelle immédiate et tester que tout fonctionne.
