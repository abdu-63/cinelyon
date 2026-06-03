// src/utils/slugify.ts
// Portage exact de app.py::slugify() et modules/Classes.py::_slugify()

/**
 * Portage de app.py::slugify(text, year)
 * Convertit un titre de film en slug URL-friendly
 * ex: "L'Opéra de quat'sous" (2024) → "l-opera-de-quat-sous-2024"
 */
export function slugify(text: string, year?: string): string {
  // Normalisation Unicode NFD → supprime les accents
  let slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // supprime les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');         // trim tirets en début/fin

  if (year && year !== 'inconnue') {
    slug = `${slug}-${year}`;
  }

  return slug;
}
