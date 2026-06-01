// ── Favorites ──
const FAVORITES_KEY = 'cinelyon_favorites';
function getFavorites() { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch (e) { return []; } }
function saveFavorites(f) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(f)); }
function isFavorite(id) { return getFavorites().includes(id); }

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.favorite-btn');
    if (!btn) return;
    const filmId = btn.dataset.filmId;

    function updateBtn() {
        if (isFavorite(filmId)) { btn.classList.add('active'); btn.title = 'Retirer des favoris'; }
        else { btn.classList.remove('active'); btn.title = 'Ajouter aux favoris'; }
    }
    updateBtn();

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        const favs = getFavorites();
        const idx = favs.indexOf(filmId);
        if (idx === -1) favs.push(filmId); else favs.splice(idx, 1);
        saveFavorites(favs);
        updateBtn();
    });
});

// ── Day tabs ──
document.querySelectorAll('.film-cal-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.film-cal-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.film-day-seances').forEach(d => d.classList.remove('show'));
        this.classList.add('active');
        const target = document.querySelector(`.film-day-seances[data-day="${this.dataset.day}"]`);
        if (target) target.classList.add('show');
    });
});

// ── Cache les séances passées (aujourd'hui uniquement) ──
function hidePastSeances() {
    if (localStorage.getItem('hidePastShowtimes') === 'false') {
        return; // Masquage désactivé
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayBlock = document.querySelector('.film-day-seances[data-day="0"]');
    if (!todayBlock) return;

    const todayBtn = document.querySelector('.film-cal-btn[data-day="0"]');
    if (todayBtn) {
        const dayDate = parseDayLabel(todayBtn.textContent.trim());
        if (dayDate.getDate() !== now.getDate() ||
            dayDate.getMonth() !== now.getMonth() ||
            dayDate.getFullYear() !== now.getFullYear()) {
            return;
        }
    }

    todayBlock.querySelectorAll('.horaire-wrapper').forEach(hw => {
        const timeStr = hw.dataset.time;
        if (!timeStr) return;
        const [h, m] = timeStr.split('h').map(Number);
        const seanceMinutes = h * 60 + (m || 0);
        if (seanceMinutes < currentMinutes) {
            hw.style.display = 'none';
        }
    });

    // Cacher les blocs cinéma sans séances visibles
    todayBlock.querySelectorAll('.film-cinema-block').forEach(block => {
        const visible = block.querySelectorAll('.horaire-wrapper:not([style*="display: none"])');
        if (visible.length === 0) {
            block.style.display = 'none';
        }
    });

    // Cacher les blocs marque sans cinémas visibles
    todayBlock.querySelectorAll('.film-brand-block').forEach(block => {
        const visible = block.querySelectorAll('.film-cinema-block:not([style*="display: none"])');
        if (visible.length === 0) {
            block.style.display = 'none';
        }
    });
}

hidePastSeances();

// ── Cinema URLs ──
const cinemaUrls = {
    "Pathé Carré de Soie": "https://www.pathe.fr/cinemas/cinema-pathe-carre-de-soie",
    "Pathé Bellecour": "https://www.pathe.fr/cinemas/cinema-pathe-bellecour",
    "Pathé Vaise": "https://www.pathe.fr/cinemas/cinema-pathe-vaise",
    "UGC Part-Dieu": "https://www.ugc.fr/cinema-ugc-cine-cite-part-dieu.html",
    "UGC Confluence": "https://www.ugc.fr/cinema-ugc-cine-cite-confluence.html",
    "UGC Internationale": "https://www.ugc.fr/cinema-ugc-cine-cite-internationale-lyon.html",
    "UGC Astoria": "https://www.ugc.fr/cinema-ugc-astoria.html",
    "CGR Brignais": "https://www.cgrcinemas.fr/films-a-l-affiche/",
    "Ciné Meyzieu": "https://cinemeyzieu.fr/",
    "Ciné Toboggan": "https://www.letoboggan.com/cinema/",
    "Cinéma Saint-Denis": "https://www.cinema-saint-denis.fr/",
    "Lumière Bellecour": "https://www.cinemas-lumiere.com/programmation/bellecour.html",
    "Lumière La Fourmi": "https://www.cinemas-lumiere.com/programmation/fourmi.html",
    "Lumière Terreaux": "https://www.cinemas-lumiere.com/programmation/terreaux.html",
    "Institut Lumière": "https://www.institut-lumiere.org/",
    "Cinéma Les Amphis": "https://www.les-amphis.com/",
    "Cinéma Comoedia": "https://www.cinema-comoedia.org/",
    "Cinéma Gerard-Philipe": "https://www.cinema-gerard-philipe.fr/",
    "Cinéma Saint-Denis": "https://www.cinestdenis.fr/",
    "Cinéma Opéra": "https://www.allocine.fr/seance/salle_gen_csalle=P0006.html"
};
document.querySelectorAll('.cinema-link').forEach(link => {
    const name = link.dataset.cinema;
    link.href = cinemaUrls[name] || `https://www.google.com/search?q=${encodeURIComponent(name + ' Lyon')}`;
});

// ── Calendar (reuse from index) ──
const cinemaAddresses = {
    "Pathé Carré de Soie": "2 Rue Jacquard, 69120 Vaulx-en-Velin",
    "Pathé Bellecour": "79 Rue de la République, 69002 Lyon",
    "Pathé Vaise": "43 Rue des Docks, 69009 Lyon",
    "UGC Part-Dieu": "17 Rue Dr Bouchut, 69003 Lyon",
    "UGC Confluence": "112 Cr Charlemagne, 69002 Lyon",
    "UGC Cité Internationale": "80 Quai Charles de Gaulle, 69006 Lyon",
    "UGC Internationale": "80 Quai Charles de Gaulle, 69006 Lyon",
    "UGC Astoria": "31 Cr Vitton, 69006 Lyon",
    "CGR Brignais": "ZI Nord, Les Vallières, 69530 Brignais",
    "Ciné Meyzieu": "27 Rue Louis Saulnier, 69330 Meyzieu",
    "Ciné Toboggan": "14 Av. Jean Macé, 69150 Décines",
    "Cinéma Saint-Denis": "77 Gd Rue de la Croix-Rousse, 69004 Lyon",
    "Lumière Bellecour": "12 Rue de la Barre, 69002 Lyon",
    "Lumière La Fourmi": "68 Rue Pierre Corneille, 69003 Lyon",
    "Lumière Terreaux": "40 Rue du Pdt Édouard Herriot, 69001 Lyon",
    "Institut Lumière": "25 Rue du Premier-Film, 69008 Lyon",
    "Cinéma Comoedia": "13 Av. Berthelot, 69007 Lyon",
    "Cinéma Les Amphis": "12 Rue Pierre Cot, 69120 Vaulx-en-Velin",
    "Cinéma Gerard-Philipe": "12 Av. Jean Cagne, 69200 Vénissieux",
    "Cinéma Opéra": "6 Rue Joseph Serlin, 69001 Lyon"
};

function parseDuration(s) { let h = 0, m = 0; const hm = s.match(/(\d+)\s*h/), mm = s.match(/(\d+)\s*min/); if (hm) h = parseInt(hm[1]); if (mm) m = parseInt(mm[1]); return { hours: h, minutes: m }; }
function parseDayLabel(l) {
    const mMap = { 'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5, 'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11 };
    const p = l.toLowerCase().split(' '); const d = parseInt(p[1]); const mn = mMap[p[2]];
    const t = new Date(); let y = t.getFullYear(); if (mn !== undefined && mn < t.getMonth()) y++;
    return new Date(y, mn !== undefined ? mn : t.getMonth(), d);
}
function fmtICS(d) { const p = n => n.toString().padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`; }
function escICS(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }

const calMenu = document.createElement('div');
calMenu.className = 'calendar-menu';
calMenu.innerHTML = `
    <button class="calendar-menu-option" data-type="apple">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Apple Calendar
    </button>
    <button class="calendar-menu-option" data-type="google">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google Calendar
    </button>`;
document.body.appendChild(calMenu);

const gpsMenu = document.createElement('div');
gpsMenu.className = 'gps-menu';
gpsMenu.innerHTML = `
    <button class="gps-menu-option" data-type="apple">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Apple Maps
    </button>
    <button class="gps-menu-option" data-type="google">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google Maps
    </button>`;
document.body.appendChild(gpsMenu);

let activeBtn = null;
let activeGpsBtn = null;

document.addEventListener('click', e => {
    if (!e.target.closest('.calendar-btn') && !e.target.closest('.calendar-menu')) calMenu.classList.remove('show');
    if (!e.target.closest('.film-gps-btn') && !e.target.closest('.gps-menu')) gpsMenu.classList.remove('show');
});

calMenu.querySelectorAll('.calendar-menu-option').forEach(opt => {
    opt.addEventListener('click', function () {
        if (!activeBtn) return;
        const b = activeBtn, t = this.dataset.type;
        const title = b.dataset.title, year = b.dataset.year, cinema = b.dataset.cinema;
        const duree = b.dataset.duree, letterboxd = b.dataset.letterboxd, time = b.dataset.time;
        const lang = b.dataset.lang, dayLabel = b.dataset.day, ticket = b.dataset.ticket;
        const movieTitle = `${title} (${year}) - ${cinema}`;
        const location = cinemaAddresses[cinema] || `${cinema}, Lyon`;
        const dur = parseDuration(duree);
        const ev = parseDayLabel(dayLabel); const [h, m] = time.split(':').map(Number); ev.setHours(h, m, 0, 0);
        const end = new Date(ev); end.setHours(end.getHours() + dur.hours); end.setMinutes(end.getMinutes() + dur.minutes);
        let desc = `Film: ${title} (${year})\nLangue: ${lang}\nDurée: ${duree}`;
        if (ticket) desc += `\n\nRéserver: ${ticket}`; desc += `\n\nLetterboxd: ${letterboxd}`;

        if (t === 'apple') {
            const uid = `cinelyon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@cinelyon.vercel.app`;
            const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CineLyon//Calendar//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${fmtICS(new Date())}\nDTSTART:${fmtICS(ev)}\nDTEND:${fmtICS(end)}\nSUMMARY:${escICS(movieTitle)}\nLOCATION:${escICS(location)}\nDESCRIPTION:${escICS(desc)}\nURL:${letterboxd}\nEND:VEVENT\nEND:VCALENDAR`;
            const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' }); const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${time.replace(':', 'h')}.ics`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        } else {
            const params = new URLSearchParams({ action: 'TEMPLATE', text: movieTitle, dates: `${fmtICS(ev)}/${fmtICS(end)}`, details: desc, location: location });
            window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
        }
        b.classList.add('added'); setTimeout(() => b.classList.remove('added'), 2000);
        calMenu.classList.remove('show'); activeBtn = null;
    });
});

