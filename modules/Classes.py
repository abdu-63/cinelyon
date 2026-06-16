import json
import os
import re
import time
import unicodedata
from dataclasses import dataclass
from datetime import datetime

import requests
from dotenv import load_dotenv
from supabase import create_client


@dataclass
class Cinema:
    id: str
    name: str
    latitude: float
    longitude: float


# Charger les variables d'environnement
load_dotenv()

# Récupérer la clé API
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

# Supabase
_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
_supabase = None


def _get_supabase():
    global _supabase
    if _supabase is None and _SUPABASE_URL and _SUPABASE_KEY:
        _supabase = create_client(_SUPABASE_URL, _SUPABASE_KEY)
    return _supabase


# Cache TMDB en mémoire
_tmdb_cache = {}

# Garde le chemin du fichier local pour la migration initiale
TMDB_CACHE_FILE = "tmdb_cache.json"


def load_tmdb_cache():
    """Charge le cache TMDB depuis Supabase (fallback fichier local si nécessaire)."""
    global _tmdb_cache
    sb = _get_supabase()
    if sb:
        try:
            rows = sb.table("tmdb_cache").select("key, data").execute().data or []
            _tmdb_cache = {row["key"]: row["data"] for row in rows}
            print(f"✅ Cache TMDB chargé depuis Supabase ({len(_tmdb_cache)} entrées)")
            return
        except Exception as e:
            print(f"⚠️ Impossible de charger le cache TMDB depuis Supabase: {e}")
    # Fallback : fichier local
    if os.path.exists(TMDB_CACHE_FILE):
        try:
            with open(TMDB_CACHE_FILE, "r", encoding="utf-8") as f:
                _tmdb_cache = json.load(f)
            print(f"✅ Cache TMDB chargé depuis fichier local ({len(_tmdb_cache)} entrées)")
        except (json.JSONDecodeError, IOError):
            _tmdb_cache = {}


def save_tmdb_cache_entry(key: str, value: dict):
    """Sauvegarde une entrée du cache TMDB dans Supabase."""
    sb = _get_supabase()
    if sb:
        try:
            sb.table("tmdb_cache").upsert({"key": key, "data": value}, on_conflict="key").execute()
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde cache TMDB Supabase: {e}")


def save_tmdb_cache():
    """Compat: ne fait rien (sauvegarde maintenant faite entrée par entrée)."""


