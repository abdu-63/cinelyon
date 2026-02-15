#!/usr/bin/env python3
"""
Script de scraping autonome pour récupérer les séances de cinéma.
Sauvegarde les données dans movies.json.
Conçu pour être exécuté via GitHub Actions.
Supporte le scraping incrémental et la reprise après échec.
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

from modules.Classes import TMDB_CACHE_FILE, Theater

PARIS_TZ = ZoneInfo("Europe/Paris")

load_dotenv(".env")

THEATERS_JSON = os.environ.get("THEATERS", "[]")

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
OUTPUT_FILE = "movies.json"
DAYS_TO_SCRAPE = 10
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
                "trailer_url": movie.trailer_url,
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
    data["generated_at"] = datetime.now(PARIS_TZ).isoformat()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_dates_to_scrape(existing_data: dict) -> list[str]:
    """Détermine les dates à scraper (manquantes ou à mettre à jour)."""
    today = datetime.now(PARIS_TZ).date()
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
    today = datetime.now(PARIS_TZ).date()
    valid_dates = set()

    for i in range(DAYS_TO_SCRAPE):
        date = today + timedelta(days=i)
        valid_dates.add(date.strftime("%Y-%m-%d"))

    data["days"] = [day for day in data.get("days", []) if day.get("date") in valid_dates]
    return data


def check_missing_data(existing_data: dict) -> tuple[set[str], set[str]]:
    """Vérifie si des films ont des données manquantes (affiche, synopsis).
    Retourne les dates à rescraper et les titres de films à supprimer du cache TMDB."""
    dates_with_missing_data = set()
    films_to_clear_from_cache = set()

    for day in existing_data.get("days", []):
        date_str = day.get("date", "")
        movies = day.get("movies", [])

        for movie in movies:
            title = movie.get("title", "Inconnu")
            year = movie.get("release_year", "")

            affiche = movie.get("affiche", "")
            has_missing_data = False

            if not affiche or affiche == "/static/images/nocontent.png":
                logger.info(f"   📷 Affiche manquante pour '{title}' ({date_str})")
                has_missing_data = True

            synopsis = movie.get("synopsis", "")
            if not synopsis or synopsis == "Synopsis non disponible":
                logger.info(f"   📝 Synopsis manquant pour '{title}' ({date_str})")
                has_missing_data = True

            if has_missing_data:
                dates_with_missing_data.add(date_str)
                films_to_clear_from_cache.add(f"{title}|{year}")

    return dates_with_missing_data, films_to_clear_from_cache


def main():
    # Parser d'arguments
    parser = argparse.ArgumentParser(description="Script de scraping des séances de cinéma")
    parser.add_argument("--force", action="store_true", help="Forcer le rescraping complet de toutes les dates")
    parser.add_argument("--clear-cache", action="store_true", help="Vider le cache TMDB avant le scraping")
    args = parser.parse_args()

    logger.info("🎬 Démarrage du scraping des séances de cinéma...")

    # Vider le cache TMDB si demandé
    if args.clear_cache:
        if os.path.exists(TMDB_CACHE_FILE):
            os.remove(TMDB_CACHE_FILE)
            logger.info("🗑️ Cache TMDB supprimé")

    try:
        theaters_config = json.loads(THEATERS_JSON)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Erreur parsing JSON THEATERS: {e}")
        logger.error(f"   Valeur reçue: '{THEATERS_JSON[:100]}'")
        sys.exit(1)

    if not theaters_config:
        logger.error("❌ Aucun cinéma configuré. Vérifiez le secret THEATERS dans GitHub.")
        logger.error(f"   THEATERS_JSON='{THEATERS_JSON}'")
        sys.exit(1)

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

    # Charger les données existantes (sauf si --force)
    if args.force:
        existing_data = {"generated_at": None, "days": []}
        logger.info("🔄 Mode force activé - rescraping complet")
    else:
        existing_data = load_existing_data()
        existing_data = clean_old_dates(existing_data)

    # Déterminer les dates à scraper
    dates_to_scrape = set(get_dates_to_scrape(existing_data))

    # Vérifier les données manquantes
    if not args.force:
        logger.info("🔍 Vérification des données manquantes...")
        dates_with_missing, films_to_clear = check_missing_data(existing_data)
        if dates_with_missing:
            logger.info(f"   ⚠️ {len(dates_with_missing)} date(s) avec données manquantes")
            logger.info(f"   🗑️ {len(films_to_clear)} film(s) à supprimer du cache TMDB")

            titles_to_clear = {key.split("|")[0] for key in films_to_clear}

            if os.path.exists(TMDB_CACHE_FILE):
                try:
                    with open(TMDB_CACHE_FILE, "r", encoding="utf-8") as f:
                        tmdb_cache = json.load(f)

                    keys_to_delete = []
                    for cache_key in tmdb_cache.keys():
                        cache_title = cache_key.split("|")[0]
                        if cache_title in titles_to_clear:
                            keys_to_delete.append(cache_key)

                    for key in keys_to_delete:
                        del tmdb_cache[key]
                        logger.info(f"      🧹 Cache supprimé pour: {key.split('|')[0]}")

                    with open(TMDB_CACHE_FILE, "w", encoding="utf-8") as f:
                        json.dump(tmdb_cache, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    logger.warning(f"   ⚠️ Erreur nettoyage cache: {e}")

            dates_to_scrape.update(dates_with_missing)
            existing_data["days"] = [day for day in existing_data.get("days", [])
                                      if day.get("date") not in dates_with_missing]

    dates_to_scrape = sorted(list(dates_to_scrape))

    if not dates_to_scrape:
        logger.info("✅ Toutes les données sont à jour, aucun scraping nécessaire.")
        logger.info("   Utilisez --force pour forcer le rescraping")
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