gpsMenu.querySelectorAll('.gps-menu-option').forEach(opt => {
    opt.addEventListener('click', function () {
        if (!activeGpsBtn) return;
        const b = activeGpsBtn, t = this.dataset.type;
        const cinema = b.dataset.cinema;
        const location = cinemaAddresses[cinema] || `${cinema}, Lyon`;

        if (t === 'apple') {
            window.open(`maps://maps.apple.com/?q=${encodeURIComponent(location)}`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
        }
        gpsMenu.classList.remove('show'); activeGpsBtn = null;
    });
});

document.querySelectorAll('.calendar-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        const r = this.getBoundingClientRect();
        let top = r.bottom + window.scrollY + 5, left = r.left + window.scrollX;
        if (r.left + 180 > window.innerWidth) left = r.right + window.scrollX - 180;
        if (r.bottom + 90 > window.innerHeight) top = r.top + window.scrollY - 95;
        calMenu.style.top = `${top}px`; calMenu.style.left = `${left}px`;
        activeBtn = this; calMenu.classList.add('show');
    });
});

document.querySelectorAll('.film-gps-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        const r = this.getBoundingClientRect();
        let top = r.bottom + window.scrollY + 5, left = r.left + window.scrollX;
        if (r.left + 180 > window.innerWidth) left = r.right + window.scrollX - 180;
        if (r.bottom + 90 > window.innerHeight) top = r.top + window.scrollY - 95;
        gpsMenu.style.top = `${top}px`; gpsMenu.style.left = `${left}px`;
        activeGpsBtn = this; gpsMenu.classList.add('show');
    });
});

