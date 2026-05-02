import json
import os
import re
import unicodedata
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import dotenv
from flask import Flask, abort, make_response, render_template, request
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
        # Ne jamais cacher sw.js ou manifest.json pour permettre les mises à jour PWA
        if "sw.js" in request.path or "manifest.json" in request.path:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        else:
            response.headers["Cache-Control"] = "public, max-age=604800"
    return response


@app.url_defaults
def hashed_url_for_static_file(endpoint, values):
    """Bust cache by appending the file's mtime to static URLs."""
    if "static" == endpoint or endpoint.endswith(".static"):
        filename = values.get("filename")
        if filename:
            if "." in endpoint:
                blueprint = endpoint.rsplit(".", 1)[0]
            else:
                blueprint = request.blueprint

            if blueprint:
                static_folder = app.blueprints[blueprint].static_folder
            else:
                static_folder = app.static_folder

            param_name = "v"
            while param_name in values:
                param_name = "_" + param_name
            try:
                values[param_name] = int(os.stat(os.path.join(static_folder, filename)).st_mtime)
            except OSError:
                pass


def optimize_poster_url(url: str, width: int = 200) -> str:
    """Optimise l'URL d'une affiche via le proxy wsrv.nl."""
    if not url or url.startswith("/static"):
        return url
    from urllib.parse import quote

    return f"https://wsrv.nl/?url={quote(url)}&w={width}&q=80&output=webp"


def slugify(text: str, year: str = "") -> str:
    """Convertit un titre de film en slug URL-friendly."""
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("utf-8")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    if year and year != "inconnue":
        text = f"{text}-{year}"
    return text


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
    base_url = request.url_root.rstrip("/")
    content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    content += f"  <url>\n    <loc>{base_url}</loc>\n"
    content += "    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n"

    # Ajouter les pages individuelles des films
    data = load_movies_data()
    seen_slugs = set()
    for day_movies in data["showtimes"]:
        for film in day_movies:
            film_slug = slugify(film["title"], film.get("release_year", ""))
            if film_slug not in seen_slugs:
                seen_slugs.add(film_slug)
                content += f"  <url>\n    <loc>{base_url}/film/{film_slug}</loc>\n"
                content += "    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n"

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
                    "slug": slugify(film["title"], film.get("release_year", "")),
                    "seances_by_day": {},
                }

            if day_label not in all_films[title]["seances_by_day"]:
                all_films[title]["seances_by_day"][day_label] = {}

            for cinema, seances in sorted(film["seances"].items()):
                if cinema not in all_films[title]["seances_by_day"][day_label]:
                    all_films[title]["seances_by_day"][day_label][cinema] = []
                all_films[title]["seances_by_day"][day_label][cinema].extend(seances)
                # Sort seances by time
                all_films[title]["seances_by_day"][day_label][cinema].sort(key=lambda x: x["time"])
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