def tmdb_request(url: str, params: dict, max_retries: int = 3) -> dict:
    """Effectue une requête TMDB avec retry et exponential backoff."""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit
                wait_time = 2**attempt
                print(f"   ⏳ Rate limit TMDB, attente {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"   ⚠️ TMDB erreur {response.status_code}")
                return {}
        except requests.exceptions.Timeout:
            print(f"   ⏳ Timeout TMDB (tentative {attempt + 1}/{max_retries})")
            time.sleep(1)
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Erreur réseau TMDB: {e}")
            return {}
    return {}


# Charger le cache au démarrage
load_tmdb_cache()


class Movie:
    def __init__(self, data) -> None:
        self.data = data
        self.title = data["title"]
        self.id = data["internalId"]
        self.runtime = data["runtime"]

        # --- Données Allociné (source primaire, toujours fiables) ---

        # Année de production (fiable, via data.productionYear)
        movie_data = data.get("data") or {}
        self.release_year = str(movie_data.get("productionYear", "")) or "inconnue"

        # Réalisateur(s)
        self.director = self._extract_directors(data)

        # Synopsis Allociné (déjà en français)
        self.synopsis = data.get("synopsis") or "Synopsis non disponible"

        # Titre original Allociné
        self.original_title = data.get("originalTitle") or self.title

        # Note utilisateur Allociné (sur 5)
        allocine_rating = (data.get("stats") or {}).get("userRating") or {}
        if allocine_rating.get("score"):
            score = round(allocine_rating["score"], 1)
            self.rating = f"{score}/5"
        else:
            self.rating = "Note inconnue"

        # URL fiche Allociné
        self.allocine_url = f"https://www.allocine.fr/film/fichefilm_gen_cfilm={self.id}.html"

        # Genres & popularité
        self.genres = [genre["translate"] for genre in data.get("genres", [])]
        self.wantToSee = (data.get("stats") or {}).get("wantToSeeCount", 0)

        # --- TMDB (Trailer YouTube, Titre anglais, Watch Providers, et Affiche TMDB par défaut) ---
        tmdb_data = self._get_tmdb_extras()
        self.trailer_url = tmdb_data.get("trailer_url")
        self.english_title = tmdb_data.get("english_title", self.original_title)
        self.watch_providers = tmdb_data.get("watch_providers", [])
        self.tmdb_score = tmdb_data.get("tmdb_score")  # Note TMDB sur 10
        self.rt_score = tmdb_data.get("rt_score")  # Note Rotten Tomatoes (ex: "87%")
        self.reviews = tmdb_data.get("reviews", [])

        # Affiche TMDB trouvée en premier, sinon fallback sur Allociné, sinon image par défaut
        try:
            allocine_poster = data["poster"]["url"]
        except (KeyError, TypeError):
            allocine_poster = "/static/images/nocontent.png"

        self.affiche = tmdb_data.get("tmdb_poster") or allocine_poster

        # URL Letterboxd
        self.letterboxd_url = self._generate_letterboxd_url()

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.title}>"

    def _extract_directors(self, data):
        """Extrait le(s) réalisateur(s) depuis les crédits Allocine."""
        if not data.get("credits"):
            return "Inconnu"

        directors = []
        for credit in data["credits"]:
            position = credit.get("position", {})
            if position and position.get("name") == "DIRECTOR":
                person = credit.get("person", {})
                first = (person.get("firstName") or "").strip()
                last = (person.get("lastName") or "").strip()
                name = f"{first} {last}".strip()
                if name:
                    directors.append(name)

        if not directors:
            # Fallback : prendre le premier crédit
            person = data["credits"][0].get("person", {})
            first = (person.get("firstName") or "").strip()
            last = (person.get("lastName") or "").strip()
            return f"{first} {last}".strip() or "Inconnu"

        return ", ".join(directors)

    def _slugify(self, text):
        """Convertit un titre en slug pour Letterboxd."""
        text = unicodedata.normalize("NFD", text)
        text = text.encode("ascii", "ignore").decode("utf-8")
        text = text.lower()
        text = re.sub(r"[^a-z0-9]+", "-", text)
        text = text.strip("-")
        return text

    def _generate_letterboxd_url(self):
        """Génère l'URL Letterboxd (Universal Link: ouvre l'app sur mobile si installée)."""
        from urllib.parse import quote

        search_query = self.english_title
        return f"https://letterboxd.com/search/{quote(search_query)}/"

    def _scrape_allocine_reviews(self) -> list[dict]:
        """Scrape max 3 critiques spectateurs courtes depuis Allociné pour ce film."""
        if not self.id:
            return []

        url = f"https://www.allocine.fr/film/fichefilm-{self.id}/critiques/spectateurs/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                return []

            html_text = r.text
            cards = html_text.split('<div class="hred review-card cf"')
            parsed_reviews = []

            for card in cards[1:]:
                try:
                    # Pseudo de l'auteur dans l'attribut alt de la classe thumbnail-img
                    author_match = re.search(r'class="thumbnail-img"[^>]*alt="([^"]+)"', card)
                    author = author_match.group(1) if author_match else "Anonyme"
                    author = author.replace("Critique spectateur de ", "").strip()

                    # Note sur 5
                    rating_match = re.search(r'<span class="stareval-note">([^<]+)</span>', card)
                    rating_str = rating_match.group(1).replace(",", ".") if rating_match else "0.0"
                    rating = float(rating_str)

                    # Date
                    date_match = re.search(r'<span class="review-card-meta-date[^"]*">([^<]+)</span>', card)
                    date = date_match.group(1).replace("Publiée le", "").strip() if date_match else ""

                    # Texte du commentaire
                    text_match = re.search(r'<div class="content-txt review-card-content">\s*(.*?)\s*</div>', card, re.DOTALL)
                    text = text_match.group(1).strip() if text_match else ""
                    text = re.sub(r'<[^>]+>', '', text)  # Nettoyer le HTML
                    from html import unescape
                    text = unescape(text)

                    parsed_reviews.append({
                        "author": author,
                        "rating": rating,
                        "date": date,
                        "text": text
                    })
                except Exception as e:
                    print(f"⚠️ Erreur parsing d'une critique pour '{self.title}': {e}")

            # Filtrer pour préférer les critiques courtes (entre 40 et 230 caractères)
            filtered_reviews = [r for r in parsed_reviews if 40 <= len(r["text"]) <= 230]
            # Trier par longueur croissante
            filtered_reviews.sort(key=lambda r: len(r["text"]))

            # Si on en a moins de 3, compléter avec les plus courtes parmi le reste
            if len(filtered_reviews) < 3:
                remaining = [r for r in parsed_reviews if r not in filtered_reviews and len(r["text"]) >= 40]
                remaining.sort(key=lambda r: len(r["text"]))
                filtered_reviews.extend(remaining)

            return filtered_reviews[:3]
        except Exception as e:
            print(f"❌ Erreur scraping critiques Allociné pour '{self.title}': {e}")
            return []

    def _get_tmdb_extras(self):
        """Récupère le trailer YouTube et le titre anglais depuis TMDB (avec cache)."""
        global _tmdb_cache

        cache_key = f"{self.title}|{self.release_year}"

        if cache_key in _tmdb_cache:
            cached_data = _tmdb_cache[cache_key]
            # Si l'ancienne entrée de cache n'a pas l'affiche TMDB ou les watch_providers, on force un refetch
            if "tmdb_poster" in cached_data and "watch_providers" in cached_data and "tmdb_score" in cached_data:
                # Si "reviews" n'est pas dans le cache, on récupère et ajoute les critiques spectateurs AlloCiné
                if "reviews" not in cached_data:
                    cached_data["reviews"] = self._scrape_allocine_reviews()
                    save_tmdb_cache_entry(cache_key, cached_data)
                return cached_data

        default = {
            "trailer_url": None,
            "english_title": self.original_title,
            "tmdb_poster": None,
            "watch_providers": [],
            "tmdb_score": None,
            "rt_score": None,
            "reviews": [],
        }

        if not TMDB_API_KEY:
            return default

        try:
            search_url = "https://api.themoviedb.org/3/search/movie"
            params = {
                "api_key": TMDB_API_KEY,
                "query": self.title,
                "language": "fr-FR",
            }

            # Utiliser l'année de production Allociné pour un matching précis
            if self.release_year and self.release_year != "inconnue":
                params["year"] = self.release_year

            search_data = tmdb_request(search_url, params)
            results = search_data.get("results", [])

            # Si aucun résultat avec l'année, retenter sans (ressorties)
            if not results and self.release_year and self.release_year != "inconnue":
                params_no_year = {k: v for k, v in params.items() if k != "year"}
                search_data = tmdb_request(search_url, params_no_year)
                results = search_data.get("results", [])

            movie = None

            if results:
                # Matcher par réalisateur si disponible
                if self.director and self.director != "Inconnu":
                    director_names = [d.strip().lower() for d in self.director.split(",")]
                    for result in results[:5]:
                        movie_id = result.get("id")
                        credits_url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits"
                        credits_data = tmdb_request(credits_url, {"api_key": TMDB_API_KEY})
                        crew = credits_data.get("crew", [])
                        tmdb_directors = [c.get("name", "").lower() for c in crew if c.get("job") == "Director"]
                        if any(dn in td or td in dn for dn in director_names for td in tmdb_directors):
                            movie = result
                            break

                # Fallback : matcher par similarité de titre (évite les fausses associations de posters)
                if not movie:

                    def _title_sim(t1, t2):
                        """Score de similarité entre 0 et 1 basé sur les mots communs (Jaccard)."""
                        import unicodedata as _ud

                        t1n = _ud.normalize("NFD", t1.lower()).encode("ascii", "ignore").decode()
                        t2n = _ud.normalize("NFD", t2.lower()).encode("ascii", "ignore").decode()
                        t1n = re.sub(r"[^a-z0-9 ]", "", t1n).strip()
                        t2n = re.sub(r"[^a-z0-9 ]", "", t2n).strip()
                        if not t1n or not t2n:
                            return 0.0
                        if t1n == t2n:
                            return 1.0
                        w1 = set(t1n.split())
                        w2 = set(t2n.split())
                        union = w1 | w2
                        return len(w1 & w2) / len(union) if union else 0.0

                    best_score = 0.0
                    best_candidate = None
                    for candidate in results[:5]:
                        score = max(
                            _title_sim(self.title, candidate.get("title", "")),
                            _title_sim(self.title, candidate.get("original_title", "")),
                        )
                        # Bonus si l'année correspond
                        tmdb_year = (candidate.get("release_date") or "")[:4]
                        if tmdb_year and self.release_year and tmdb_year == str(self.release_year):
                            score = min(score + 0.2, 1.0)
                        if score > best_score:
                            best_score = score
                            best_candidate = candidate

                    # Seuil de 0.5 pour éviter les fausses correspondances
                    if best_candidate and best_score >= 0.5:
                        movie = best_candidate

            if movie:
                movie_id = movie["id"]
                poster_path = movie.get("poster_path")
                tmdb_poster = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None

                # Bande-annonce YouTube
                trailer_url = None
                try:
                    videos_url = f"https://api.themoviedb.org/3/movie/{movie_id}/videos"
                    videos_data = tmdb_request(videos_url, {"api_key": TMDB_API_KEY, "language": "fr-FR"})
                    videos = videos_data.get("results", [])
                    if not videos:
                        videos_data = tmdb_request(videos_url, {"api_key": TMDB_API_KEY, "language": "en-US"})
                        videos = videos_data.get("results", [])
                    for v in videos:
                        if v.get("site") == "YouTube" and v.get("type") == "Trailer":
                            trailer_url = f"https://www.youtube.com/watch?v={v['key']}"
                            break
                    if not trailer_url:
                        for v in videos:
                            if v.get("site") == "YouTube" and v.get("type") == "Teaser":
                                trailer_url = f"https://www.youtube.com/watch?v={v['key']}"
                                break
                except Exception:
                    pass

                # Titre anglais, note TMDB, Watch Providers et score RT
                english_title = self.original_title
                watch_providers = []
                tmdb_score = None
                rt_score = None
                imdb_id = None
                try:
                    en_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
                    params_en = {
                        "api_key": TMDB_API_KEY,
                        "language": "en-US",
                        "append_to_response": "external_ids",
                    }
                    en_data = tmdb_request(en_url, params_en)
                    if en_data.get("title"):
                        english_title = en_data["title"]

                    # Note TMDB sur 10 (arrondie à 1 décimale)
                    vote_avg = en_data.get("vote_average")
                    vote_count = en_data.get("vote_count", 0)
                    if vote_avg and vote_count and vote_count >= 10:
                        tmdb_score = round(float(vote_avg), 1)

                    # IMDB ID pour OMDB
                    imdb_id = en_data.get("imdb_id") or (en_data.get("external_ids") or {}).get("imdb_id")

                    # Plateformes de streaming
                    providers_url = f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers"
                    providers_data = tmdb_request(providers_url, {"api_key": TMDB_API_KEY})
                    fr_providers = providers_data.get("results", {}).get("FR", {})
                    if fr_providers.get("flatrate"):
                        for provider in fr_providers["flatrate"]:
                            watch_providers.append(
                                {
                                    "name": provider.get("provider_name"),
                                    "logo_path": f"https://image.tmdb.org/t/p/original{provider.get('logo_path')}"
                                    if provider.get("logo_path")
                                    else None,
                                }
                            )
                except Exception:
                    pass

                # Note Rotten Tomatoes via OMDB (si clé disponible et IMDB ID trouvé)
                if OMDB_API_KEY and imdb_id:
                    try:
                        omdb_url = "https://www.omdbapi.com/"
                        omdb_data = tmdb_request(omdb_url, {"apikey": OMDB_API_KEY, "i": imdb_id, "tomatoes": "true"})
                        for rating in omdb_data.get("Ratings", []):
                            if rating.get("Source") == "Rotten Tomatoes":
                                rt_score = rating["Value"]  # ex: "87%"
                                break
                    except Exception:
                        pass

                result = {
                    "trailer_url": trailer_url,
                    "english_title": english_title,
                    "tmdb_poster": tmdb_poster,
                    "watch_providers": watch_providers,
                    "tmdb_score": tmdb_score,
                    "rt_score": rt_score,
                    "reviews": self._scrape_allocine_reviews(),
                }
                _tmdb_cache[cache_key] = result
                save_tmdb_cache_entry(cache_key, result)
                return result

        except Exception as e:
            print(f"❌ Erreur TMDB pour '{self.title}': {e}")

        _tmdb_cache[cache_key] = default
        save_tmdb_cache_entry(cache_key, default)
        return default


