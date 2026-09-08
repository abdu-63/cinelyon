# Guide d'Intégration de l'API Fanart.tv — CinéLyon

> **Statut :** Planifié pour implémentation future  
> **Date de rédaction :** 8 septembre 2026  
> **Objectif :** Remplacer les affiches marketing horizontales par de véritables scènes cinématographiques épurées (1080p/4K sans texte ni logos) et enrichir la qualité des logos transparents (HD ClearLogos).

---

## 1. Pourquoi intégrer Fanart.tv ?

Actuellement, les fonds de bannières (backdrops) proviennent du premier résultat renvoyé par l'API TMDB (`movie.get("backdrop_path")`). Pour beaucoup de films récents ou blockbusters (ex: *Fast & Furious 9*), ce visuel par défaut est une affiche marketing modifiée (poses de studio sur fond de fumée artificielle, montages promotionnels) plutôt qu'un véritable plan du film.

### Avantages de Fanart.tv :
1. **Section `moviebackground` strictement modérée** :
   - Zéro texte ou titre de film incrusté.
   - Zéro logo commercial ou mention légale.
   - Uniquement de réelles captures de scènes du film ou plans larges de cinéma en haute définition (1920x1080 minimum).
2. **Qualité des `hdmovielogo`** :
   - Logos transparents (ClearLogos) détourés manuellement avec une grande précision.
3. **Parité Web & Mobile** :
   - Alimente à la fois CinéLyon Web et l'application mobile native CinéLyon App.

---

## 2. Prérequis & Clé d'API

