from dataclasses import dataclass
from datetime import datetime
import requests
from dotenv import load_dotenv
import os

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

    def _get_data_from_tmdb(self):
        """Récupère l'année de sortie, la note et le synopsis du film depuis TMDB"""
        try:
            search_url = "https://api.themoviedb.org/3/search/movie"
            # Ajouter l'année dans la recherche si disponible
            query = self.title
            if self.allocine_year:
                query += f" y:{self.allocine_year}"
            
            params = {
                "api_key": TMDB_API_KEY,
                "query": query,
                "language": "fr-FR",
                "year": self.allocine_year  # Filtrer par année
            }
            search_response = requests.get(search_url, params=params)
            search_data = search_response.json()
            
            if search_data.get("results") and len(search_data["results"]) > 0:
                # Trier les résultats par similarité de titre et année
                results = search_data["results"]
                if self.allocine_year:
                    # Filtrer les films qui correspondent à l'année
                    matching_results = [
                        r for r in results 
                        if r.get("release_date", "").startswith(self.allocine_year)
                    ]
                    if matching_results:
                        movie = matching_results[0]
                    else:
                        movie = results[0]
                else:
                    movie = results[0]
                
                # Récupérer plus de détails du film, y compris le synopsis complet
                movie_id = movie["id"]
                details_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
                details_params = {
                    "api_key": TMDB_API_KEY,
                    "language": "fr-FR"
                }
                details_response = requests.get(details_url, params=details_params)
                details_data = details_response.json()
                
                return {
                    "year": movie.get("release_date", "").split("-")[0] or "inconnue",
                    "rating": str(round(movie.get("vote_average", 0), 1)) if movie.get("vote_average") else "Note inconnue",
                    "synopsis": details_data.get("overview", "Synopsis non disponible")
                }
            
        except Exception as e:
            print(f"Erreur lors de la récupération des données depuis TMDB: {e}")
        
        return {
            "year": "inconnue", 
            "rating": "Note inconnue",
            "synopsis": "Synopsis non disponible"
        }

class Showtime:
    def __init__(self, data, theather, movie:Movie, language:str = "VF", format:str = None) -> None:
        self.startsAt = datetime.fromisoformat(data['startsAt'])
        self.diffusionVersion = data['diffusionVersion']
        self.services = data["service"]
        self.theater:Theater = theather
        self.movie = movie
        self.language = language  # VO ou VF
        self.format = format  # IMAX, 4DX, 3D, etc.

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
                            if "PLF" in experience:
                                formats.append("PLF")
                        
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