// ── Share features ──
document.addEventListener('DOMContentLoaded', () => {
    const shareLinkBtn = document.getElementById('shareLinkBtn');
    const shareImgBtn = document.getElementById('shareImgBtn');
    const shareImgText = document.getElementById('shareImgText');

    if (shareLinkBtn) {
        shareLinkBtn.addEventListener('click', async () => {
            const shareData = {
                title: document.title,
                text: "Découvre ce film sur CinéLyon !",
                url: window.location.href
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                // Fallback si navigator.share n'est pas supporté (ex: HTTP local au lieu de HTTPS)
                navigator.clipboard.writeText(window.location.href);
                const originalText = shareLinkBtn.innerHTML;
                if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                    alert("La feuille de partage native nécessite le HTTPS (elle fonctionnera en production). Lien copié !");
                }
                shareLinkBtn.innerHTML = 'Copié !';
                setTimeout(() => shareLinkBtn.innerHTML = originalText, 2000);
            }
        });
    }

    let preloadedFile = null;
    let preloadPromise = null;  // Shared promise — prevents duplicate fetches

    const getStoryUrl = () => window.location.pathname.endsWith('/') 
        ? window.location.pathname + 'story.png' 
        : window.location.pathname + '/story.png';

    const loadStoryImage = () => {
        if (preloadedFile) return Promise.resolve(preloadedFile);
        if (preloadPromise) return preloadPromise;

        preloadPromise = (async () => {
            try {
                const response = await fetch(getStoryUrl());
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                preloadedFile = new File([blob], 'cinelyon_share.png', { type: 'image/png' });
                return preloadedFile;
            } catch (e) {
                console.warn('Error loading story image:', e);
                preloadPromise = null; // Allow retry on next click
                return null;
            }
        })();

        return preloadPromise;
    };

    // Start preloading immediately in the background (non-blocking)
    loadStoryImage();


    let storyModalOverlay = document.getElementById('storyModalOverlay');
    if (!storyModalOverlay) {
        storyModalOverlay = document.createElement('div');
        storyModalOverlay.id = 'storyModalOverlay';
        storyModalOverlay.className = 'story-modal-overlay';
        storyModalOverlay.innerHTML = `
            <div class="story-modal">
                <button class="story-modal-close" aria-label="Fermer">&times;</button>
                <h3 class="story-modal-title">Partager la Story</h3>
                <div class="story-modal-img-container">
                    <div class="story-modal-spinner"></div>
                    <img class="story-modal-img" alt="Aperçu Story" style="display: none;" />
                </div>
                <p class="story-modal-instructions">
                    Appuyez longuement sur l'image pour <strong>l'enregistrer</strong> ou la <strong>copier</strong>, puis partagez-la sur Instagram.
                </p>
                <div class="story-modal-actions">
                    <a class="story-modal-btn story-modal-btn-download" download="cinelyon_story.png" href="#">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" style="display: inline-block; vertical-align: middle;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Télécharger
                    </a>
                    <button class="story-modal-btn story-modal-btn-close">Fermer</button>
                </div>
            </div>
        `;
        document.body.appendChild(storyModalOverlay);

        const closeBtn = storyModalOverlay.querySelector('.story-modal-close');
        const actionCloseBtn = storyModalOverlay.querySelector('.story-modal-btn-close');
        
        const closeStoryModal = () => {
            storyModalOverlay.classList.remove('show');
        };

        closeBtn.addEventListener('click', closeStoryModal);
        actionCloseBtn.addEventListener('click', closeStoryModal);
        storyModalOverlay.addEventListener('click', (e) => {
            if (e.target === storyModalOverlay) {
                closeStoryModal();
            }
        });
    }

    const showStoryModal = (imageSrcOrBlobUrl) => {
        const img = storyModalOverlay.querySelector('.story-modal-img');
        const spinner = storyModalOverlay.querySelector('.story-modal-spinner');
        const downloadBtn = storyModalOverlay.querySelector('.story-modal-btn-download');
        const container = storyModalOverlay.querySelector('.story-modal-img-container');

        // Reset previous state to avoid stale event handlers and error messages
        img.onload = null;
        img.onerror = null;
        img.src = '';
        img.style.display = 'none';
        spinner.style.display = 'block';
        downloadBtn.href = '#';
        // Remove any previous error messages
        container.querySelectorAll('.story-error-msg').forEach(el => el.remove());

        storyModalOverlay.classList.add('show');

        const displayImage = (src) => {
            img.onload = () => {
                img.style.display = 'block';
                spinner.style.display = 'none';
            };
            img.onerror = () => {
                spinner.style.display = 'none';
                const errMsg = document.createElement('p');
                errMsg.className = 'story-error-msg';
                errMsg.textContent = "Impossible d'afficher l'image. Veuillez réessayer.";
                errMsg.style.cssText = 'color:#ff6b81; font-size:0.9rem; text-align:center; padding:16px;';
                container.appendChild(errMsg);
            };
            img.src = src;
            downloadBtn.href = src;
        };

        if (imageSrcOrBlobUrl) {
            // We already have a blob URL — display immediately
            displayImage(imageSrcOrBlobUrl);
        } else {
            // Use the shared promise to avoid duplicate fetches
            loadStoryImage().then(file => {
                if (!file) {
                    spinner.style.display = 'none';
                    const errMsg = document.createElement('p');
                    errMsg.className = 'story-error-msg';
                    errMsg.textContent = "Impossible de générer l'image de story. Veuillez réessayer.";
                    errMsg.style.cssText = 'color:#ff6b81; font-size:0.9rem; text-align:center; padding:16px;';
                    container.appendChild(errMsg);
                    return;
                }
                const blobUrl = URL.createObjectURL(file);
                displayImage(blobUrl);
            });
        }
    };




    if (shareImgBtn) {
        shareImgBtn.addEventListener('click', () => {
            // CRITICAL for iOS 15: navigator.share() MUST be called synchronously within the
            // click handler — any await before it breaks the user gesture context.
            // Strategy: if already preloaded → share natively; otherwise → open modal.

            if (preloadedFile) {
                // File is ready — attempt native share synchronously
                const shareData = { files: [preloadedFile] };
                if (navigator.canShare && navigator.canShare(shareData)) {
                    navigator.share(shareData)
                        .then(() => { /* shared successfully */ })
                        .catch(err => {
                            if (err.name === 'AbortError') return; // user cancelled
                            console.warn('Native share failed, showing modal:', err);
                            const blobUrl = URL.createObjectURL(preloadedFile);
                            showStoryModal(blobUrl);
                        });
                    return; // Don't open modal — native share sheet is open
                }
                // Native share not supported (desktop) — show modal
                const blobUrl = URL.createObjectURL(preloadedFile);
                showStoryModal(blobUrl);
            } else {
                // Image not ready yet — open modal which handles loading internally via loadStoryImage()
                showStoryModal(null);
            }
        });
    }
});
