import json
import os
from datetime import datetime, timedelta

import dotenv
from flask import Flask, make_response, render_template, request
from flask_compress import Compress
from flask_talisman import Talisman

dotenv.load_dotenv(".env")
dotenv.load_dotenv(".env.sample")

WEBSITE_TITLE = os.environ.get("WEBSITE_TITLE", "CinéLyon")
MAPBOX_TOKEN = os.environ.get("MAPBOX_TOKEN", "")

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
_movies_file_mtime = None


def load_movies_data(force_reload=False):
    """Charge les données des films depuis movies.json avec cache intelligent."""
    global _showtimes_data, _last_load_time, _movies_file_mtime

    movies_file = os.path.join(os.path.dirname(__file__), "movies.json")

    if not os.path.exists(movies_file):
        print("⚠️ movies.json non trouvé, retour de données vides")
        return {"showtimes": [], "num_days": 0}

    current_mtime = os.path.getmtime(movies_file)

    if not force_reload and _showtimes_data is not None:
        if _movies_file_mtime == current_mtime:
            return _showtimes_data

    with open(movies_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"✅ Données chargées depuis movies.json (généré le {data.get('generated_at', 'inconnu')})")

    showtimes = []
    for day in data.get("days", []):
        showtimes.append(day.get("movies", []))

    num_days = len(showtimes)

    _showtimes_data = {"showtimes": showtimes, "num_days": num_days}
    _last_load_time = datetime.now()
    _movies_file_mtime = current_mtime

    print(f"📊 {num_days} jour(s) de données disponibles")

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
    "script-src": ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "blob:"],
    "style-src": ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https://*.allocine.fr", "https://*.acsta.net", "https://wsrv.nl", "https://*.mapbox.com"],
    "connect-src": ["'self'", "https://api.mapbox.com", "https://events.mapbox.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "worker-src": ["'self'", "blob:"],
}
Talisman(app, content_security_policy=csp, force_https=False)


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
    """Endpoint pour forcer le rechargement des données."""
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
        day = datetime.today() + timedelta(i)
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
    days_to_show = [delta] if delta is not None else range(min(7, num_days))

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
                    "seances_by_day": {},
                }

            if day_label not in all_films[title]["seances_by_day"]:
                all_films[title]["seances_by_day"][day_label] = {}

            for cinema, seances in film["seances"].items():
                if cinema not in all_films[title]["seances_by_day"][day_label]:
                    all_films[title]["seances_by_day"][day_label][cinema] = []
                all_films[title]["seances_by_day"][day_label][cinema].extend(seances)

    films_list = sorted(all_films.values(), key=lambda x: x["wantToSee"], reverse=True)

    all_genres = set()
    all_directors = set()
    all_cinemas = set()

    for film in films_list:
        if film["genres"]:
            for genre in film["genres"].split(", "):
                if genre.strip():
                    all_genres.add(genre.strip())
        if film["director"] and film["director"] != "Inconnu":
            all_directors.add(film["director"])
        for day_seances in film["seances_by_day"].values():
            for cinema in day_seances.keys():
                all_cinemas.add(cinema)

    return render_template(
        "index.html",
        page_actuelle="home",
        films=films_list,
        dates=dates,
        show_all=(delta is None),
        theater_locations=theater_locations,
        website_title=WEBSITE_TITLE,
        mapbox_token=MAPBOX_TOKEN,
        all_genres=sorted(all_genres),
        all_directors=sorted(all_directors),
        all_cinemas=sorted(all_cinemas),
    )

if __name__ == "__main__":
    app.run(debug=True)

# pour le débug sur mobile
"""if __name__ == '__main__':
    # host='0.0.0.0' permet l'accès depuis d'autres appareils
    app.run(host='0.0.0.0', port=5001)"""