#!/bin/bash

# Rends-toi dans le dossier scripts/instagram avant d'exécuter ce script
cd "$(dirname "$0")"

SOURCES=(
  "letterboxd_rege"
  "letterboxd_bfi_dir"
  "letterboxd_bfi"
  "letterboxd_anim250"
  "letterboxd_top500"
  "letterboxd_fans250"
  "letterboxd_boxoffice"
  "letterboxd_directors"
  "senscritique_cultes"
  "senscritique_top111"
  "senscritique_top100"
  "senscritique_claques"
  "letterboxd_animation_before_2000s"
  "letterboxd_criterion"
  "letterboxd_love_questioning_films"
  "letterboxd_imdb250"
  "letterboxd_oscars"
  "letterboxd_cannes"
  "letterboxd_horror250"
  "letterboxd_top_250_animated"
  "letterboxd_cosmic_horror"
  "letterboxd_below_100_minutes"
  "letterboxd_romantic_comedy_250"
  "letterboxd_science_fiction_250"
  "letterboxd_top100_eurekaka"
  "letterboxd_top100_zrkv"
  "letterboxd_visually_stunning"
  "letterboxd_atmospheric_horror"
  "letterboxd_visually_insane"
  "letterboxd_director"
  "letterboxd_classics"
  "letterboxd_horror_must_watch"
  "letterboxd_french_classic"
  "letterboxd_visually_stunning_movies"
  "letterboxd_horror_film_recommendation"
  "letterboxd_most_terrifying_horror_films"
)

echo "Démarrage du scraping massif des listes..."

for source in "${SOURCES[@]}"; do
  echo "----------------------------------------"
  npx ts-node 00_seed_database.ts --source=$source
done

echo "🎉 Scraping de toutes les listes terminé !"
