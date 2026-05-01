import json
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import dotenv
from flask import Flask, make_response, render_template, request
from flask_compress import Compress
from flask_talisman import Talisman
from supabase import Client, create_client

dotenv.load_dotenv(".env")

WEBSITE_TITLE = os.environ.get("WEBSITE_TITLE", "CinéLyon")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

_supabase_client: Client = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _supabase_client


theaters_json = json.loads(os.environ.get("THEATERS", "[]"))
theater_locations = []
for theater in theaters_json:
    theater_locations.append(
        {
            "coordinates": [theater["longitude"], theater["latitude"]],
            "description": theater["name"],
        }
    )

_showtimes_data = None
_last_load_time = None
_CACHE_TTL_SECONDS = 300  # 5 minutes


def load_movies_data(force_reload=False):
    """Charge les données des films depuis Supabase avec cache TTL de 5 min."""
    global _showtimes_data, _last_load_time

    now = datetime.now()
    cache_valid = (
        not force_reload
        and _showtimes_data is not None
        and _last_load_time is not None
        and (now - _last_load_time).total_seconds() < _CACHE_TTL_SECONDS
    )

    if cache_valid:
        return _showtimes_data

    try:
        today = datetime.now(ZoneInfo("Europe/Paris")).date()
        supabase = get_supabase()
        response = supabase.table("showtimes").select("date, movies").gte("date", str(today)).order("date").execute()
        rows = response.data or []
    except Exception as e:
        print(f"⚠️ Erreur lecture Supabase: {e}")
        if _showtimes_data is not None:
            print("   Utilisation du cache précédent.")
            return _showtimes_data
        return {"showtimes": [], "num_days": 0}

    showtimes = [row["movies"] for row in rows]
    num_days = len(showtimes)

    print(f"✅ {num_days} jour(s) chargés depuis Supabase")

    _showtimes_data = {"showtimes": showtimes, "num_days": num_days}
    _last_load_time = now

    return _showtimes_data


load_movies_data()

app = Flask(__name__)

Compress(app)
app.config["COMPRESS_MIMETYPES"] = [
    "text/html",
    "text/css",
    "text/xml",
    "application/json",
    "application/javascript",
    "text/javascript",
]
app.config["COMPRESS_LEVEL"] = 6
app.config["COMPRESS_MIN_SIZE"] = 500