@app.route("/film/<slug>")
def film_detail(slug):
    """Page de détail d'un film."""
    data = load_movies_data()
    showtimes = data["showtimes"]
    num_days = data["num_days"]

    # Construire la liste des dates
    dates = []
    for i in range(num_days):
        day = datetime.now(ZoneInfo("Europe/Paris")) + timedelta(i)
        dates.append(
            {
                "jour": translateDay(day.weekday()),
                "chiffre": day.day,
                "mois": translateMonth(day.month),
                "index": i,
                "full_date": day.strftime("%d/%m"),
            }
        )

    # Trouver le film correspondant au slug
    film_data = None
    seances_by_day = {}

    for day_index in range(num_days):
        if day_index >= len(showtimes):
            continue
        day_label = f"{dates[day_index]['jour']} {dates[day_index]['chiffre']} {dates[day_index]['mois']}"
        for film in showtimes[day_index]:
            film_slug = slugify(film["title"], film.get("release_year", ""))
            if film_slug == slug:
                if film_data is None:
                    film_data = {
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
                        "slug": film_slug,
                    }

                if day_label not in seances_by_day:
                    seances_by_day[day_label] = {}

                for cinema, seances in sorted(film["seances"].items()):
                    if cinema not in seances_by_day[day_label]:
                        seances_by_day[day_label][cinema] = []
                    seances_by_day[day_label][cinema].extend(seances)
                    # Sort seances by time
                    seances_by_day[day_label][cinema].sort(key=lambda x: x["time"])
                seances_by_day[day_label] = dict(sorted(seances_by_day[day_label].items()))

    if film_data is None:
        abort(404)

    film_data["seances_by_day"] = seances_by_day

    # Collecter les formats
    film_formats = set()
    for day_seances in seances_by_day.values():
        for cinema, seances in day_seances.items():
            for seance in seances:
                fmt = seance.get("format")
                if fmt:
                    for f in fmt.split(", "):
                        film_formats.add(f.strip())
    film_data["formats"] = ",".join(film_formats).lower()

    # Convertir trailer_url en embed URL
    trailer_embed = None
    if film_data.get("trailer_url"):
        import re

        url = film_data["trailer_url"]
        # Robust regex for various YouTube URL formats
        yt_regex = (
            r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)"
            r"|youtu\.be\/)([^\"&?\/\s]{11})"
        )
        match = re.search(yt_regex, url)
        if match:
            video_id = match.group(1)
            trailer_embed = f"https://www.youtube.com/embed/{video_id}"
        elif "youtube.com/embed/" in url or "youtube-nocookie.com/embed/" in url:
            trailer_embed = url
    film_data["trailer_embed"] = trailer_embed

    # Brand order for display
    BRAND_ORDER = [
        "Pathé",
        "UGC",
        "Lumière",
        "Institut Lumière",
        "Comoedia",
        "CGR",
        "Ciné Meyzieu",
        "Ciné Toboggan",
        "Ciné Saint-Denis",
        "Les Amphis",
        "Gérard-Philipe",
        "Autre",
    ]

    def get_brand(cinema_name):
        """Extract brand from cinema name."""
        name = cinema_name.lower()
        if name.startswith("pathé") or name.startswith("pathe"):
            return "Pathé"
        if name.startswith("ugc"):
            return "UGC"
        if "lumière" in name and "institut" not in name:
            return "Lumière"
        if "institut lumière" in name:
            return "Institut Lumière"
        if name.startswith("cgr"):
            return "CGR"
        if "comoedia" in name:
            return "Comoedia"
        if "amphis" in name:
            return "Les Amphis"
        if "gerard-philipe" in name or "gérard-philipe" in name:
            return "Gérard-Philipe"
        if "meyzieu" in name:
            return "Ciné Meyzieu"
        if "toboggan" in name:
            return "Ciné Toboggan"
        if "saint-denis" in name:
            return "Ciné Saint-Denis"
        if name.startswith("ciné") or name.startswith("cine"):
            return "Ciné"
        return "Autre"

    # Group cinemas by brand for each day
    seances_by_day_grouped = {}
    for day_label, cinemas in seances_by_day.items():
        brands = {}
        for cinema_name, seances in cinemas.items():
            brand = get_brand(cinema_name)
            if brand not in brands:
                brands[brand] = {}
            brands[brand][cinema_name] = seances
        # Sort brands by BRAND_ORDER
        seances_by_day_grouped[day_label] = {brand: brands[brand] for brand in BRAND_ORDER if brand in brands}
        # Append any brand not in BRAND_ORDER
        for brand in brands:
            if brand not in seances_by_day_grouped[day_label]:
                seances_by_day_grouped[day_label][brand] = brands[brand]

    film_data["seances_by_day_grouped"] = seances_by_day_grouped

    return render_template(
        "film.html",
        film=film_data,
        theater_locations=theater_locations,
        website_title=WEBSITE_TITLE,
        supabase_url=SUPABASE_URL,
        supabase_anon_key=SUPABASE_ANON_KEY,
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