1. **Créer un compte sur Fanart.tv** :
   - Rendez-vous sur [https://fanart.tv](https://fanart.tv).
   - Créez un compte utilisateur gratuit.
2. **Générer une Project API Key** :
   - Accédez à la section **API** dans les paramètres du compte : [https://fanart.tv/get-an-api-key/](https://fanart.tv/get-an-api-key/)
   - Créez une nouvelle clé pour le projet **CinéLyon**.
3. **Configurer les variables d'environnement** :
   - Dans `.env.local` (développement) et sur Vercel / Supabase (production) :
     ```env
     FANART_API_KEY="votre_cle_api_fanart_ici"
     # Si utilisé côté client Next.js :
     NEXT_PUBLIC_FANART_API_KEY="votre_cle_api_fanart_ici"
     ```

---

## 3. Spécification de l'API Fanart.tv

### Endpoint Film
```http
GET https://webservice.fanart.tv/v3/movies/{id}?api_key={FANART_API_KEY}
```
> **Remarque importante :** `{id}` peut être soit l'**ID TMDB** (numérique, ex: `385128`), soit l'**ID IMDB** (ex: `tt5433138`). Comme CinéLyon récupère déjà le `movie_id` TMDB lors de la recherche du film, l'intégration est directe.

### Structure de la Réponse JSON (Extrait)
```json
{
  "name": "F9",
  "tmdb_id": "385128",
  "imdb_id": "tt5433138",
  "moviebackground": [
    {
      "id": "218492",
      "url": "https://assets.fanart.tv/fanart/movies/385128/moviebackground/fast--furious-9-5eb817c768913.jpg",
      "lang": "00",
      "likes": "14"
    },
    {
      "id": "218501",
      "url": "https://assets.fanart.tv/fanart/movies/385128/moviebackground/fast--furious-9-5eb820f1a4a15.jpg",
      "lang": "00",
      "likes": "8"
    }
  ],
  "hdmovielogo": [
    {
      "id": "219803",
      "url": "https://assets.fanart.tv/fanart/movies/385128/hdmovielogo/fast--furious-9-5ed4f8d9b1523.png",
      "lang": "en",
      "likes": "18"
    }
  ]
}
```

---

## 4. Options d'Architecture pour l'Implémentation

### Option A (Recommandée) : Côté Scraper Backend Python (`Classes.py`)

Cette méthode est la plus performante car l'image de scène est récupérée une seule fois lors du scraping quotidien et persistée dans la base Supabase. Ainsi, les utilisateurs du site web et de l'application mobile bénéficient d'un temps de chargement immédiat sans requêtes API supplémentaires.

#### Implémentation dans `legacy-flask/modules/Classes.py` :
```python
import os
import requests

FANART_API_KEY = os.getenv("FANART_API_KEY")

def fetch_fanart_movie_assets(tmdb_movie_id: int):
    """
    Récupère la meilleure scène cinématique (moviebackground) et le logo HD sur Fanart.tv.
    Retourne un tuple (backdrop_url, logo_url).
    """
    if not FANART_API_KEY or not tmdb_movie_id:
        return None, None
        
    url = f"https://webservice.fanart.tv/v3/movies/{tmdb_movie_id}?api_key={FANART_API_KEY}"
    try:
        res = requests.get(url, timeout=4)
        if res.status_code == 200:
            data = res.json()
            
            # 1. Scène cinématique (moviebackground avec le plus de likes)
            backgrounds = data.get("moviebackground", [])
            best_backdrop = None
            if backgrounds:
                sorted_bgs = sorted(backgrounds, key=lambda b: int(b.get("likes", 0)), reverse=True)
                best_backdrop = sorted_bgs[0].get("url")
                
            # 2. Logo HD transparent
            logos = data.get("hdmovielogo", []) or data.get("movielogo", [])
            best_logo = None
            if logos:
                # Priorité au logo français, sinon anglais
                fr_logos = [l for l in logos if l.get("lang") == "fr"]
                best_logo_obj = fr_logos[0] if fr_logos else logos[0]
                best_logo = best_logo_obj.get("url")
                
            return best_backdrop, best_logo
    except Exception as e:
        print(f"[Fanart.tv Error] Impossible de récupérer les assets pour TMDB {tmdb_movie_id}: {e}")
        
    return None, None
```

#### Intégration dans le flux d'enrichissement du film :
```python
# Dans la méthode d'enrichissement TMDB (Classes.py Ligne 390+) :
if movie:
    movie_id = movie["id"]
    
    # 1. Backdrop TMDB par défaut (Fallback)
    default_tmdb_backdrop = f"https://image.tmdb.org/t/p/w1280{movie.get('backdrop_path')}" if movie.get("backdrop_path") else None
    
    # 2. Tentative d'enrichissement via Fanart.tv
    fanart_backdrop, fanart_logo = fetch_fanart_movie_assets(movie_id)
    
    # On privilégie la scène pure de Fanart.tv si disponible
    tmdb_backdrop = fanart_backdrop if fanart_backdrop else default_tmdb_backdrop
```

---

### Option B : Côté Frontend Next.js (Hook React Query)

Si l'on souhaite charger la scène à la volée côté client sans dépendre du pipeline de scraping :

#### Création d'un hook `src/hooks/useFanartBackdrop.ts` :
```typescript
import { useQuery } from '@tanstack/react-query';

interface FanartResult {
  backdropUrl: string | null;
  logoUrl: string | null;
}

export function useFanartBackdrop(tmdbId: number | null, defaultBackdrop: string | null) {
  const apiKey = process.env.NEXT_PUBLIC_FANART_API_KEY;

  return useQuery<FanartResult>({
    queryKey: ['fanart', tmdbId],
    queryFn: async () => {
      if (!tmdbId || !apiKey) {
        return { backdropUrl: defaultBackdrop, logoUrl: null };
      }

      try {
        const res = await fetch(`https://webservice.fanart.tv/v3/movies/${tmdbId}?api_key=${apiKey}`);
        if (!res.ok) throw new Error('Fanart not found');
        const data = await res.json();

        const backgrounds = data.moviebackground || [];
        const bestBg = backgrounds.length > 0
          ? backgrounds.sort((a: any, b: any) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0))[0]?.url
          : null;

        return {
          backdropUrl: bestBg || defaultBackdrop,
          logoUrl: data.hdmovielogo?.[0]?.url || null,
        };
      } catch {
        return { backdropUrl: defaultBackdrop, logoUrl: null };
      }
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // Cache 7 jours
    enabled: !!tmdbId && !!apiKey,
  });
}
```

---

## 5. Alternative Immédiate Sans Clé Supplémentaire (Via TMDB Images)

Si une clé Fanart.tv n'est pas disponible immédiatement, TMDB dispose d'un endpoint permettant de filtrer les vraies captures d'écran de scènes sans texte :

```http
GET https://api.themoviedb.org/3/movie/{movie_id}/images?include_image_language=null,fr,en
```

Dans la réponse :
1. Parcourir le tableau `backdrops`.
2. Filtrer les images avec `iso_639_1: null` (garanties sans texte promotionnel).
3. Trier par `vote_count` décroissant : la communauté vote massivement pour les plus beaux plans de cinéma du film.

---

## 6. Checklist de Déploiement

- [ ] Créer un compte sur [fanart.tv](https://fanart.tv) et générer la Project Key.
- [ ] Ajouter `FANART_API_KEY` dans `.env.local` et sur Vercel / Supabase.
- [ ] Mettre à jour `Classes.py` avec la fonction `fetch_fanart_movie_assets`.
- [ ] Relancer un cycle de scraping de test sur un film représentatif (ex: *Fast & Furious 9* ou les sorties de la semaine).
- [ ] Vérifier le rendu sur la fiche film Web (`/film/[slug]`) et l'application mobile.
