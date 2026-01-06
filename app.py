import dotenv
import json
import os
from flask import Flask, render_template, request
from datetime import datetime, timedelta

# On charge les variables d'environnement...
dotenv.load_dotenv(".env")
# et celles par défaut pour avoir la liste des cinémas
dotenv.load_dotenv(".env.sample")

WEBSITE_TITLE = os.environ.get("WEBSITE_TITLE", "CinéLyon")
MAPBOX_TOKEN = os.environ.get("MAPBOX_TOKEN", "")

# Charger les emplacements des cinémas pour la carte
theaters_json = json.loads(os.environ.get("THEATERS", "[]"))
theater_locations = []
for theater in theaters_json:
    theater_locations.append({
        "coordinates": [theater["longitude"], theater["latitude"]],
        "description": theater["name"],
    })


def load_movies_data():
    """Charge les données des films depuis movies.json"""
    movies_file = os.path.join(os.path.dirname(__file__), "movies.json")
    
    if not os.path.exists(movies_file):
        print("⚠️ movies.json non trouvé, retour de données vides")
        return [[] for _ in range(7)]
    
    with open(movies_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"✅ Données chargées depuis movies.json (généré le {data.get('generated_at', 'inconnu')})")
    
    # Extraire les films pour chaque jour
    showtimes = []
    for day in data.get("days", []):
        showtimes.append(day.get("movies", []))
    
    # Compléter avec des listes vides si moins de 7 jours
    while len(showtimes) < 7:
        showtimes.append([])
    
    return showtimes


# Charger les données depuis movies.json (pas de scraping)
showtimes = load_movies_data()

app = Flask(__name__)

def translateMonth(num: int):
    match num:
        case 1: return "janv"
        case 2: return "févr"
        case 3: return "mars"
        case 4: return "avr"
        case 5: return "mai"
        case 6: return "juin"
        case 7: return "juil"
        case 8: return "août"
        case 9: return "sept"
        case 10: return "oct"
        case 11: return "nov"
        case 12: return "déc"
        case _: return "???"

def translateDay(weekday: int):
    match weekday:
        case 0: return "lun"
        case 1: return "mar"
        case 2: return "mer"
        case 3: return "jeu"
        case 4: return "ven"
        case 5: return "sam"
        case 6: return "dim"
        case _: return "???"

@app.route('/health')
def health():
    return "OK"

@app.route('/')
def home():
    delta = request.args.get("delta", default=None, type=int)

    # Si un jour spécifique est demandé, limiter à ce jour
    if delta is not None:
        if delta > 6: delta = 6
        if delta < 0: delta = 0

    dates = []
    for i in range(0, 7):
        day = datetime.today() + timedelta(i)
        dates.append({
            "jour": translateDay(day.weekday()),
            "chiffre": day.day,
            "mois": translateMonth(day.month),
            "choisi": delta == i,  # Sélectionné uniquement si delta correspond
            "index": i,
            "full_date": day.strftime("%d/%m")
        })

    # Regrouper tous les films sans doublons
    all_films = {}
    days_to_show = [delta] if delta is not None else range(7)
    
    for day_index in days_to_show:
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
                    "seances_by_day": {}
                }
            
            # Ajouter les séances pour ce jour
            if day_label not in all_films[title]["seances_by_day"]:
                all_films[title]["seances_by_day"][day_label] = {}
            
            for cinema, seances in film["seances"].items():
                if cinema not in all_films[title]["seances_by_day"][day_label]:
                    all_films[title]["seances_by_day"][day_label][cinema] = []
                all_films[title]["seances_by_day"][day_label][cinema].extend(seances)
    
    # Trier par popularité
    films_list = sorted(all_films.values(), key=lambda x: x["wantToSee"], reverse=True)

    return render_template(
        'index.html',
        page_actuelle='home',
        films=films_list,
        dates=dates,
        show_all=(delta is None),
        theater_locations=theater_locations,
        website_title=WEBSITE_TITLE,
        mapbox_token=MAPBOX_TOKEN,
    )

# Pour exécution locale uniquement (Vercel importe 'app' directement)
if __name__ == '__main__':
    app.run(debug=True)