#!/usr/bin/env python3
"""
Script de scraping autonome pour récupérer les séances de cinéma.
Sauvegarde les données dans Supabase (table showtimes).
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
from supabase import Client, create_client

from modules.Classes import TMDB_CACHE_FILE, Theater

PARIS_TZ = ZoneInfo("Europe/Paris")

load_dotenv(".env")

THEATERS_JSON = os.environ.get("THEATERS", "[]")

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

DAYS_TO_SCRAPE = 10  # Fenêtre de base pour tous les cinémas
DAYS_TO_SCRAPE_EXTENDED = 25  # Fenêtre étendue pour certains cinémas
DELAY_BETWEEN_THEATERS = 2  # Délai en secondes entre chaque cinéma

# Cinémas scrapés sur 25 jours (les autres restent à 10 jours)
EXTENDED_THEATERS = {
    "Pathé Carré de Soie",
    "Pathé Bellecour",
    "Pathé Vaise",
    "UGC Part-Dieu",
    "UGC Confluence",
    "UGC Internationale",
    "UGC Astoria",
    "Ciné Meyzieu",
    "Ciné Toboggan",
    "Les Amphis",
}

_supabase: Client = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            logger.error("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configurés.")
            sys.exit(1)
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase


def get_showtimes(theaters: list[Theater], date: datetime) -> list[dict]:
    """Récupère les séances pour une date donnée (séquentiel avec délai)."""
    showtimes_list = []

    for i, theater in enumerate(theaters):
        try:
            showtimes_list.extend(theater.getShowtimes(date))
        except Exception as e:
            logger.error(f"Erreur pour {theater.name}: {e}")

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
                "allocine_url": movie.allocine_url,
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
    """Charge les données existantes depuis Supabase."""
    supabase = get_supabase()
    today = datetime.now(PARIS_TZ).date()

    try:
        response = supabase.table("showtimes").select("date, movies").gte("date", str(today)).execute()
        rows = response.data or []
    except Exception as e:
        logger.warning(f"⚠️ Impossible de charger depuis Supabase: {e}")
        return {"generated_at": None, "days": []}

    days = [{"date": row["date"], "movies": row["movies"]} for row in rows]
    days = sorted(days, key=lambda x: x["date"])
    return {"generated_at": None, "days": days}


def save_day(date_str: str, movies: list):
    """Upsert d'un jour dans Supabase."""
    supabase = get_supabase()
    try:
        supabase.table("showtimes").upsert(
            {
                "date": date_str,
                "movies": movies,
                "generated_at": datetime.now(PARIS_TZ).isoformat(),
            },
            on_conflict="date",
        ).execute()
    except Exception as e:
        logger.error(f"❌ Erreur lors de la sauvegarde de {date_str} dans Supabase: {e}")
        raise


def clean_old_dates():
    """Supprime les dates passées et hors de la période de scraping étendue."""
    supabase = get_supabase()
    today = datetime.now(PARIS_TZ).date()
    cutoff = today + timedelta(days=DAYS_TO_SCRAPE_EXTENDED)

    try:
        # Supprimer les dates avant aujourd'hui
        supabase.table("showtimes").delete().lt("date", str(today)).execute()
        # Supprimer les dates au-delà de la fenêtre étendue
        supabase.table("showtimes").delete().gt("date", str(cutoff)).execute()
        logger.info("🧹 Dates obsolètes supprimées de Supabase")
    except Exception as e:
        logger.warning(f"⚠️ Erreur nettoyage Supabase: {e}")


