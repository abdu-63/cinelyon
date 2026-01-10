#!/usr/bin/env python3
"""
Script de scraping autonome pour récupérer les séances de cinéma.
Sauvegarde les données dans movies.json.
Conçu pour être exécuté via GitHub Actions.
Supporte le scraping incrémental et la reprise après échec.
"""

import logging
import json
import os
import time
from datetime import datetime, timedelta

from dotenv import load_dotenv

from modules.Classes import Theater

load_dotenv(".env")

THEATERS_JSON = os.environ.get("THEATERS", "[]")

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
OUTPUT_FILE = "movies.json"
DAYS_TO_SCRAPE = 7
DELAY_BETWEEN_THEATERS = 2  # Délai en secondes entre chaque cinéma


def get_showtimes(theaters: list[Theater], date: datetime) -> list[dict]:
    """Récupère les séances pour une date donnée (séquentiel avec délai)."""
    showtimes_list = []

    for i, theater in enumerate(theaters):
        try:
            showtimes_list.extend(theater.getShowtimes(date))
        except Exception as e:
            logger.error(f"Erreur pour {theater.name}: {e}")

        # Délai entre les requêtes pour éviter le rate limiting (sauf pour le dernier)
        if i < len(theaters) - 1:
            time.sleep(DELAY_BETWEEN_THEATERS)

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
                "seances": {},
            }

        if theater.name not in data[movie.title]["seances"].keys():
            data[movie.title]["seances"][theater.name] = []

        data[movie.title]["seances"][theater.name].append(
            {
                "time": showtime.startsAt.strftime("%H:%M"),
                "lang": showtime.language,
                "format": showtime.format,
                "ticketing_url": showtime.ticketing_url,
            }
        )

    movies = list(data.values())
    movies = sorted(movies, key=lambda x: x["wantToSee"], reverse=True)

    return movies


def load_existing_data() -> dict:
    """Charge les données existantes si disponibles."""
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"generated_at": None, "days": []}


def save_data(data: dict):
    """Sauvegarde les données dans movies.json."""
    data["generated_at"] = datetime.now().isoformat()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_dates_to_scrape(existing_data: dict) -> list[str]:
    """Détermine les dates à scraper (manquantes ou à mettre à jour)."""
    today = datetime.today().date()
    target_dates = set()

    for i in range(DAYS_TO_SCRAPE):
        date = today + timedelta(days=i)
        target_dates.add(date.strftime("%Y-%m-%d"))

    existing_dates = set()
    for day in existing_data.get("days", []):
        date_str = day.get("date", "")
        # Garder les dates existantes seulement si elles sont encore dans la période cible
        if date_str in target_dates:
            existing_dates.add(date_str)

    # Retourner les dates manquantes, triées
    missing_dates = target_dates - existing_dates
    return sorted(list(missing_dates))


def clean_old_dates(data: dict) -> dict:
    """Supprime les dates passées et hors de la période de scraping."""
    today = datetime.today().date()
    valid_dates = set()

    for i in range(DAYS_TO_SCRAPE):
        date = today + timedelta(days=i)
        valid_dates.add(date.strftime("%Y-%m-%d"))

    data["days"] = [day for day in data.get("days", []) if day.get("date") in valid_dates]
    return data


def main():
    logger.info("🎬 Démarrage du scraping des séances de cinéma...")

    theaters_config = json.loads(THEATERS_JSON)

    if not theaters_config:
        logger.error("❌ Aucun cinéma configuré. Vérifiez la variable THEATERS.")
        return

    if not TMDB_API_KEY:
        logger.warning("⚠️ TMDB_API_KEY non configurée ! Les données TMDB seront manquantes.")

    theaters = []
    for theater_data in theaters_config:
        theaters.append(
            Theater(
                {
                    "name": theater_data["name"],
                    "internalId": theater_data["id"],
                    "latitude": theater_data["latitude"],
                    "longitude": theater_data["longitude"],
                    "location": None,
                }
            )
        )

    logger.info(f"📍 {len(theaters)} cinéma(s) configuré(s)")

    # Charger les données existantes
    existing_data = load_existing_data()

    # Nettoyer les dates obsolètes
    existing_data = clean_old_dates(existing_data)

    # Déterminer les dates à scraper
    dates_to_scrape = get_dates_to_scrape(existing_data)

    if not dates_to_scrape:
        logger.info("✅ Toutes les données sont à jour, aucun scraping nécessaire.")
        save_data(existing_data)
        return

    logger.info(f"📅 {len(dates_to_scrape)} jour(s) à scraper (données existantes conservées)")

    # Créer un dictionnaire des jours existants pour accès rapide
    existing_days = {day["date"]: day for day in existing_data.get("days", [])}

    for date_str in dates_to_scrape:
        date = datetime.strptime(date_str, "%Y-%m-%d")

        logger.info(f"📅 Récupération des séances pour {date_str}...")

        try:
            movies = get_showtimes(theaters, date)

            existing_days[date_str] = {"date": date_str, "movies": movies}

            logger.info(f"   ✅ {len(movies)} film(s) récupéré(s)")

            # Sauvegarder après chaque jour pour pouvoir reprendre en cas d'échec
            existing_data["days"] = sorted(existing_days.values(), key=lambda x: x["date"])
            save_data(existing_data)

            # Petit délai pour éviter le rate limiting
            time.sleep(1)

        except Exception as e:
            logger.error(f"❌ Erreur pour {date_str}: {e}")
            logger.warning("💾 Progrès sauvegardé. Relancez le script pour continuer.")
            # Sauvegarder le progrès avant de quitter
            existing_data["days"] = sorted(existing_days.values(), key=lambda x: x["date"])
            save_data(existing_data)
            raise

    logger.info(f"✅ Scraping terminé et sauvegardé dans {OUTPUT_FILE}")
    total_movies = sum(len(day["movies"]) for day in existing_data["days"])
    logger.info(f"📊 Total: {total_movies} entrées de films sur {len(existing_data['days'])} jours")


if __name__ == "__main__":
    main()
