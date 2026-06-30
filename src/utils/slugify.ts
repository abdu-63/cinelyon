// src/utils/slugify.ts
// Portage exact de app.py::slugify() — identique à cinelyon-app

export function slugify(text: string, year?: string): string {
  let slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (year && year !== 'inconnue') {
    slug = `${slug}-${year}`;
  }

  return slug;
}