def get_dates_to_scrape(existing_data: dict) -> list[str]:
    """Retourne toutes les dates à scraper sur la fenêtre complète.
    Toutes les dates sont toujours rescrapées pour garantir que les nouvelles
    séances ajoutées par les cinémas sont bien récupérées."""
    today = datetime.now(PARIS_TZ).date()
    dates = []
    for i in range(DAYS_TO_SCRAPE_EXTENDED):
        date = today + timedelta(days=i)
        dates.append(date.strftime("%Y-%m-%d"))
    return dates


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
    parser = argparse.ArgumentParser(description="Script de scraping des séances de cinéma")
    parser.add_argument("--force", action="store_true", help="Forcer le rescraping complet de toutes les dates")
    parser.add_argument("--clear-cache", action="store_true", help="Vider le cache TMDB avant le scraping")
    args = parser.parse_args()

    logger.info("🎬 Démarrage du scraping des séances de cinéma...")

    if args.clear_cache:
        if os.path.exists(TMDB_CACHE_FILE):
            os.remove(TMDB_CACHE_FILE)
            logger.info("🗑️ Cache TMDB supprimé")

    try:
        theaters_config = json.loads(THEATERS_JSON)
    except json.JSONDecodeError as e:
        logger.error(f"❌ Erreur parsing JSON THEATERS: {e}")
        sys.exit(1)

    if not theaters_config:
        logger.error("❌ Aucun cinéma configuré. Vérifiez le secret THEATERS dans GitHub.")
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

    # Nettoyer les vieilles dates en base
    if not args.force:
        clean_old_dates()

    # Charger les données existantes depuis Supabase
    if args.force:
        existing_data = {"generated_at": None, "days": []}
        logger.info("🔄 Mode force activé - rescraping complet")
        # Supprimer toutes les données existantes
        try:
            get_supabase().table("showtimes").delete().neq("date", "1970-01-01").execute()
            logger.info("🗑️ Toutes les données Supabase supprimées")
        except Exception as e:
            logger.warning(f"⚠️ Erreur suppression Supabase: {e}")
    else:
        existing_data = load_existing_data()

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

                    keys_to_delete = [k for k in tmdb_cache if k.split("|")[0] in titles_to_clear]
                    for key in keys_to_delete:
                        del tmdb_cache[key]
                        logger.info(f"      🧹 Cache supprimé pour: {key.split('|')[0]}")

                    with open(TMDB_CACHE_FILE, "w", encoding="utf-8") as f:
                        json.dump(tmdb_cache, f, ensure_ascii=False, indent=2)
                except Exception as e:
                    logger.warning(f"   ⚠️ Erreur nettoyage cache: {e}")

            dates_to_scrape.update(dates_with_missing)

    dates_to_scrape = sorted(list(dates_to_scrape))

    if not dates_to_scrape:
        logger.info("✅ Toutes les données sont à jour, aucun scraping nécessaire.")
        logger.info("   Utilisez --force pour forcer le rescraping")
        return

    logger.info(f"📅 {len(dates_to_scrape)} jour(s) à scraper (données existantes conservées)")

    today = datetime.now(PARIS_TZ).date()
    total_movies = 0

    for date_str in dates_to_scrape:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        day_offset = (date.date() - today).days

        # Pour les jours au-delà de la fenêtre de base, scraper uniquement les cinémas étendus
        if day_offset >= DAYS_TO_SCRAPE:
            theaters_for_date = [t for t in theaters if t.name in EXTENDED_THEATERS]
            nb = len(theaters_for_date)
            logger.info(f"📅 Récupération des séances pour {date_str} (cinémas étendus uniquement : {nb})...")
        else:
            theaters_for_date = theaters
            logger.info(f"📅 Récupération des séances pour {date_str}...")

        try:
            movies = get_showtimes(theaters_for_date, date)
            save_day(date_str, movies)
            total_movies += len(movies)

            logger.info(f"   ✅ {len(movies)} film(s) récupéré(s) et sauvegardés dans Supabase")

            time.sleep(1)

        except Exception as e:
            logger.error(f"❌ Erreur pour {date_str}: {e}")
            logger.warning("💾 Progrès jusqu'ici sauvegardé dans Supabase. Relancez le script pour continuer.")
            raise

    logger.info(
        f"✅ Scraping terminé. {total_movies} entrées sur {len(dates_to_scrape)} jours sauvegardés dans Supabase."
    )


if __name__ == "__main__":
    main()