class Showtime:
    def __init__(self, data, theather, movie: Movie, language: str = "VF", format: str = None) -> None:
        self.startsAt = datetime.fromisoformat(data["startsAt"])
        self.diffusionVersion = data["diffusionVersion"]
        self.services = data["service"]
        self.theater: Theater = theather
        self.movie = movie
        self.language = language  # VO ou VF
        self.format = format  # IMAX, 4DX, 3D, Dolby, ICE, Avant-première, Live, etc.
        # URL de réservation (dans data.ticketing)
        self.ticketing_url = self._extract_ticketing_url(data)

    def _extract_ticketing_url(self, data):
        """Extrait l'URL de réservation depuis les données de la séance."""
        try:
            ticketing_list = data.get("data", {}).get("ticketing", [])
            if not ticketing_list:
                return None

            # Chercher d'abord le provider "default" (URL du cinéma), sinon "allocine"
            for provider_pref in ["default", "allocine", "relay"]:
                for ticketing in ticketing_list:
                    if ticketing.get("provider") == provider_pref:
                        urls = ticketing.get("urls", [])
                        if urls:
                            return urls[0]

            # Si aucun provider préféré, prendre la première URL disponible
            for ticketing in ticketing_list:
                urls = ticketing.get("urls", [])
                if urls:
                    return urls[0]
        except Exception:
            pass
        return None

    def __repr__(self) -> str:
        return (
            f"<{self.__class__.__name__} name={self.movie.title} "
            f"startsAt={self.startsAt} lang={self.language} format={self.format}>"
        )


