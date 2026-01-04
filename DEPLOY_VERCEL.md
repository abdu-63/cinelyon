# Déployer CinéLyon sur Vercel (Gratuit)

Ce tutoriel explique comment déployer CinéLyon sur Vercel avec le scraping automatisé via GitHub Actions.

## Prérequis

- Un compte [Vercel](https://vercel.com) (gratuit)
- Un compte [GitHub](https://github.com) avec le projet CinéLyon
- Les secrets GitHub déjà configurés (`TMDB_API_KEY`, `THEATERS`)

---

## 1. Préparer le projet pour Vercel

### Créer `vercel.json`

À la racine du projet, créez ce fichier :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}
```

### Modifier `app.py` pour Vercel

Vercel nécessite que l'application Flask soit exposée comme `app`. Vérifiez que votre `app.py` contient bien :

```python
app = Flask(__name__)
```

Et **supprimez ou commentez** les lignes de lancement local à la fin :

```python
# if __name__ == '__main__':
#     app.run()
```

---

## 2. Déployer sur Vercel

### Option A : Via l'interface Vercel (recommandé)

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Cliquez sur **Import Git Repository**
3. Connectez votre compte GitHub si ce n'est pas fait
4. Sélectionnez le repository `cinelyon`
5. Configurez les variables d'environnement :
   - `MAPBOX_TOKEN` : votre token Mapbox
   - `WEBSITE_TITLE` : CinéLyon
   - `THEATERS` : le JSON de vos cinémas
6. Cliquez sur **Deploy**

### Option B : Via la CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
cd /chemin/vers/cinelyon
vercel
```

---

## 3. Configurer les variables d'environnement sur Vercel

1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez :

| Variable | Valeur |
|----------|--------|
| `MAPBOX_TOKEN` | `pk.eyJ1...` (votre token) |
| `WEBSITE_TITLE` | `CinéLyon` |
| `THEATERS` | `[{"id":"P8507","name":"Pathé Carré de Soie",...}]` |

> ⚠️ **Note** : `TMDB_API_KEY` n'est pas nécessaire sur Vercel car le scraping est fait par GitHub Actions. Les données sont déjà dans `movies.json`.

---

## 4. Vérifier le déploiement automatique

Vercel redéploie automatiquement à chaque push sur `main`. Le flux est :

```
GitHub Actions (4h UTC)
    ↓
scrape.py → movies.json (commit auto)
    ↓
Vercel détecte le push
    ↓
Redéploiement automatique
    ↓
Site mis à jour avec nouvelles données
```

---

## 5. Vérifications finales

1. **Testez votre site** : `https://votre-projet.vercel.app`
2. **Vérifiez la carte Mapbox** : Les cinémas s'affichent ?
3. **Vérifiez les films** : Les données TMDB sont présentes ?

---

## Dépannage

### La carte ne s'affiche pas
- Vérifiez que `MAPBOX_TOKEN` est configuré dans Vercel
- Vérifiez que le token est valide sur [console.mapbox.com](https://console.mapbox.com)

### Les films n'apparaissent pas
- Vérifiez que `movies.json` existe dans le repo
- Lancez manuellement le workflow GitHub Actions

### Erreur 500 sur Vercel
- Vérifiez les logs : **Vercel Dashboard** → **Deployments** → **View Logs**
- Vérifiez que toutes les variables d'environnement sont configurées

---

## Structure finale

```
cinelyon/
├── vercel.json          ← Configuration Vercel
├── app.py               ← Application Flask
├── movies.json          ← Données (généré par GitHub Actions)
├── requirements.txt     ← Dépendances Python
├── .github/workflows/
│   └── scrape.yml       ← Scraping quotidien
└── ...
```

---

## Liens utiles

- [Documentation Vercel Python](https://vercel.com/docs/functions/runtimes/python)
- [Console Mapbox](https://console.mapbox.com)
- [Secrets GitHub Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
