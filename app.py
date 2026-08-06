import json
import os
import re
import unicodedata
from datetime import datetime, timedelta
from urllib.parse import quote
from zoneinfo import ZoneInfo

import dotenv
import requests
from flask import Flask, abort, make_response, render_template, request
from flask_compress import Compress
from flask_talisman import Talisman
from supabase import Client, create_client

dotenv.load_dotenv(".env")

WEBSITE_TITLE = os.environ.get("WEBSITE_TITLE", "CinéLyon")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_MODEL = os.environ.get("NVIDIA_MODEL", "nvidia/nemotron-3-super-120b-a12b")
NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


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
        return {"showtimes": [], "num_days": 0, "slug_index": {}}

    showtimes = [row["movies"] for row in rows]
    num_days = len(showtimes)

    print(f"✅ {num_days} jour(s) chargés depuis Supabase")

    # Pré-construire l'index slug → [(day_index, film)] pour film_detail() en O(1)
    slug_index = {}
    for day_index, day_movies in enumerate(showtimes):
        for film in day_movies:
            film_slug = slugify(film["title"], film.get("release_year", ""))
            if film_slug not in slug_index:
                slug_index[film_slug] = []
            slug_index[film_slug].append((day_index, film))

    _showtimes_data = {"showtimes": showtimes, "num_days": num_days, "slug_index": slug_index}
    _last_load_time = now

    return _showtimes_data


def build_chatbot_context(max_movies: int = 60):
    """Construit un contexte compact des films/cinémas pour le chatbot."""
    data = load_movies_data()
    films_by_title = {}
    cinemas = set()

    for day_movies in data.get("showtimes", []):
        for film in day_movies:
            title = film.get("title")
            if not title:
                continue

            if title not in films_by_title:
                films_by_title[title] = {
                    "title": title,
                    "release_year": film.get("release_year") or "",
                    "genres": film.get("genres") or "",
                    "director": film.get("director") or "Inconnu",
                    "want_to_see": film.get("wantToSee") or 0,
                }

            for cinema_name in (film.get("seances") or {}).keys():
                cinemas.add(cinema_name)

    films_sorted = sorted(
        films_by_title.values(),
        key=lambda x: (x["want_to_see"], x["title"]),
        reverse=True,
    )

    selected = films_sorted[:max_movies]
    catalog = [f"- {f['title']} ({f['release_year']}) · {f['genres']} · réal. {f['director']}" for f in selected]

    return {
        "catalog_text": "\n".join(catalog) if catalog else "Aucun film disponible actuellement.",
        "cinemas_text": ", ".join(sorted(cinemas)) if cinemas else "Aucun cinéma disponible.",
        "total_movies": len(films_by_title),
    }


def local_chatbot_reply(user_message: str, context: dict) -> str:
    """Fallback local si la clé GROQ n'est pas définie ou si l'API échoue."""
    message = (user_message or "").lower()

    if any(keyword in message for keyword in ["cinéma", "cinemas", "salle", "salles", "ugc", "pathé", "pathe"]):
        return (
            "Voici les cinémas actuellement présents sur CinéLyon :\n"
            f"{context['cinemas_text']}\n\n"
            "👉 Pour les horaires exacts et la réservation, ouvre cinelyon.fr."
        )

    if any(keyword in message for keyword in ["affiche", "films", "film", "recommande", "conseil"]):
        films = context["catalog_text"].split("\n")[:12]
        films_text = "\n".join(films)
        return (
            f"Voici une sélection de films à l'affiche ({context['total_movies']} au total) :\n"
            f"{films_text}\n\n"
            "👉 Pour filtrer par genre/cinéma et réserver, va sur cinelyon.fr."
        )

    return (
        "Je peux t'aider sur les films à l'affiche, les cinémas lyonnais et te recommander une séance. "
        "Pose-moi une question comme “Quoi voir ce soir ?” ou “Quels films d'action sont disponibles ?”.\n\n"
        "👉 Pour les horaires exacts et la réservation, ouvre cinelyon.fr."
    )


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
    elif response.content_type and "text/html" in response.content_type:
        if response.status_code == 200:
            # CDN (s-maxage) : cache 1h côté Vercel Edge pour éviter les cold starts.
            # Le CDN est automatiquement purgé à chaque déploiement Vercel.
            # Browser (max-age=0) : le navigateur revalide toujours avec le CDN.
            response.headers["Cache-Control"] = (
                "public, s-maxage=3600, stale-while-revalidate=86400, max-age=0, must-revalidate"
            )
        else:
            # Ne pas cacher les erreurs (404, 500, etc.)
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
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
    """Optimise l'URL d'une affiche via le CDN d'origine ou wsrv.nl en repli."""
    if not url or url.startswith("/static"):
        return url

    # Si c'est une image TMDB, on utilise directement les tailles optimisées du CDN de TMDB
    if "image.tmdb.org" in url:
        size = "w185" if width <= 185 else ("w342" if width <= 342 else "w500")
        return re.sub(r"/t/p/[^/]+/", f"/t/p/{size}/", url)

    # Si c'est une image Allociné (Akamai CDN), on la charge en direct car le CDN est très rapide
    if "acsta.net" in url:
        return url

    # Pour d'autres images externes (si existantes), on utilise wsrv.nl
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