class Theater:
    def __init__(self, data) -> None:
        self.name = data["name"]
        self.id = data["internalId"]
        self.location = data["location"]
        self.latitude = data["latitude"]
        self.longitude = data["longitude"]

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name}>"

    def getShowtimes(self, date: datetime, page: int = 1, showtimes: list = None) -> list[Showtime]:
        if showtimes is None:
            showtimes = []

        datestr = date.strftime("%Y-%m-%d")
        r = requests.get(f"https://www.allocine.fr/_/showtimes/theater-{self.id}/d-{datestr}/p-{page}/", timeout=15)

        if r.status_code != 200:
            raise Exception(f"Error: {r.status_code} - {r.content}")

        try:
            data = r.json()
        except Exception as e:
            raise Exception(f"Can't parse JSON: {str(e)} - {r.content}")

        if data["message"] == "no.showtime.error":
            return []

        if data["message"] == "next.showtime.on":
            return []

        if data.get("error"):
            raise Exception(f"API Error: {data}")

        for movie in data["results"]:
            # Ignorer les films avec données manquantes
            if movie.get("movie") is None:
                continue

            inst = Movie(movie["movie"])

            # Récupérer toutes les séances avec leur langue
            showtimes_dict = movie.get("showtimes", {})
            for key, value in showtimes_dict.items():
                if isinstance(value, list) and value:
                    # Déterminer la langue selon la clé
                    if key.startswith("original"):
                        language = "VO"
                    elif key in ["dubbed", "local"]:
                        language = "VF"
                    else:
                        language = "VF"  # Par défaut (multiple, etc.)

                    for showtime_data in value:
                        # Extraire le format (IMAX, 4DX, 3D, etc.) depuis projection, experience OU tags
                        formats = []

                        projections = showtime_data.get("projection", []) or []
                        experience = showtime_data.get("experience", []) or []
                        tags = showtime_data.get("tags", []) or []
                        picture = showtime_data.get("picture", []) or []
                        sound = showtime_data.get("sound", []) or []

                        # Regrouper tout en majuscules pour une recherche facile
                        all_format_hints = [str(x).upper() for x in (projections + experience + tags + picture + sound)]
                        all_hints_str = " ".join(all_format_hints)

                        # Check IMAX
                        if "IMAX" in all_hints_str:
                            formats.append("IMAX")

                        # Check 3D
                        if "3D" in all_hints_str:
                            formats.append("3D")

                        # Check 4DX
                        if "4DX" in all_hints_str:
                            formats.append("4DX")

                        # Check Dolby
                        if "DOLBY" in all_hints_str:
                            formats.append("Dolby")

                        # Check ICE
                        if re.search(r"\bICE\b", all_hints_str):
                            formats.append("ICE")

                        # Détecter les événements comme des formats
                        is_preview = showtime_data.get("isPreview", False)
                        if is_preview or "SHOWTIME.EVENT.PREMIER" in all_hints_str:
                            formats.append("Avant-première")
                        elif "SHOWTIME.EVENT.LIVE" in all_hints_str:
                            formats.append("Live")

                        format_str = ", ".join(formats) if formats else None

                        showtimes.append(Showtime(showtime_data, self, inst, language, format_str))

        # Log pagination info
        current_page = data["pagination"]["page"]
        total_pages = data["pagination"]["totalPages"]
        if total_pages > 1:
            print(f"      📄 {self.name}: page {current_page}/{total_pages}")

        if int(current_page) < int(total_pages):
            return self.getShowtimes(date, page + 1, showtimes)

        return showtimes

    @staticmethod
    def new(query: str):
        r = requests.get(f"https://www.allocine.fr/_/localization_city/{query}", timeout=15)

        try:
            data = r.json()
        except ValueError:
            return {"error": True, "message": "Can't parse JSON", "content": r.content}

        if len(data["values"]["theaters"]) == 0:
            return {"error": True, "message": "Not found", "content": r.content}

        return Theater(data["values"]["theaters"][0]["node"])


if __name__ == "__main__":
    cgr = Theater.new("CGR Brest Le Celtic")
    print(f"{cgr.name} ({cgr.id})")
    print(f"{cgr.location['zip']} {cgr.location['city']}")

    showtimes = cgr.getShowtimes(datetime.today())

    print(showtimes[0])
