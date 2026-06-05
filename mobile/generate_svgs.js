const fs = require('fs');
const baseHtml = fs.readFileSync('../templates/base.html', 'utf8');
const filmHtml = fs.readFileSync('../templates/film.html', 'utf8');

// Extraction is complex with regex, I'll just write the extracted paths since I have them from the view_file logs.