_MONTHS = {
    1: "janv",
    2: "févr",
    3: "mars",
    4: "avr",
    5: "mai",
    6: "juin",
    7: "juil",
    8: "août",
    9: "sept",
    10: "oct",
    11: "nov",
    12: "déc",
}
_DAYS = {0: "Lun", 1: "Mar", 2: "Mer", 3: "Jeu", 4: "Ven", 5: "Sam", 6: "Dim"}


def translateMonth(num: int):
    return _MONTHS.get(num, "???")


def translateDay(weekday: int):
    return _DAYS.get(weekday, "???")


@app.route("/force-update")
def force_update():
    """
    Page de secours accessible depuis l'iPhone pour forcer la mise à jour du cache.
    Ouvrir cinelyon.fr/force-update dans Safari pour vider le cache du SW et revenir
    sur la page d'accueil avec les assets frais.
    """
    html = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour forcée — CinéLyon</title>
    <style>
        body { font-family: -apple-system, sans-serif; text-align: center;
               padding: 40px 20px; background: #121212; color: #e0e0e0; }
        h1 { color: #626afc; }
        p { color: #aaa; margin: 10px 0; }
        .spinner { font-size: 40px; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="spinner">🔄</div>
    <h1>Mise à jour en cours…</h1>
    <p>Suppression du cache du Service Worker…</p>
    <p id="status">Initialisation…</p>
    <script>
        const status = document.getElementById('status');
        async function forceUpdate() {
            try {
                // 1. Supprimer tous les caches
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => {
                    status.textContent = 'Suppression du cache : ' + name;
                    return caches.delete(name);
                }));

                // 2. Désinscrire tous les Service Workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => {
                        status.textContent = 'Désinscription du SW…';
                        return reg.unregister();
                    }));
                }

                status.textContent = '✅ Cache vidé ! Redirection…';
                setTimeout(() => { window.location.replace('/?v=' + Date.now()); }, 1500);
            } catch(e) {
                status.textContent = 'Erreur : ' + e.message + '. Redirection…';
                setTimeout(() => { window.location.replace('/?v=' + Date.now()); }, 2000);
            }
        }
        forceUpdate();
    </script>
