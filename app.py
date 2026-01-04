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
    delta = request.args.get("delta", default=0, type=int)

    if delta > 6: delta = 6
    if delta < 0: delta = 0

    dates = []

    for i in range(0,7):
        day = datetime.today()+timedelta(i)
        dates.append({
            "jour": translateDay(day.weekday()),
            "chiffre": day.day,
            "mois": translateMonth(day.month),
            "choisi": i==delta,
            "index": i
        })

    return render_template(
        'index.html',
        page_actuelle='home',
        films=showtimes[delta],
        dates=dates,
        theater_locations=theater_locations,
        website_title=WEBSITE_TITLE,
        mapbox_token=MAPBOX_TOKEN,
    )

if __name__ == '__main__':
    app.run()