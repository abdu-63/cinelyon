"""
bump_pwa_version.py
-------------------
Incrémente en une seule passe toutes les versions de cache du site PWA :
  - CACHE_VERSION dans static/sw.js       (vN -> v(N+1))
  - ?v=X.Y dans les 4 balises asset HTML  (+0.1)
  - "Version X.Y" dans la modale settings (+0.1, suit settings.js)
"""
import re
import sys
from pathlib import Path
from typing import Optional, Tuple

ROOT = Path(__file__).parent.parent  # racine du projet

SW_PATH    = ROOT / "static" / "sw.js"
BASE_HTML  = ROOT / "templates" / "base.html"
INDEX_HTML = ROOT / "templates" / "index.html"
FILM_HTML  = ROOT / "templates" / "film.html"


def bump_minor(version_str: str) -> str:
    """1.6 -> 1.7"""
    major, minor = version_str.split(".")
    return f"{major}.{int(minor) + 1}"


def bump_sw_version() -> Tuple[int, int]:
    """Incrémente vN -> v(N+1) dans sw.js."""
    content = SW_PATH.read_text()
    m = re.search(r"const CACHE_VERSION = 'v(\d+)';", content)
    if not m:
        raise RuntimeError(f"CACHE_VERSION introuvable dans {SW_PATH}")
    old, new = int(m.group(1)), int(m.group(1)) + 1
    SW_PATH.write_text(content.replace(
        f"const CACHE_VERSION = 'v{old}';",
        f"const CACHE_VERSION = 'v{new}';"
    ))
    return old, new


def bump_asset(path: Path, asset_name: str, old_v: str, new_v: str) -> bool:
    """
    Remplace ?v=old_v -> ?v=new_v pour l'asset donné.
    [^?]* enjambe la syntaxe Jinja2 : filename='css/main.css')}}?v=1.7
    """
    content = path.read_text()
    pattern = rf"({re.escape(asset_name)}[^?]*\?v=){re.escape(old_v)}"
    if not re.search(pattern, content):
        print(f"  WARNING: {asset_name}?v={old_v} introuvable dans {path.name}")
        return False
    path.write_text(re.sub(pattern, rf"\g<1>{new_v}", content))
    return True


def bump_version_display(old_v: str, new_v: str) -> None:
    """Met a jour le texte 'Version X.Y' dans la modale Parametres de base.html."""
    content = BASE_HTML.read_text()
    old_text, new_text = f"Version {old_v}", f"Version {new_v}"
    if old_text not in content:
        print(f"  WARNING: '{old_text}' introuvable dans base.html")
        return
    BASE_HTML.write_text(content.replace(old_text, new_text))
    print(f"  OK version affichee : {old_text} -> {new_text}")


def read_asset_version(path: Path, asset_name: str) -> Optional[str]:
    content = path.read_text()
    m = re.search(rf"{re.escape(asset_name)}[^?]*\?v=([\d.]+)", content)
    return m.group(1) if m else None


def main() -> None:
    # 1. sw.js
    old_sw, new_sw = bump_sw_version()
    print(f"OK sw.js CACHE_VERSION : v{old_sw} -> v{new_sw}")

    # 2. Lire les versions courantes
    cur_css      = read_asset_version(BASE_HTML,  "css/main.css")
    cur_settings = read_asset_version(BASE_HTML,  "js/settings.js")
    cur_index    = read_asset_version(INDEX_HTML, "js/index.js")
    cur_film     = read_asset_version(FILM_HTML,  "js/film.js")

    print(f"Versions detectees -> main.css:{cur_css}  settings.js:{cur_settings}  index.js:{cur_index}  film.js:{cur_film}")

    errors = []
    if not cur_css:      errors.append("main.css version non trouvee")
    if not cur_settings: errors.append("settings.js version non trouvee")
    if not cur_index:    errors.append("index.js version non trouvee")
    if not cur_film:     errors.append("film.js version non trouvee")
    if errors:
        print("\nERREUR(S) :")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    # 3. Incrémenter
    new_css      = bump_minor(cur_css)
    new_settings = bump_minor(cur_settings)
    new_index    = bump_minor(cur_index)
    new_film     = bump_minor(cur_film)

    bump_asset(BASE_HTML,  "css/main.css",   cur_css,      new_css)
    print(f"OK main.css?v      : {cur_css} -> {new_css}")

    bump_asset(BASE_HTML,  "js/settings.js", cur_settings, new_settings)
    bump_version_display(cur_settings, new_settings)
    print(f"OK settings.js?v   : {cur_settings} -> {new_settings}")

    bump_asset(INDEX_HTML, "js/index.js",    cur_index,    new_index)
    print(f"OK index.js?v      : {cur_index} -> {new_index}")

    bump_asset(FILM_HTML,  "js/film.js",     cur_film,     new_film)
    print(f"OK film.js?v       : {cur_film} -> {new_film}")

    print("\nBump PWA version termine avec succes.")


if __name__ == "__main__":
    main()