</body>
</html>"""
    response = make_response(html, 200)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Type"] = "text/html; charset=utf-8"
    return response


@app.route("/health")
def health():
    return "OK"


@app.route("/reload")
def reload_data():
    """Endpoint pour forcer le rechargement des données depuis Supabase."""
    reload_secret = os.environ.get("RELOAD_SECRET", "")
    if not reload_secret:
        return "Endpoint disabled", 403
    secret = request.args.get("secret", "")
    if secret != reload_secret:
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

    # Utiliser le slug_index pré-calculé pour éviter de recalculer les slugs
    data = load_movies_data()
    slug_index = data.get("slug_index", {})
    for film_slug in slug_index:
        content += f"  <url>\n    <loc>{base_url}/film/{film_slug}</loc>\n"
        content += "    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n"

    content += "</urlset>"
    response = make_response(content)
    response.headers["Content-Type"] = "application/xml"
    response.headers["Cache-Control"] = "public, s-maxage=3600, stale-while-revalidate=86400"
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
                    "affiche": optimize_poster_url(film["affiche"], width=200),
                    "director": film["director"],
                    "wantToSee": film["wantToSee"],
                    "url": film["url"],
                    "allocine_url": film.get("allocine_url", ""),
                    "trailer_url": film.get("trailer_url"),
                    "watch_providers": film.get("watch_providers", []),
                    "tmdb_score": film.get("tmdb_score"),
                    "rt_score": film.get("rt_score"),
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

    # Lookup direct par slug via l'index pré-calculé (O(1) au lieu de O(n×m))
    slug_index = data.get("slug_index", {})
    film_entries = slug_index.get(slug)

    if not film_entries:
        abort(404)

    film_data = None
    seances_by_day = {}

    for day_index, film in film_entries:
        if day_index >= len(dates):
            continue
        day_label = f"{dates[day_index]['jour']} {dates[day_index]['chiffre']} {dates[day_index]['mois']}"

        if film_data is None:
            film_data = {
                "title": film["title"],
                "release_year": film["release_year"],
                "duree": film["duree"],
                "rating": film["rating"],
                "genres": film["genres"],
                "realisateur": film["realisateur"],
                "synopsis": film["synopsis"],
                "affiche": optimize_poster_url(film["affiche"], width=300),
                "director": film["director"],
                "wantToSee": film["wantToSee"],
                "url": film["url"],
                "allocine_url": film.get("allocine_url", ""),
                "trailer_url": film.get("trailer_url"),
                "watch_providers": film.get("watch_providers", []),
                "tmdb_score": film.get("tmdb_score"),
                "rt_score": film.get("rt_score"),
                "slug": slug,
            }

        if day_label not in seances_by_day:
            seances_by_day[day_label] = {}

        for cinema, seances in sorted(film["seances"].items()):
            if cinema not in seances_by_day[day_label]:
                seances_by_day[day_label][cinema] = []
            seances_by_day[day_label][cinema].extend(seances)
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
        "Cinéma Saint-Denis",
        "Cinéma Les Amphis",
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
            return "Cinéma Les Amphis"
        if "gerard-philipe" in name or "gérard-philipe" in name:
            return "Gérard-Philipe"
        if "meyzieu" in name:
            return "Ciné Meyzieu"
        if "toboggan" in name:
            return "Ciné Toboggan"
        if "saint-denis" in name:
            return "Cinéma Saint-Denis"
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


@app.route("/suggestions")
def suggestions():
    return render_template("suggestions.html", website_title=WEBSITE_TITLE)


@app.route("/api/chat", methods=["POST"])
def chatbot_reply():
    payload = request.get_json(silent=True) or {}
    user_message = (payload.get("message") or "").strip()

    if not user_message:
        return {"reply": "Écris-moi un message et je te réponds 🍿"}, 400

    if len(user_message) > 1200:
        return {"reply": "Ton message est trop long. Essaie avec une question plus courte 🙂"}, 400

    context = build_chatbot_context()

    if not NVIDIA_API_KEY:
        return {"reply": local_chatbot_reply(user_message, context)}

    system_prompt = (
        "Tu es CinéBot, l'assistant de cinelyon.fr. "
        "Tu réponds uniquement sur les films, les séances et les cinémas de Lyon et alentours. "
        "Tu restes précis, bienveillant et bref (3 à 6 phrases). "
        "Si l'utilisateur sort du sujet, indique que tu es spécialisé cinéma lyonnais. "
        "N'invente pas d'horaire précis si tu n'en as pas. "
        "Termine toujours par inviter à vérifier/réserver sur cinelyon.fr.\n\n"
        f"Films à l'affiche (catalogue partiel, {context['total_movies']} au total) :\n{context['catalog_text']}\n\n"
        f"Cinémas disponibles : {context['cinemas_text']}"
    )

    try:
        response = requests.post(
            NVIDIA_CHAT_URL,
            headers={
                "Authorization": f"Bearer {NVIDIA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": NVIDIA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.7,
                "top_p": 0.95,
                "max_tokens": 1024,
                "extra_body": {
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 2048,
                },
            },
            timeout=25,
        )
        data = response.json()
        if response.status_code >= 400:
            raise RuntimeError(data.get("error", {}).get("message", f"NVIDIA API error {response.status_code}"))

        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not reply:
            raise RuntimeError("Réponse vide de NVIDIA API")

        return {"reply": reply}
    except Exception as e:
        print(f"⚠️ Erreur chatbot NVIDIA Nemotron: {e}")
        return {"reply": local_chatbot_reply(user_message, context)}



@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html", website_title=WEBSITE_TITLE), 404


if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode)
