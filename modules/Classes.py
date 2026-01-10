from dataclasses import dataclass
from datetime import datetime
import requests
import re
import unicodedata
from dotenv import load_dotenv
import os
import json

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

# Cache TMDB pour éviter les appels API répétés
TMDB_CACHE_FILE = "tmdb_cache.json"
_tmdb_cache = {}

def load_tmdb_cache():
    """Charge le cache TMDB depuis le fichier."""
    global _tmdb_cache
    if os.path.exists(TMDB_CACHE_FILE):
        try:
            with open(TMDB_CACHE_FILE, "r", encoding="utf-8") as f:
                _tmdb_cache = json.load(f)
        except (json.JSONDecodeError, IOError):
            _tmdb_cache = {}

def save_tmdb_cache():
    """Sauvegarde le cache TMDB dans un fichier."""
    with open(TMDB_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(_tmdb_cache, f, ensure_ascii=False, indent=2)

# Charger le cache au démarrage
load_tmdb_cache()

class Movie:
    def __init__(self, data) -> None:
        self.data = data
        self.title = data["title"]
        self.id = data['internalId']
        self.runtime = data["runtime"]
        # Récupérer l'année originale d'Allocine si disponible
        self.allocine_year = data.get("releaseDate", {}).get("date", "").split("-")[0]
        # Récupérer les données TMDB
        tmdb_data = self._get_data_from_tmdb()
        self.release_year = tmdb_data["year"]
        self.rating = tmdb_data["rating"]
        self.synopsis = tmdb_data["synopsis"]  # Utiliser le synopsis de TMDB
        self.original_title = tmdb_data["original_title"]  # Titre original anglais
        self.letterboxd_url = self._generate_letterboxd_url()
        self.genres = [genre['translate'] for genre in data["genres"]]
        self.wantToSee = data['stats']["wantToSeeCount"]
        try:
            self.affiche = data["poster"]["url"]
        except:
            self.affiche = "/static/images/nocontent.png"

        # Nom du réalisateur
        if len(data["credits"]) == 0:
            self.director = "Inconnu"
        else:
            if data["credits"][0]["person"]["lastName"] == None:
                data["credits"][0]["person"]["lastName"] = ""
                
            if data["credits"][0]["person"]["firstName"] == None:
                data["credits"][0]["person"]["firstName"] = ""

            self.director = f'{data["credits"][0]["person"]["firstName"]} {data["credits"][0]["person"]["lastName"]}'
            self.director = self.director.lstrip()

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.title}>"

    def _slugify(self, text):
        """Convertit un titre en slug pour Letterboxd."""
        # Normaliser les accents (é -> e, etc.)
        text = unicodedata.normalize('NFD', text)
        text = text.encode('ascii', 'ignore').decode('utf-8')
        # Convertir en minuscules
        text = text.lower()
        # Remplacer les espaces et caractères spéciaux par des tirets
        text = re.sub(r'[^a-z0-9]+', '-', text)
        # Supprimer les tirets en début et fin
        text = text.strip('-')
        return text

    def _generate_letterboxd_url(self):
        """Génère l'URL Letterboxd (Universal Link: ouvre l'app sur mobile si installée)."""
        from urllib.parse import quote
        search_query = f"{self.original_title} {self.release_year}"
        return f"https://letterboxd.com/search/{quote(search_query)}/"

    def _get_data_from_tmdb(self):
        """Récupère l'année de sortie, la note et le synopsis du film depuis TMDB (avec cache)."""
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
            "original_title": self.title
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
            
            search_response = requests.get(search_url, params=params)
            search_data = search_response.json()
            
            movie = None
            results = search_data.get("results", [])
            
            if results:
                if self.allocine_year:
                    matching_results = [
                        r for r in results 
                        if r.get("release_date", "").startswith(self.allocine_year)
                    ]
                    movie = matching_results[0] if matching_results else results[0]
                else:
                    if hasattr(self, 'director') and self.director and self.director != "Inconnu":
                        for result in results:
                            movie_id = result.get("id")
                            credits_url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits"
                            credits_params = {"api_key": TMDB_API_KEY}
                            try:
                                credits_response = requests.get(credits_url, params=credits_params)
                                credits_data = credits_response.json()
                                crew = credits_data.get("crew", [])
                                directors = [c.get("name", "").lower() for c in crew if c.get("job") == "Director"]
                                if any(self.director.lower() in d or d in self.director.lower() for d in directors):
                                    movie = result
                                    break
                            except:
                                pass
                    
                    if not movie:
                        sorted_results = sorted(
                            [r for r in results if r.get("release_date")],
                            key=lambda x: x.get("release_date", ""),
                            reverse=True
                        )
                        movie = sorted_results[0] if sorted_results else results[0]
            
            if movie:
                movie_id = movie["id"]
                details_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
                details_params = {"api_key": TMDB_API_KEY, "language": "fr-FR"}
                details_response = requests.get(details_url, params=details_params)
                details_data = details_response.json()
                
                result = {
                    "year": movie.get("release_date", "").split("-")[0] or "inconnue",
                    "rating": str(round(movie.get("vote_average", 0), 1)) if movie.get("vote_average") else "Note inconnue",
                    "synopsis": details_data.get("overview", "Synopsis non disponible"),
                    "original_title": movie.get("original_title", self.title)
                }
                
                # Sauvegarder dans le cache
                _tmdb_cache[cache_key] = result
                save_tmdb_cache()
                
                return result
            
        except Exception as e:
            print(f"Erreur TMDB: {e}")
        
        # Sauvegarder même les résultats par défaut pour éviter de refaire l'appel
        _tmdb_cache[cache_key] = default_data
        save_tmdb_cache()
        
        return default_data

class Showtime:
    def __init__(self, data, theather, movie:Movie, language:str = "VF", format:str = None) -> None:
        self.startsAt = datetime.fromisoformat(data['startsAt'])
        self.diffusionVersion = data['diffusionVersion']
        self.services = data["service"]
        self.theater:Theater = theather
        self.movie = movie
        self.language = language  # VO ou VF
        self.format = format  # IMAX, 4DX, 3D, etc.
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
        return f"<{self.__class__.__name__} name={self.movie.title} startsAt={self.startsAt} lang={self.language} format={self.format}>"

class Theater:
    def __init__(self, data) -> None:
        self.name = data['name']
        self.id = data['internalId']
        self.location = data['location']
        self.latitude = data['latitude']
        self.longitude = data['longitude']

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

        if data.get('error'):
            raise Exception(f"API Error: {data}")
        
        for movie in data['results']:
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
                        # Extraire le format (IMAX, 4DX, 3D)
                        formats = []
                        
                        # Vérifier les projections
                        projections = showtime_data.get("projection", [])
                        if projections:
                            if "IMAX" in projections:
                                formats.append("IMAX")
                            if "F_3D" in projections:
                                formats.append("3D")
                        
                        # Vérifier les expériences
                        experience = showtime_data.get("experience", [])
                        if experience:
                            if "E_4DX" in experience:
                                formats.append("4DX")
                            """if "PLF" in experience:
                                formats.append("PLF")"""
                        
                        format_str = ", ".join(formats) if formats else None
                        showtimes.append(Showtime(showtime_data, self, inst, language, format_str))
        
        if int(data['pagination']['page']) < int(data['pagination']["totalPages"]):
            return self.getShowtimes(date, page + 1, showtimes)
        
        return showtimes
    
    @staticmethod
    def new(query:str):
        r = requests.get(f"https://www.allocine.fr/_/localization_city/{query}")

        try:
            data = r.json()
        except:
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