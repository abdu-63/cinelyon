#!/usr/bin/env python3
"""
Script de scraping autonome pour récupérer les séances de cinéma.
Sauvegarde les données dans movies.json.
Conçu pour être exécuté via GitHub Actions.
"""

import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# IMPORT DES MODULES
from modules.Classes import Theater

# Charger les variables d'environnement
load_dotenv(".env")

THEATERS_JSON = os.environ.get("THEATERS", "[]")
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")

def get_showtimes(theaters: list[Theater], date: datetime) -> list[dict]:
    """Récupère les séances pour une date donnée."""
    showtimes_list = []
    
    for theater in theaters:
        showtimes_list.extend(theater.getShowtimes(date))
    
    data = {}
    
    for showtime in showtimes_list:
        movie = showtime.movie
        theater = showtime.theater
        
        if movie.title not in data.keys():
            data[movie.title] = {
                "title": movie.title,
                "release_year": movie.release_year,
                "duree": movie.runtime,
                "rating": movie.rating,
                "genres": ", ".join(movie.genres),
                "realisateur": movie.director,
                "synopsis": movie.synopsis,
                "affiche": movie.affiche,
                "director": movie.director,
                "wantToSee": movie.wantToSee,
                "url": movie.letterboxd_url,
                "seances": {}
            }
        
        if theater.name not in data[movie.title]["seances"].keys():
            data[movie.title]["seances"][theater.name] = []
        
        data[movie.title]["seances"][theater.name].append({
            "time": showtime.startsAt.strftime("%H:%M"),
            "lang": showtime.language,
            "format": showtime.format
        })
    
    movies = list(data.values())
    movies = sorted(movies, key=lambda x: x["wantToSee"], reverse=True)
    
    return movies


def main():
    print("🎬 Démarrage du scraping des séances de cinéma...")
    
    # Charger les cinémas depuis les variables d'environnement
    theaters_config = json.loads(THEATERS_JSON)
    
    if not theaters_config:
        print("❌ Aucun cinéma configuré. Vérifiez la variable THEATERS.")
        return
    
    if not TMDB_API_KEY:
        print("⚠️ TMDB_API_KEY non configurée ! Les données TMDB seront manquantes.")
    
    theaters = []
    for theater_data in theaters_config:
        theaters.append(Theater({
            "name": theater_data["name"],
            "internalId": theater_data["id"],
            "latitude": theater_data["latitude"],
            "longitude": theater_data["longitude"],
            "location": None
        }))
    
    print(f"📍 {len(theaters)} cinéma(s) configuré(s)")
    
    # Récupérer les séances pour les 7 prochains jours
    all_data = {
        "generated_at": datetime.now().isoformat(),
        "days": []
    }
    
    for i in range(7):
        date = datetime.today() + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        
        print(f"📅 Récupération des séances pour {date_str}...")
        
        movies = get_showtimes(theaters, date)
        
        all_data["days"].append({
            "date": date_str,
            "movies": movies
        })
        
        print(f"   ✅ {len(movies)} film(s) récupéré(s)")
    
    # Sauvegarder dans movies.json
    output_file = "movies.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Données sauvegardées dans {output_file}")
    print(f"📊 Total: {sum(len(day['movies']) for day in all_data['days'])} entrées de films sur 7 jours")


if __name__ == "__main__":
    main()
