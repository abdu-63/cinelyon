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
        # Récupérer l'année originale d'Allocine si disponible
        self.allocine_year = data.get("releaseDate", {}).get("date", "").split("-")[0]

        # Extraire le(s) réalisateur(s) AVANT l'appel TMDB (nécessaire pour le matching)
        self.director = self._extract_directors(data)

        # Récupérer les données TMDB
        tmdb_data = self._get_data_from_tmdb()
        self.release_year = tmdb_data["year"]
        self.rating = tmdb_data["rating"]
        self.synopsis = tmdb_data["synopsis"]
        self.original_title = tmdb_data["original_title"]
        self.english_title = tmdb_data.get("english_title", self.original_title)
        self.trailer_url = tmdb_data.get("trailer_url")
        self.letterboxd_url = self._generate_letterboxd_url()
        self.genres = [genre["translate"] for genre in data["genres"]]
        self.wantToSee = data["stats"]["wantToSeeCount"]
        # Affiche : priorité TMDB, fallback Allocine, puis placeholder
        tmdb_poster = tmdb_data.get("poster_url")
        if tmdb_poster:
            self.affiche = tmdb_poster
        else:
            try:
                self.affiche = data["poster"]["url"]
            except (KeyError, TypeError):
                self.affiche = "/static/images/nocontent.png"

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

    def _get_data_from_tmdb(self):
        """Récupère l'année de sortie, la note et le synopsis du film depuis TMDB (avec cache et retry)."""
        global _tmdb_cache

        # Clé de cache basée sur le titre et l'année Allocine
        cache_key = f"{self.title}|{self.allocine_year or ''}"

        # Vérifier si les données sont en cache
        if cache_key in _tmdb_cache:
            return _tmdb_cache[cache_key]

        default_data = {
            "year": "inconnue",
            "rating": "Note inconnue",
            "synopsis": "Synopsis non disponible",
            "original_title": self.title,
            "english_title": self.title,
            "trailer_url": None,
            "poster_url": None,
        }

        try:
            search_url = "https://api.themoviedb.org/3/search/movie"
            params = {
                "api_key": TMDB_API_KEY,
                "query": self.title,
                "language": "fr-FR",
            }

            if self.allocine_year:
                params["year"] = self.allocine_year

            search_data = tmdb_request(search_url, params)
            results = search_data.get("results", [])

            # Si aucun résultat avec l'année, retenter sans le filtre (ressorties)
            if not results and self.allocine_year:
                params_no_year = {k: v for k, v in params.items() if k != "year"}
                search_data = tmdb_request(search_url, params_no_year)
                results = search_data.get("results", [])

            movie = None

            if results:
                # Essayer de matcher par réalisateur si disponible
                if self.director and self.director != "Inconnu":
                    director_names = [d.strip().lower() for d in self.director.split(",")]
                    for result in results[:10]:  # Limiter à 10 pour éviter trop d'appels
                        movie_id = result.get("id")
                        credits_url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits"
                        credits_params = {"api_key": TMDB_API_KEY}
                        credits_data = tmdb_request(credits_url, credits_params)
                        crew = credits_data.get("crew", [])
                        tmdb_directors = [c.get("name", "").lower() for c in crew if c.get("job") == "Director"]
                        if any(dn in td or td in dn for dn in director_names for td in tmdb_directors):
                            movie = result
                            break

                # Fallback : préférer le film le plus populaire
                if not movie:
                    sorted_results = sorted(results, key=lambda x: x.get("popularity", 0), reverse=True)
                    movie = sorted_results[0]

            if movie:
                movie_id = movie["id"]
                details_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
                details_params = {"api_key": TMDB_API_KEY, "language": "fr-FR"}
                details_data = tmdb_request(details_url, details_params)

                # Récupérer la bande-annonce YouTube
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

                # Récupérer le titre anglais via un appel en-US
                english_title = movie.get("original_title", self.title)
                try:
                    en_details_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
                    en_details_params = {"api_key": TMDB_API_KEY, "language": "en-US"}
                    en_details_data = tmdb_request(en_details_url, en_details_params)
                    if en_details_data.get("title"):
                        english_title = en_details_data["title"]
                except Exception:
                    pass

                # Construire l'URL de l'affiche TMDB
                poster_path = movie.get("poster_path")
                poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None

                result = {
                    "year": movie.get("release_date", "").split("-")[0] or "inconnue",
                    "rating": str(round(movie.get("vote_average", 0), 1))
                    if movie.get("vote_average")
                    else "Note inconnue",
                    "synopsis": details_data.get("overview", "Synopsis non disponible"),
                    "original_title": movie.get("original_title", self.title),
                    "english_title": english_title,
                    "trailer_url": trailer_url,
                    "poster_url": poster_url,
                }

                # Sauvegarder dans le cache
                _tmdb_cache[cache_key] = result
                save_tmdb_cache_entry(cache_key, result)

                return result

        except Exception as e:
            print(f"❌ Erreur TMDB pour '{self.title}': {e}")

        # Sauvegarder même les résultats par défaut pour éviter de refaire l'appel
        _tmdb_cache[cache_key] = default_data
        save_tmdb_cache_entry(cache_key, default_data)

        return default_data


class Showtime:
    def __init__(self, data, theather, movie: Movie, language: str = "VF", format: str = None) -> None:
        self.startsAt = datetime.fromisoformat(data["startsAt"])
        self.diffusionVersion = data["diffusionVersion"]
        self.services = data["service"]
        self.theater: Theater = theather
        self.movie = movie
        self.language = language  # VO ou VF
        self.format = format  # IMAX, 4DX, 3D, Dolby, ICE, etc.
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
        r = requests.get(f"https://www.allocine.fr/_/showtimes/theater-{self.id}/d-{datestr}/p-{page}/")

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

                        # Regrouper tout en majuscules pour une recherche facile
                        all_format_hints = [str(x).upper() for x in (projections + experience + tags)]
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
                        if re.search(r'\bICE\b', all_hints_str):
                            formats.append("ICE")

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
        r = requests.get(f"https://www.allocine.fr/_/localization_city/{query}")

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