csp = {
    "default-src": "'self'",
    "script-src": ["'self'", "'unsafe-inline'", "blob:"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://*.allocine.fr",
        "https://*.acsta.net",
        "https://wsrv.nl",
        "https://image.tmdb.org",
    ],
    "connect-src": ["'self'", "https://*.supabase.co"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com"],
}
Talisman(app, content_security_policy=csp, force_https=os.environ.get("FORCE_HTTPS", "true").lower() == "true")


@app.after_request
def add_cache_headers(response):
    """Ajoute des headers de cache pour les fichiers statiques."""
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=604800"
    return response


def optimize_poster_url(url: str, width: int = 200) -> str:
    """Optimise l'URL d'une affiche via le proxy wsrv.nl."""
    if not url or url.startswith("/static"):
        return url
    from urllib.parse import quote

    return f"https://wsrv.nl/?url={quote(url)}&w={width}&q=80&output=webp"


def translateMonth(num: int):
    match num:
        case 1:
            return "janv"
        case 2:
            return "févr"
        case 3:
            return "mars"
        case 4:
            return "avr"
        case 5:
            return "mai"
        case 6:
            return "juin"
        case 7:
            return "juil"
        case 8:
            return "août"
        case 9:
            return "sept"
        case 10:
            return "oct"
        case 11:
            return "nov"
        case 12:
            return "déc"
        case _:
            return "???"


def translateDay(weekday: int):
    match weekday:
        case 0:
            return "Lun"
        case 1:
            return "Mar"
        case 2:
            return "Mer"
        case 3:
            return "Jeu"
        case 4:
            return "Ven"
        case 5:
            return "Sam"
        case 6:
            return "Dim"
        case _:
            return "???"


@app.route("/health")
def health():
    return "OK"


@app.route("/reload")
def reload_data():
    """Endpoint pour forcer le rechargement des données depuis Supabase."""
    secret = request.args.get("secret", "")
    reload_secret = os.environ.get("RELOAD_SECRET", "")
    if reload_secret and secret != reload_secret:
        return "Unauthorized", 401
    global _last_load_time
    _last_load_time = None  # Invalide le cache
    data = load_movies_data(force_reload=True)
    return f"Données rechargées: {data['num_days']} jours"


@app.route("/robots.txt")
def robots_txt():
    content = "User-agent: *\nDisallow:\nSitemap: /sitemap.xml"
    response = make_response(content)
    response.headers["Content-Type"] = "text/plain"
    return response


@app.route("/sitemap.xml")
def sitemap_xml():
    """Génère un sitemap XML dynamique."""
    content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    content += f"  <url>\n    <loc>{request.url_root[:-1]}</loc>\n"
    content += "    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n"
    content += "</urlset>"
    response = make_response(content)
    response.headers["Content-Type"] = "application/xml"
    return response


@app.route("/")
def home():
    data = load_movies_data()
    showtimes = data["showtimes"]
    num_days = data["num_days"]

    delta = request.args.get("delta", default=None, type=int)
    max_delta = num_days - 1 if num_days > 0 else 0

    if delta is not None:
        if delta > max_delta:
            delta = max_delta
        if delta < 0:
            delta = 0

    dates = []
    for i in range(num_days):
        day = datetime.now(ZoneInfo("Europe/Paris")) + timedelta(i)
        dates.append(
            {
                "jour": translateDay(day.weekday()),
                "chiffre": day.day,
                "mois": translateMonth(day.month),
                "choisi": delta == i,
                "index": i,
                "full_date": day.strftime("%d/%m"),
            }
        )

    all_films = {}
    days_to_show = [delta] if delta is not None else range(num_days)

    for day_index in days_to_show:
        if day_index >= len(showtimes):
            continue
        day_label = f"{dates[day_index]['jour']} {dates[day_index]['chiffre']} {dates[day_index]['mois']}"
        for film in showtimes[day_index]:
            title = film["title"]
            if title not in all_films:
                all_films[title] = {
                    "title": film["title"],
                    "release_year": film["release_year"],
                    "duree": film["duree"],
                    "rating": film["rating"],
                    "genres": film["genres"],
                    "realisateur": film["realisateur"],
                    "synopsis": film["synopsis"],
                    "affiche": film["affiche"],
                    "director": film["director"],
                    "wantToSee": film["wantToSee"],
                    "url": film["url"],
                    "allocine_url": film.get("allocine_url", ""),
                    "trailer_url": film.get("trailer_url"),
                    "seances_by_day": {},
                }

            if day_label not in all_films[title]["seances_by_day"]:
                all_films[title]["seances_by_day"][day_label] = {}

            for cinema, seances in sorted(film["seances"].items()):
                if cinema not in all_films[title]["seances_by_day"][day_label]:
                    all_films[title]["seances_by_day"][day_label][cinema] = []
                all_films[title]["seances_by_day"][day_label][cinema].extend(seances)
            # Réordonner le dict du jour par ordre alphabétique des cinémas
            all_films[title]["seances_by_day"][day_label] = dict(
                sorted(all_films[title]["seances_by_day"][day_label].items())
            )

    films_list = sorted(all_films.values(), key=lambda x: x["wantToSee"], reverse=True)

    all_genres = set()
    all_directors = set()
    all_cinemas = set()
    all_formats = set()

    for film in films_list:
        if film["genres"]:
            for genre in film["genres"].split(", "):
                if genre.strip():
                    all_genres.add(genre.strip())
        if film["director"] and film["director"] != "Inconnu":
            all_directors.add(film["director"])

        # Collecter les formats spéciaux du film
        film_formats = set()
        for day_seances in film["seances_by_day"].values():
            for cinema, seances in day_seances.items():
                all_cinemas.add(cinema)
                for seance in seances:
                    fmt = seance.get("format")
                    if fmt:
                        for f in fmt.split(", "):
                            film_formats.add(f.strip())
                            all_formats.add(f.strip())
        film["formats"] = ",".join(film_formats).lower()

    return render_template(
        "index.html",
        page_actuelle="home",
        films=films_list,
        dates=dates,
        show_all=(delta is None),
        theater_locations=theater_locations,
        website_title=WEBSITE_TITLE,
        supabase_url=SUPABASE_URL,
        supabase_anon_key=SUPABASE_ANON_KEY,
        all_genres=sorted(all_genres),
        all_directors=sorted(all_directors),
        all_cinemas=sorted(all_cinemas),
        all_formats=sorted(all_formats),
    )


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html", website_title=WEBSITE_TITLE), 404


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode)

# pour le débug sur mobile
"""if __name__ == '__main__':
    # host='0.0.0.0' permet l'accès depuis d'autres appareils
    app.run(host='0.0.0.0', port=5001)"""
