import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from app import load_movies_data, slugify

data = load_movies_data()
showtimes = data["showtimes"]
num_days = data["num_days"]

for day_index in range(num_days):
    for film in showtimes[day_index]:
        film_slug = slugify(film["title"], film.get("release_year", ""))
        if film_slug == "michael-2026":
            for cinema, seances in film["seances"].items():
                print(f"Before sort: {cinema}")
                for s in seances: print(s)
                
                seances.sort(key=lambda x: x["time"])
                
                print(f"After sort: {cinema}")
                for s in seances: print(s)
            break
    break
