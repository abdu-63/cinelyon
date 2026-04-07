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
)

echo "Démarrage du scraping massif des listes..."

for source in "${SOURCES[@]}"; do
  echo "----------------------------------------"
  npx ts-node 00_seed_database.ts --source=$source
done

echo "🎉 Scraping de toutes les listes terminé !"
