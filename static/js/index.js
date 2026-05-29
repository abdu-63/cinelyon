    /**
     * Échappe les caractères HTML pour prévenir les attaques XSS.
     * À utiliser pour toute donnée externe insérée via innerHTML.
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(String(str)));
        return div.innerHTML;
    }

    document.querySelectorAll('.seances-wrapper').forEach(wrapper => {
        const buttons = wrapper.querySelectorAll('.mini-cal-btn');
        const daySeances = wrapper.querySelectorAll('.day-seances');

        buttons.forEach(btn => {
            btn.addEventListener('click', function () {
                const dayIndex = this.dataset.day;
                const isActive = this.classList.contains('active');

                buttons.forEach(b => b.classList.remove('active'));
                daySeances.forEach(d => d.classList.remove('show'));

                if (!isActive) {
                    this.classList.add('active');
                    const targetSeances = wrapper.querySelector(`.day-seances[data-day="${dayIndex}"]`);
                    if (targetSeances) {
                        targetSeances.classList.add('show');
                    }
                }
            });
        });
    });

    /**
     * Cache les séances passées pour le jour en cours (data-day="0").
     * Compare l'heure de chaque séance à l'heure locale actuelle.
     */
    function hidePastSeances() {
        if (localStorage.getItem('hidePastShowtimes') === 'false') {
            return; // Masquage désactivé
        }
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        document.querySelectorAll('.seances-wrapper').forEach(wrapper => {
            const todayBlock = wrapper.querySelector('.day-seances[data-day="0"]');
            if (!todayBlock) return;

            const btn = wrapper.querySelector('.mini-cal-btn[data-day="0"]');
            if (btn) {
                const dayDate = parseDayLabel(btn.textContent.trim());
                if (dayDate.getDate() !== now.getDate() || 
                    dayDate.getMonth() !== now.getMonth() || 
                    dayDate.getFullYear() !== now.getFullYear()) {
                    return;
                }
            }

            todayBlock.querySelectorAll('.horaire-wrapper').forEach(hw => {
                const timeStr = hw.dataset.time;
                if (!timeStr) return;
                const cleanTimeStr = timeStr.replace('h', ':');
                const [h, m] = cleanTimeStr.split(':').map(Number);
                const seanceMinutes = h * 60 + (m || 0);
                if (seanceMinutes < currentMinutes) {
                    hw.style.display = 'none';
                }
            });

            // Si toutes les séances d'un cinéma sont cachées, cacher le conteneur
            todayBlock.querySelectorAll('.seance_container').forEach(container => {
                const visible = container.querySelectorAll('.horaire-wrapper:not([style*="display: none"])');
                if (visible.length === 0) {
                    container.style.display = 'none';
                }
            });
        });
    }

    hidePastSeances();

    document.querySelectorAll('.synopsis-toggle').forEach(btn => {
        const synopsis = btn.closest('.synopsis_container').querySelector('.synopsis');

        if (synopsis.scrollHeight <= synopsis.clientHeight) {
            btn.style.display = 'none';
        }

        btn.addEventListener('click', function () {
            synopsis.classList.toggle('expanded');
            this.textContent = synopsis.classList.contains('expanded') ? 'Lire moins' : 'Lire plus';
        });
    });

    const FAVORITES_KEY = 'cinelyon_favorites';

    function getFavorites() {
        try {
            const data = localStorage.getItem(FAVORITES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erreur lecture favoris:', e);
            return [];
        }
    }

    function saveFavorites(favorites) {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.error('Erreur sauvegarde favoris:', e);
        }
    }

    function toggleFavorite(filmId) {
        const favorites = getFavorites();
        const index = favorites.indexOf(filmId);
        if (index === -1) {
            favorites.push(filmId);
        } else {
            favorites.splice(index, 1);
        }
        saveFavorites(favorites);
        return index === -1;
    }

    function isFavorite(filmId) {
        return getFavorites().includes(filmId);
    }

    function updateFavoriteButton(btn, isActive) {
        if (isActive) {
            btn.classList.add('active');
            btn.title = 'Retirer des favoris';
        } else {
            btn.classList.remove('active');
            btn.title = 'Ajouter aux favoris';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const films = document.querySelectorAll('.film-card');
        const searchTitle = document.getElementById('search-title');
        const filterGenre = document.getElementById('filter-genre');
        const filterDirector = document.getElementById('filter-director');
        const filterCinema = document.getElementById('filter-cinema');
        const filterDay = document.getElementById('filter-day');
        const filterFormat = document.getElementById('filter-format');
        const filterTime = document.getElementById('filter-time');
        const filterFavorites = document.getElementById('filter-favorites');
        const resetBtn = document.getElementById('reset-filters');

        // ── Pagination / Infinite Scroll ─────────────────────────────────────
        const PAGE_SIZE = 20;
        const filmsContainer = document.getElementById('films-container');

        /**
         * Collecte tous les groupes DOM associés à chaque film-card.
         * Un groupe = [film-card, spacer div, seances-wrapper, responsive-div]
         */
        function collectFilmGroups() {
            const groups = [];
            document.querySelectorAll('#films-container .film-card').forEach(card => {
                const group = [card];
                let sibling = card.nextElementSibling;
                while (
                    sibling &&
                    !sibling.classList.contains('film-card') &&
                    sibling.id !== 'lazy-sentinel' &&
                    sibling.id !== 'lazy-loader'
                ) {
                    group.push(sibling);
                    sibling = sibling.nextElementSibling;
                }
                groups.push(group);
            });
            return groups;
        }

        // Sentinel (élément observé pour déclencher le chargement suivant)
        const sentinel = document.createElement('div');
        sentinel.id = 'lazy-sentinel';
        filmsContainer.appendChild(sentinel);

        // Loader affiché pendant le chargement
        const lazyLoader = document.createElement('div');
        lazyLoader.id = 'lazy-loader';
        lazyLoader.innerHTML = '<span></span><span></span><span></span>';
        lazyLoader.style.display = 'none';
        filmsContainer.appendChild(lazyLoader);

        let visibleGroups = [];  // groupes filtrés et potentiellement visibles
        let revealedCount = 0;   // combien ont déjà été révélés

        /** Cache un groupe complet (film + séances) */
        function hideGroup(group) {
            group.forEach(el => {
                el.classList.add('lazy-hidden');
            });
        }

        /** Révèle un groupe complet avec animation */
        function revealGroup(group) {
            group.forEach(el => {
                el.classList.remove('lazy-hidden');
                if (el.classList.contains('film-card')) {
                    el.classList.add('lazy-reveal');
                    el.addEventListener('animationend', () => el.classList.remove('lazy-reveal'), { once: true });
                }
            });
        }

        /** Révèle le prochain lot de films */
        function revealNextBatch() {
            const end = Math.min(revealedCount + PAGE_SIZE, visibleGroups.length);
            if (revealedCount >= visibleGroups.length) {
                lazyLoader.style.display = 'none';
                return;
            }
            for (let i = revealedCount; i < end; i++) {
                revealGroup(visibleGroups[i]);
            }
            revealedCount = end;
            lazyLoader.style.display = revealedCount < visibleGroups.length ? 'flex' : 'none';
        }

        /**
         * Réinitialise la pagination après un changement de filtre.
         * groups = liste des groupes qui doivent être visibles
         */
        function resetPagination(groups) {
            // Masquer tous les groupes d'abord
            const allGroups = collectFilmGroups();
            allGroups.forEach(g => hideGroup(g));

            visibleGroups = groups;
            revealedCount = 0;
            revealNextBatch();
        }

        // IntersectionObserver sur le sentinel
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && revealedCount < visibleGroups.length) {
                lazyLoader.style.display = 'flex';
                // Petit délai pour montrer le loader
                setTimeout(revealNextBatch, 100);
            }
        }, { rootMargin: '200px' });
        observer.observe(sentinel);

        // Pagination initiale (tous les films visibles au départ)
        const allGroups = collectFilmGroups();
        resetPagination(allGroups);
        // ── Fin Pagination ────────────────────────────────────────────────────

        [searchTitle, filterGenre, filterDirector, filterCinema, filterDay, filterFormat, filterTime].forEach(el => {
            if (el) el.addEventListener('change', filterFilms);
            if (el && el.id === 'search-title') el.addEventListener('input', filterFilms);
        });

        const favTabsContainer = document.getElementById('favorites-tabs-container');
        const favTabs = document.querySelectorAll('.fav-tab');
        let currentFavTab = 'perso';

        // Event listener for tab clicks
        favTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                favTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFavTab = tab.dataset.tab;

                // Toggle friend badges visibility
                if (currentFavTab === 'amis') {
                    document.body.classList.add('show-friend-badges');
                } else {
                    document.body.classList.remove('show-friend-badges');
                }

                filterFilms(); // Trigger the main filter logic again
            });
        });

        // Extend favorites toggle event
        filterFavorites.addEventListener('change', () => {
            // Compatibility for iOS < 15.4 (:has selector fallback)
            filterFavorites.parentElement.classList.toggle('active', filterFavorites.checked);

            if (filterFavorites.checked) {
                favTabsContainer.style.display = 'flex';
                // Show badges if amis tab is active when toggled on
                if (currentFavTab === 'amis') {
                    document.body.classList.add('show-friend-badges');
                }
            } else {
                favTabsContainer.style.display = 'none';
                document.body.classList.remove('show-friend-badges');
            }
            // Trigger filtering handled below
            filterFilms();
        });

        const genres = new Set();
        const directors = new Set();
        const cinemas = new Set();

        films.forEach(film => {
            const filmId = film.dataset.filmId;
            const favoriteBtn = film.querySelector('.favorite-btn');

            updateFavoriteButton(favoriteBtn, isFavorite(filmId));

            favoriteBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const isNowFavorite = toggleFavorite(filmId);
                updateFavoriteButton(favoriteBtn, isNowFavorite);

                if (filterFavorites.checked) {
                    filterFilms();
                }
            });
        });

        // Met à jour les cœurs et ré-applique le filtre favoris lors du retour arrière (bfcache)
        window.addEventListener('pageshow', function () {
            updateAllFavoriteButtons();
            if (filterFavorites && filterFavorites.checked) {
                filterFilms();
            }
        });

        document.querySelectorAll('.synopsis_container').forEach(container => {
            const synopsis = container.querySelector('.synopsis');
            const toggleBtn = container.querySelector('.synopsis-toggle');
            if (synopsis && toggleBtn) {
                if (synopsis.scrollHeight <= synopsis.clientHeight + 5) {
                    toggleBtn.style.display = 'none';
                    synopsis.classList.add('no-fade');
                }
            }
        });

        function filterFilms() {
            const titleQuery = searchTitle.value.toLowerCase();
            const genreQuery = filterGenre.value.toLowerCase();
            const directorQuery = filterDirector.value.toLowerCase();
            const cinemaQuery = filterCinema.value.toLowerCase();
            const dayQuery = filterDay.value.toLowerCase();
            const formatQuery = filterFormat.value.toLowerCase();
            const timeQuery = filterTime.value;
            const showOnlyFavorites = filterFavorites.checked;
            
            let effectiveDayQuery = dayQuery;
            if (timeQuery && !dayQuery) {
                effectiveDayQuery = 'auj';
            }

            function checkTimeSlot(timeStr, slot) {
                if (!timeStr || !slot) return true;
                const cleanTimeStr = timeStr.replace('h', ':');
                const [h, m] = cleanTimeStr.split(':').map(Number);
                const totalMinutes = h * 60 + (m || 0);

                switch (slot) {
                    case 'morning': return totalMinutes < 780; // avant 13h
                    case 'afternoon': return totalMinutes >= 780 && totalMinutes < 1080; // 13h-18h
                    case 'evening': return totalMinutes >= 1080 && totalMinutes < 1320; // 18h-22h
                    case 'night': return totalMinutes >= 1320; // après 22h
                    default: return true;
                }
            }

            function matchesTimeFilter(filmElement, targetDayQuery) {
                if (!timeQuery) return true;
                
                let sibling = filmElement.nextElementSibling;
                let seancesWrapper = null;
                while (sibling && !sibling.classList.contains('film-card')) {
                    if (sibling.classList.contains('seances-wrapper')) {
                        seancesWrapper = sibling;
                        break;
                    }
                    sibling = sibling.nextElementSibling;
                }
                
                if (!seancesWrapper) return false;
                
                let targetIndex = -1;
                const btns = seancesWrapper.querySelectorAll('.mini-cal-btn');
                btns.forEach((btn, idx) => {
                    if (targetDayQuery && btn.textContent.toLowerCase().includes(targetDayQuery)) {
                        targetIndex = idx;
                    }
                });

                if (targetIndex === -1) return false;
                
                const targetBlock = seancesWrapper.querySelector(`.day-seances[data-day="${targetIndex}"]`);
                if (!targetBlock) return false;
                
                const horaires = targetBlock.querySelectorAll('.horaire-wrapper');
                for (let hw of horaires) {
                    if (checkTimeSlot(hw.dataset.time, timeQuery)) return true;
                }
                return false;
            }

            // Helper function to check if a cinema matches the filter
            function cinemaMatchesFilter(cinemaName) {
                if (!cinemaQuery) return true;
                const lowerCinema = cinemaName.toLowerCase();
                if (cinemaQuery.startsWith('group:')) {
                    const group = cinemaQuery.split(':')[1];
                    if (group === 'pathe') {
                        return lowerCinema.includes('pathé');
                    } else if (group === 'ugc') {
                        return lowerCinema.includes('ugc');
                    } else if (group === 'lumiere') {
                        return lowerCinema.includes('lumière') || lowerCinema.includes('institut lumière');
                    }
                } else {
                    return lowerCinema.includes(cinemaQuery);
                }
                return true;
            }

            // Collecter les groupes filtrés pour la pagination
            const filteredGroups = [];

            films.forEach(film => {
                const title = film.dataset.title;
                const genres = film.dataset.genres;
                const director = film.dataset.director;
                const cinemas = film.dataset.cinemas;
                const days = film.dataset.days || '';
                const formats = film.dataset.formats || '';
                const filmId = film.dataset.filmId;

                let sibling = film.nextElementSibling;
                const relatedElements = [];
                while (
                    sibling &&
                    !sibling.classList.contains('film-card') &&
                    sibling.id !== 'lazy-sentinel' &&
                    sibling.id !== 'lazy-loader'
                ) {
                    relatedElements.push(sibling);
                    sibling = sibling.nextElementSibling;
                }

                const matchTitle = title.includes(titleQuery);
                const matchGenre = !genreQuery || genres.includes(genreQuery);
                const matchDirector = !directorQuery || director.includes(directorQuery);

                // Gestion des groupes de cinémas
                let matchCinema = true;
                if (cinemaQuery) {
                    if (cinemaQuery.startsWith('group:')) {
                        const group = cinemaQuery.split(':')[1];
                        if (group === 'pathe') {
                            matchCinema = cinemas.includes('pathé');
                        } else if (group === 'ugc') {
                            matchCinema = cinemas.includes('ugc');
                        } else if (group === 'lumiere') {
                            matchCinema = cinemas.includes('lumière') || cinemas.includes('institut lumière');
                        }
                    } else {
                        matchCinema = cinemas.includes(cinemaQuery);
                    }
                }
                const matchDay = !effectiveDayQuery || days.includes(effectiveDayQuery);
                const matchFormat = !formatQuery || formats.includes(formatQuery);

                const matchFavorites = !showOnlyFavorites || (currentFavTab === 'perso' ? isFavorite(filmId) : (window.hasFriendFavorited && window.hasFriendFavorited(filmId)));
                const matchTime = matchesTimeFilter(film, effectiveDayQuery);
                
                const show = matchTitle && matchGenre && matchDirector && matchCinema && matchDay && matchFormat && matchFavorites && matchTime;

                // Ne pas modifier display ici — géré par la pagination
                // On marque juste les groupes à inclure dans la liste paginée
                if (!show) {
                    // Masquer explicitement les films exclus par le filtre
                    film.classList.add('lazy-hidden');
                    relatedElements.forEach(el => el.classList.add('lazy-hidden'));
                } else {
                    filteredGroups.push([film, ...relatedElements]);
                }

                // Filter seances in the mini-calendar and day-seances based on cinema and day filters
                if (show) {
                    const seancesWrapper = relatedElements.find(el => el.classList.contains('seances-wrapper'));
                    if (seancesWrapper) {
                        const miniCalBtns = seancesWrapper.querySelectorAll('.mini-cal-btn');
                        const btns = seancesWrapper.querySelectorAll('.mini-cal-btn');
                        const daySeancesDivs = seancesWrapper.querySelectorAll('.day-seances');
                        const miniCalendar = seancesWrapper.querySelector('.mini-calendar');

                        // Case 1: With mini-calendar (show_all mode)
                        if (daySeancesDivs.length > 0) {
                            let firstVisibleDayIndex = -1;

                            daySeancesDivs.forEach((dayDiv, index) => {
                                const btn = btns[index];
                                const btnText = btn ? btn.textContent.toLowerCase() : '';
                                const isTargetDay = btnText.includes(effectiveDayQuery);
                                
                                const dayMatches = !effectiveDayQuery || btnText.includes(effectiveDayQuery);

                                const seanceContainers = dayDiv.querySelectorAll('.seance_container');
                                let hasVisibleSeance = false;

                                seanceContainers.forEach(container => {
                                    const cinemaLink = container.querySelector('.cinema-link');
                                    const cinemaName = cinemaLink ? cinemaLink.dataset.cinema : '';
                                    const matches = dayMatches && cinemaMatchesFilter(cinemaName);
                                    container.style.display = matches ? '' : 'none';

                                    // Filter individual horaires by format and time range
                                    if (matches && (formatQuery || timeQuery)) {
                                        const wrappers = container.querySelectorAll('.horaire-wrapper');
                                        let hasVisibleHoraire = false;
                                        wrappers.forEach(w => {
                                            const fmt = w.dataset.format || '';
                                            const timeStr = w.dataset.time || '';
                                            
                                            const fmtMatch = !formatQuery || fmt.includes(formatQuery);
                                            
                                            let timeRangeMatch = true;
                                            if (timeQuery) {
                                                if (!isTargetDay) { // Time filter only applies to the targeted day
                                                    timeRangeMatch = false;
                                                } else {
                                                    timeRangeMatch = checkTimeSlot(timeStr, timeQuery);
                                                }
                                            }

                                            const hwShow = fmtMatch && timeRangeMatch;
                                            w.style.display = hwShow ? '' : 'none';
                                            if (hwShow) hasVisibleHoraire = true;
                                        });
                                        if (!hasVisibleHoraire) container.style.display = 'none';
                                    } else if (matches) {
                                        container.querySelectorAll('.horaire-wrapper').forEach(w => w.style.display = '');
                                    }

                                    const spacingDiv = container.nextElementSibling;
                                    if (spacingDiv && spacingDiv.classList.contains('responsive-petite-div')) {
                                        spacingDiv.style.display = container.style.display;
                                    }
                                    if (container.style.display !== 'none') hasVisibleSeance = true;
                                });

                                if (btn) {
                                    btn.style.display = hasVisibleSeance ? '' : 'none';
                                    if (!hasVisibleSeance && btn.classList.contains('active')) {
                                        btn.classList.remove('active');
                                        dayDiv.classList.remove('show');
                                    }
                                    if (hasVisibleSeance && firstVisibleDayIndex === -1) {
                                        firstVisibleDayIndex = index;
                                    }
                                }
                            });

                            // If a day filter is active (effectively or explicitly), auto-expand the matching day
                            if (effectiveDayQuery && firstVisibleDayIndex !== -1) {
                                // Hide mini-calendar since only one day is shown
                                if (miniCalendar) miniCalendar.style.display = 'none';
                                // Show the matching day's seances directly
                                daySeancesDivs.forEach((dayDiv, index) => {
                                    if (index === firstVisibleDayIndex) {
                                        dayDiv.classList.add('show');
                                    } else {
                                        dayDiv.classList.remove('show');
                                    }
                                });
                            } else if (!effectiveDayQuery) {
                                // Restore mini-calendar visibility
                                if (miniCalendar) miniCalendar.style.display = '';
                            }
                        } else {
                            // Case 2: Without mini-calendar (single day mode)
                            const seanceContainers = seancesWrapper.querySelectorAll('.seance_container');
                            seanceContainers.forEach(container => {
                                const cinemaLink = container.querySelector('.cinema-link');
                                if (cinemaLink) {
                                    const cinemaName = cinemaLink.dataset.cinema;
                                    const matches = cinemaMatchesFilter(cinemaName);
                                    container.style.display = matches ? '' : 'none';

                                    // Filter individual horaires by format
                                    if (matches && formatQuery) {
                                        const wrappers = container.querySelectorAll('.horaire-wrapper');
                                        let hasVisibleHoraire = false;
                                        wrappers.forEach(w => {
                                            const fmt = w.dataset.format || '';
                                            const fmtMatch = fmt.includes(formatQuery);
                                            w.style.display = fmtMatch ? '' : 'none';
                                            if (fmtMatch) hasVisibleHoraire = true;
                                        });
                                        if (!hasVisibleHoraire) container.style.display = 'none';
                                    } else if (matches) {
                                        container.querySelectorAll('.horaire-wrapper').forEach(w => w.style.display = '');
                                    }

                                    const spacingDiv = container.nextElementSibling;
                                    if (spacingDiv && spacingDiv.classList.contains('responsive-petite-div')) {
                                        spacingDiv.style.display = container.style.display;
                                    }
                                }
                            });
                        }
                    }
                }
            });

            // Réinitialiser la pagination avec les groupes filtrés
            resetPagination(filteredGroups);
        }

        resetBtn.addEventListener('click', function () {
            searchTitle.value = '';
            filterGenre.value = '';
            filterDirector.value = '';
            filterCinema.value = '';
            filterDay.value = '';
            filterFormat.value = '';
            filterTime.value = '';
            filterFavorites.checked = false;
            filterFavorites.parentElement.classList.remove('active');
            favTabsContainer.style.display = 'none';
            document.body.classList.remove('show-friend-badges');

            // Fermer les calendriers ouverts
            document.querySelectorAll('.mini-cal-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.day-seances').forEach(div => div.classList.remove('show'));

            filterFilms();
        });
    });

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
        "Cinéma Opéra": "https://www.allocine.fr/seance/salle_gen_csalle=P0006.html"
    };

    document.querySelectorAll('.cinema-link').forEach(link => {
        const cinemaName = link.dataset.cinema;
        const url = cinemaUrls[cinemaName];
        if (url) {
            link.href = url;
        } else {
            // Si pas d'URL connue, recherche Google
            link.href = `https://www.google.com/search?q=${encodeURIComponent(cinemaName + ' Lyon')}`;
        }
    });

    // Calendar button functionality
    const cinemaAddresses = {
        "Pathé Carré de Soie": "Place Jacques Monod, Carré de Soie, 69120 Vaulx-en-Velin",
        "Pathé Bellecour": "79 Rue de la République, 69002 Lyon",
        "Pathé Vaise": "33 Rue des Docks, 69009 Lyon",
        "UGC Part-Dieu": "Centre Commercial Part-Dieu, 69003 Lyon",
        "UGC Confluence": "112 Cours Charlemagne, 69002 Lyon",
        "UGC Internationale": "Cité Internationale, 80 Quai Charles de Gaulle, 69006 Lyon",
        "UGC Astoria": "31 Rue de la République, 69002 Lyon",
        "CGR Brignais": "330 Route de Givors, 69530 Brignais",
        "Ciné Meyzieu": "24 Rue Louis Saulnier, 69330 Meyzieu",
        "Ciné Toboggan": "14 Avenue Jean Macé, 69150 Décines-Charpieu",
        "Cinéma Saint-Denis": "77 Gd Rue de la Croix-Rousse, 69004 Lyon",
        "Lumière Bellecour": "12 Rue de la Barre, 69002 Lyon",
        "Lumière La Fourmi": "8 Grande Rue de la Guillotière, 69007 Lyon",
        "Lumière Terreaux": "40 Rue du Président Édouard Herriot, 69001 Lyon",
        "Institut Lumière": "25 Rue du Premier-Film, 69008 Lyon",
        "Cinéma Comoedia": "13 Avenue Berthelot, 69007 Lyon",
        "Cinéma Les Amphis": "12 Rue Pierre Cot, 69120 Vaulx-en-Velin",
        "Cinéma Gerard-Philipe": "12 Rue Émile Zola, 69200 Vénissieux",
        "Cinéma Opéra": "6 Rue Joseph Serlin, 69001 Lyon"
    };

    function parseDuration(dureeStr) {
        let hours = 0, minutes = 0;
        const hourMatch = dureeStr.match(/(\d+)\s*h/);
        const minMatch = dureeStr.match(/(\d+)\s*min/);
        if (hourMatch) hours = parseInt(hourMatch[1]);
        if (minMatch) minutes = parseInt(minMatch[1]);
        return { hours, minutes };
    }

    function parseDayLabel(dayLabel) {
        // Format: "Dim 18 janv" or "Lun 13 Janv"
        const dayAbbrevMap = {
            'lun': 1, 'mar': 2, 'mer': 3, 'jeu': 4,
            'ven': 5, 'sam': 6, 'dim': 0
        };

        const monthAbbrevMap = {
            'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3,
            'mai': 4, 'juin': 5, 'juil': 6, 'août': 7,
            'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11
        };

        const parts = dayLabel.toLowerCase().split(' ');
        const dayNum = parseInt(parts[1]);
        const monthAbbrev = parts[2];

        const today = new Date();
        let year = today.getFullYear();
        const monthNum = monthAbbrevMap[monthAbbrev];

        // If the month is before current month, it's next year
        if (monthNum !== undefined && monthNum < today.getMonth()) {
            year++;
        }

        const targetDate = new Date(year, monthNum !== undefined ? monthNum : today.getMonth(), dayNum);
        return targetDate;
    }

    function formatICSDate(date) {
        const pad = n => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    }

    function formatGoogleDate(date) {
        const pad = n => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    }

    function getEventData(btn) {
        const title = btn.dataset.title;
        const year = btn.dataset.year;
        const cinema = btn.dataset.cinema;
        const duree = btn.dataset.duree;
        const letterboxd = btn.dataset.letterboxd;
        const time = btn.dataset.time;
        const lang = btn.dataset.lang;
        const dayLabel = btn.dataset.day;
        const ticketUrl = btn.dataset.ticket;

        const movieTitle = `${title} (${year}) - ${cinema}`;
        const location = cinemaAddresses[cinema] || `${cinema}, Lyon`;
        const duration = parseDuration(duree);

        const eventDate = parseDayLabel(dayLabel);
        const [hours, minutes] = time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + duration.hours);
        endDate.setMinutes(endDate.getMinutes() + duration.minutes);

        let description = `Film: ${title} (${year})\nLangue: ${lang}\nDurée: ${duree}`;
        if (ticketUrl) {
            description += `\n\nRéserver: ${ticketUrl}`;
        }
        description += `\n\nLetterboxd: ${letterboxd}`;

        return { movieTitle, location, eventDate, endDate, description, letterboxd, title, time };
    }

    function escapeICS(str) {
        // Escape special characters for ICS format
        return str
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    function generateICS(data) {
        const uid = `cinelyon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@cinelyon.vercel.app`;
        const now = new Date();
        const descEscaped = escapeICS(data.description);
        const locationEscaped = escapeICS(data.location);
        const titleEscaped = escapeICS(data.movieTitle);

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CineLyon//Calendar//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(data.eventDate)}
DTEND:${formatICSDate(data.endDate)}
SUMMARY:${titleEscaped}
LOCATION:${locationEscaped}
DESCRIPTION:${descEscaped}
URL:${data.letterboxd}
END:VEVENT
END:VCALENDAR`;
    }

    function generateGoogleCalendarUrl(data) {
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: data.movieTitle,
            dates: `${formatGoogleDate(data.eventDate)}/${formatGoogleDate(data.endDate)}`,
            details: data.description,
            location: data.location,
            sprop: `website:${data.letterboxd}`
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    function downloadICS(icsContent, filename) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // Create dropdown menu
    const calendarMenu = document.createElement('div');
    calendarMenu.className = 'calendar-menu';
    calendarMenu.innerHTML = `
        <button class="calendar-menu-option" data-type="apple">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Calendar
        </button>
        <button class="calendar-menu-option" data-type="google">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
        </button>
    `;
    document.body.appendChild(calendarMenu);

    let activeCalendarBtn = null;

    function closeCalendarMenu() {
        calendarMenu.classList.remove('show');
        activeCalendarBtn = null;
    }

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.calendar-btn') && !e.target.closest('.calendar-menu')) {
            closeCalendarMenu();
        }
    });

    calendarMenu.querySelectorAll('.calendar-menu-option').forEach(option => {
        option.addEventListener('click', function () {
            if (!activeCalendarBtn) return;

            const type = this.dataset.type;
            const data = getEventData(activeCalendarBtn);

            if (type === 'apple') {
                const icsContent = generateICS(data);
                const filename = `${data.title.replace(/[^a-z0-9]/gi, '_')}_${data.time.replace(':', 'h')}.ics`;
                downloadICS(icsContent, filename);
            } else if (type === 'google') {
                const url = generateGoogleCalendarUrl(data);
                window.open(url, '_blank');
            }

            activeCalendarBtn.classList.add('added');
            setTimeout(() => {
                activeCalendarBtn.classList.remove('added');
            }, 2000);

            closeCalendarMenu();
        });
    });

    document.querySelectorAll('.calendar-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const rect = this.getBoundingClientRect();
            const menuWidth = 180;
            const menuHeight = 90;

            let top = rect.bottom + window.scrollY + 5;
            let left = rect.left + window.scrollX;

            // Si le menu dépasse à droite
            if (rect.left + menuWidth > window.innerWidth) {
                left = rect.right + window.scrollX - menuWidth;
            }

            // Si le menu dépasse en bas
            if (rect.bottom + menuHeight > window.innerHeight) {
                top = rect.top + window.scrollY - menuHeight - 5;
            }

            calendarMenu.style.top = `${top}px`;
            calendarMenu.style.left = `${left}px`;

            activeCalendarBtn = this;
            calendarMenu.classList.add('show');
        });
    });
    // --- Supabase Favorites Sync ---
    const SUPABASE_URL = window._cinelyon.supabaseUrl;
    const SUPABASE_KEY = window._cinelyon.supabaseKey;
    const SYNC_ID_KEY = 'cinelyon_sync_id';
    const DEVICE_ID_KEY = 'cinelyon_device_id';
    let syncDebounceTimer = null;

    function getSyncId() {
        let id = localStorage.getItem(SYNC_ID_KEY);
        if (!id) {
            id = (crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
            localStorage.setItem(SYNC_ID_KEY, id);
        }
        return id;
    }

    function getDeviceId() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = (crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    function getSyncCode() {
        return getSyncId().substring(0, 6).toUpperCase();
    }

    function updateAllFavoriteButtons() {
        document.querySelectorAll('.film-card').forEach(film => {
            const filmId = film.dataset.filmId;
            const favoriteBtn = film.querySelector('.favorite-btn');
            if (favoriteBtn) {
                updateFavoriteButton(favoriteBtn, isFavorite(filmId));
            }
        });
    }

    // Push favorites to Supabase (debounced)
    function syncToSupabase() {
        if (!SUPABASE_URL || !SUPABASE_KEY) return;
        clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => {
            const favorites = getFavorites();
            const syncId = getSyncId();
            const localTimestamp = localStorage.getItem('cinelyon_local_updated_at') || new Date().toISOString().split('.')[0] + 'Z';

            fetch(`${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${syncId}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            })
                .then(r => r.json())
                .then(data => {
                    const method = data.length > 0 ? 'PATCH' : 'POST';
                    const url = data.length > 0
                        ? `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${syncId}`
                        : `${SUPABASE_URL}/rest/v1/favorites`;
                    return fetch(url, {
                        method: method,
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            user_id: syncId,
                            films: favorites,
                            updated_at: localTimestamp
                        })
                    });
                })
                .catch(e => console.warn('Sync Supabase erreur:', e));
        }, 500);
    }

    // Fetch favorites from Supabase and merge
    function syncFromSupabase() {
        if (!SUPABASE_URL || !SUPABASE_KEY) return;
        const syncId = getSyncId();
        fetch(`${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${syncId}&select=films,updated_at`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        })
            .then(r => r.json())
            .then(data => {
                if (data.length > 0 && Array.isArray(data[0].films)) {
                    const remote = data[0].films;
                    // Format database timestamp (strip ms if any to be safe)
                    let remoteTimeStr = data[0].updated_at || new Date('2000-01-01').toISOString();
                    if (remoteTimeStr.includes('.')) {
                        remoteTimeStr = remoteTimeStr.split('.')[0] + 'Z';
                    }
                    const remoteTimestamp = new Date(remoteTimeStr).getTime();

                    const local = getFavorites();
                    let localTimeStr = localStorage.getItem('cinelyon_local_updated_at') || new Date('2000-01-01').toISOString();
                    const localTimestamp = new Date(localTimeStr).getTime();

                    // Last Write Wins
                    if (remoteTimestamp > localTimestamp) {
                        // Remote is newer, replace local
                        // Only save to localStorage, don't trigger sync back to Supabase
                        _originalSaveFavorites(remote);
                        localStorage.setItem('cinelyon_local_updated_at', remoteTimeStr);
                        updateAllFavoriteButtons();
                    } else if (localTimestamp > remoteTimestamp) {
                        // Local is newer, push to remote
                        syncToSupabase();
                    }
                }
            })
            .catch(e => console.warn('Fetch Supabase erreur:', e));
    }

    // Override saveFavorites to also sync
    const _originalSaveFavorites = saveFavorites;
    saveFavorites = function (favorites) {
        _originalSaveFavorites(favorites);
        localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString().split('.')[0] + 'Z');
        syncToSupabase();
    };

    // Fetch on page load
    syncFromSupabase();

    // --- Sync Modal ---
    const syncBtn = document.getElementById('sync-favorites');
    const syncModal = document.getElementById('sync-modal');
    const syncModalClose = document.getElementById('sync-modal-close');
    const syncCodeDisplay = document.getElementById('sync-code');
    const copyCodeBtn = document.getElementById('copy-sync-code');
    const syncCodeInput = document.getElementById('sync-code-input');
    const syncLinkBtn = document.getElementById('sync-link-btn');

    if (syncBtn && syncModal) {
        syncBtn.addEventListener('click', () => {
            syncCodeDisplay.textContent = getSyncCode();
            syncModal.classList.add('show');

            // Force sync to ensure ID exists in DB so others can find it
            // Only update local timestamp if no films exist remotely, to avoid overwriting remote when just clicking sync, 
            // but for simplicity and safety, we rely on the normal save process.
            syncToSupabase();
        });

        syncModalClose.addEventListener('click', () => {
            syncModal.classList.remove('show');
        });

        syncModal.addEventListener('click', (e) => {
            if (e.target === syncModal) syncModal.classList.remove('show');
        });

        copyCodeBtn.addEventListener('click', () => {
            const code = getSyncCode();

            // 1. Try modern Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    showToast('Code copié ! 📋');
                }).catch(() => {
                    tryFallback();
                });
            } else {
                tryFallback();
            }

            function tryFallback() {
                // 2. Try execCommand with iOS support
                const ta = document.createElement('textarea');
                ta.value = code;
                ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
                ta.setAttribute('readonly', '');
                document.body.appendChild(ta);

                try {
                    if (navigator.userAgent.match(/ipad|iphone/i)) {
                        const range = document.createRange();
                        range.selectNodeContents(ta);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                        ta.setSelectionRange(0, code.length);
                    } else {
                        ta.select();
                    }

                    const successful = document.execCommand('copy');
                    document.body.removeChild(ta);

                    if (successful) {
                        showToast('Code copié ! 📋');
                    } else {
                        throw new Error('execCommand failed');
                    }
                } catch (err) {
                    if (document.body.contains(ta)) document.body.removeChild(ta);

                    // 3. Final fallback: Prompt
                    prompt("Appuyez longtemps pour copier le code :", code);
                }
            }
        });

        // Add Unlink Button Logic
        const unlinkBtn = document.getElementById('unlink-device-btn');
        if (unlinkBtn) {
            unlinkBtn.addEventListener('click', () => {
                if (confirm("Voulez-vous vraiment déconnecter cet appareil ?\nVos favoris resteront sur cet appareil, mais il ne sera plus synchronisé avec les autres.")) {
                    // Generate new ID
                    const newId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
                    localStorage.setItem(SYNC_ID_KEY, newId);

                    // Reset local update time so it's pushed fresh to new ID
                    localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString().split('.')[0] + 'Z');

                    // Update UI
                    syncCodeDisplay.textContent = getSyncCode();

                    // Push local favorites to the new user ID
                    syncToSupabase();

                    showToast('Appareil déconnecté ! 🔌');

                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                }
            });
        }

        syncLinkBtn.addEventListener('click', () => {
            const code = syncCodeInput.value.trim().toUpperCase();
            if (code.length !== 6) {
                showToast('Le code doit faire 6 caractères', 'warning');
                return;
            }

            // Find the full UUID for this short code
            fetch(`${SUPABASE_URL}/rest/v1/favorites?user_id=like.${code.toLowerCase()}*&select=user_id,films,updated_at`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            })
                .then(r => r.json())
                .then(data => {
                    if (data.length === 0) {
                        showToast('Code introuvable. Vérifiez le code.', 'warning');
                        return;
                    }
                    // Adopt the remote user_id
                    const remoteId = data[0].user_id;
                    const remoteFilms = data[0].films || [];
                    let remoteTimeStr = data[0].updated_at || new Date().toISOString();
                    if (remoteTimeStr.includes('.')) {
                        remoteTimeStr = remoteTimeStr.split('.')[0] + 'Z';
                    }

                    localStorage.setItem(SYNC_ID_KEY, remoteId);

                    // Merge local favorites with remote ONCE upon linking, then let "last write wins" take over
                    const local = getFavorites();
                    const merged = [...new Set([...local, ...remoteFilms])];

                    _originalSaveFavorites(merged);
                    // Force the new timestamp as local to ensure we push the merged result
                    localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString().split('.')[0] + 'Z');

                    updateAllFavoriteButtons();

                    // Push merged back
                    syncToSupabase();

                    syncCodeDisplay.textContent = getSyncCode();
                    syncModal.classList.remove('show');
                    showToast('Appareil lié ! Favoris synchronisés ✨');

                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                })
                .catch(e => {
                    console.error('Erreur liaison:', e);
                    showToast('Erreur de liaison', 'warning');
                });
        });

        syncCodeInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }

    // --- Import from URL (legacy shareable link) ---
    (function importFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const favsParam = params.get('favs');
        if (!favsParam) return;
        try {
            const imported = JSON.parse(atob(decodeURIComponent(favsParam)));
            if (!Array.isArray(imported) || imported.length === 0) return;
            const existing = getFavorites();
            const merged = [...new Set([...existing, ...imported])];
            saveFavorites(merged);
            updateAllFavoriteButtons();
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
            const newCount = merged.length - existing.length;
            if (newCount > 0) {
                showToast(`${newCount} favori${newCount > 1 ? 's' : ''} importé${newCount > 1 ? 's' : ''} ! 🎬`);
            } else {
                showToast('Tous ces favoris étaient déjà enregistrés 👍');
            }
        } catch (e) {
            console.error('Erreur import favoris:', e);
        }
    })();

    // Toast notification
    function showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }
    // --- Trailer Overlay Logic ---
    document.addEventListener('DOMContentLoaded', () => {
        const trailerOverlay = document.getElementById('trailer-overlay');
        const trailerIframe = document.getElementById('trailer-iframe');
        const trailerCloseBtn = document.querySelector('.trailer-close-btn');

        function openTrailer(videoUrl) {
            // Robust regex for various YouTube URL formats (watch, youtu.be, embed, shorts)
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = videoUrl.match(ytRegex);
            let embedUrl = videoUrl;

            if (match && match[1]) {
                const videoId = match[1];
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            } else if (videoUrl.includes('youtube.com/embed/') || videoUrl.includes('youtube-nocookie.com/embed/')) {
                embedUrl = videoUrl.includes('?') ? `${videoUrl}&autoplay=1` : `${videoUrl}?autoplay=1`;
            }

            trailerIframe.src = embedUrl;
            trailerOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }

        function closeTrailer() {
            trailerOverlay.classList.remove('active');
            trailerIframe.src = ''; // Stop video
            document.body.style.overflow = '';
        }

        // Event delegation for dynamically added buttons if any, or just static ones
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.trailer-btn');
            if (btn) {
                e.preventDefault();
                openTrailer(btn.href);
            }
        });

        trailerCloseBtn.addEventListener('click', closeTrailer);

        // Close on background click
        trailerOverlay.addEventListener('click', (e) => {
            if (e.target === trailerOverlay) {
                closeTrailer();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && trailerOverlay.classList.contains('active')) {
                closeTrailer();
            }
        });

        // --- PWA Shortcuts Handler --
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('filter') === 'favorites') {
            const favoritesToggle = document.getElementById('filter-favorites');
            if (favoritesToggle) {
                favoritesToggle.checked = true;
                // Trigger change event to apply filter
                favoritesToggle.dispatchEvent(new Event('change'));

                // Optional: Scroll to films container
                const filmsContainer = document.getElementById('films-container');
                if (filmsContainer) filmsContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // ── Global map to be accessed by JS filters ────────────────────────
    window.globalFriendsFilmsMap = {};
    window.hasFriendFavorited = function (filmId) {
        return window.globalFriendsFilmsMap[filmId] && window.globalFriendsFilmsMap[filmId].length > 0;
    };

    // ── Friends Feature ──────────────────────────────────────────────────
    (function () {
        if (!SUPABASE_URL || !SUPABASE_KEY) return;

        const syncModalOverlay = document.getElementById('sync-modal'); // used for opening/closing
        const syncFavoritesBtn = document.getElementById('sync-favorites'); // this btn opens sync modal

        const friendCodeInput = document.getElementById('friend-code-input');
        const friendNameInput = document.getElementById('friend-name-input');
        const friendAddBtn = document.getElementById('friend-add-btn');
        const friendsList = document.getElementById('friends-list');
        const syncedDevicesList = document.getElementById('synced-devices-list');
        const friendSearchInput = document.getElementById('friend-search-input');
        const friendSearchResults = document.getElementById('friend-search-results');

        const myDeviceId = getDeviceId();
        let friends = [];
        let devices = [];

        async function registerDevice() {
            if (!SUPABASE_URL || !SUPABASE_KEY) return;
            const myName = localStorage.getItem('cinelyon_device_name') || 'Anonyme';
            try {
                await sbFetch('sync_devices', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                        sync_id: getSyncId(),
                        device_id: myDeviceId,
                        name: myName,
                        last_seen: new Date().toISOString()
                    })
                });
            } catch (e) {
                console.warn('Erreur registerDevice:', e);
            }
        }

        async function loadSyncedDevices() {
            if (!SUPABASE_URL || !SUPABASE_KEY) return;
            try {
                const r = await sbFetch(`sync_devices?sync_id=eq.${getSyncId()}&order=last_seen.desc`);
                devices = (await r.json()) || [];
            } catch (e) {
                devices = [];
            }
            renderDevicesList();
        }

        async function updateDeviceName(newName) {
            localStorage.setItem('cinelyon_device_name', newName);
            try {
                await sbFetch(`sync_devices?device_id=eq.${myDeviceId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name: newName, last_seen: new Date().toISOString() })
                });
            } catch (e) { }
            await loadSyncedDevices();
        }

        async function disconnectDevice(device) {
            const isMe = device.device_id === myDeviceId;
            const msg = isMe
                ? "Voulez-vous vraiment déconnecter cet appareil ?\nVos favoris resteront sur cet appareil, mais il ne sera plus synchronisé avec les autres."
                : `Voulez-vous vraiment déconnecter "${device.name || 'Appareil Inconnu'}" ?\nCet appareil perdra la synchronisation à sa prochaine visite.`;

            if (!confirm(msg)) return;

            if (isMe) {
                // Regenerate sync ID (same as global unlink button)
                const newId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
                localStorage.setItem(SYNC_ID_KEY, newId);
                localStorage.setItem('cinelyon_local_updated_at', new Date().toISOString().split('.')[0] + 'Z');
                syncCodeDisplay.textContent = getSyncCode();
                syncToSupabase();
                showToast('Appareil déconnecté ! 🔌');
                setTimeout(() => window.location.reload(), 1200);
            } else {
                try {
                    await sbFetch(`sync_devices?device_id=eq.${device.device_id}`, { method: 'DELETE' });
                    showToast(`"${device.name || 'Appareil'}" déconnecté ! 🔌`);
                    await loadSyncedDevices();
                } catch (e) {
                    showToast('Erreur lors de la déconnexion', 'warning');
                }
            }
        }

        function renderDevicesList() {
            syncedDevicesList.innerHTML = '';
            if (devices.length === 0) {
                syncedDevicesList.innerHTML = '<p class="friends-empty">Aucun appareil trouvé.</p>';
                return;
            }

            devices.forEach(device => {
                const isMe = device.device_id === myDeviceId;
                const div = document.createElement('div');
                div.className = 'friend-item';
                if (isMe) div.classList.add('me-device');

                const initials = (device.name || 'A').substring(0, 2).toUpperCase();

                const unlinkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
                const editIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

                div.innerHTML = `
                    <div class="friend-avatar">${escapeHtml(initials)}</div>
                    <div class="friend-info">
                        <div class="friend-name-row">
                            <span class="friend-name">${escapeHtml(device.name || 'Appareil Inconnu')} ${isMe ? '(Moi)' : ''}</span>
                            <div class="device-actions">
                                <button class="friend-edit-btn" title="Modifier le nom">${editIcon}</button>
                                <button class="device-unlink-btn" title="Déconnecter cet appareil">${unlinkIcon}</button>
                            </div>
                        </div>
                        <div class="friend-stats">Dernière activité : ${new Date(device.last_seen).toLocaleDateString()}</div>
                    </div>
                `;

                div.querySelector('.friend-edit-btn').addEventListener('click', async () => {
                    const newName = prompt('Nom de cet appareil :', device.name || '');
                    if (!newName || !newName.trim()) return;
                    if (isMe) {
                        // Update name + localStorage for current device
                        updateDeviceName(newName.trim());
                    } else {
                        // Patch the other device's name directly in DB
                        try {
                            await sbFetch(`sync_devices?device_id=eq.${device.device_id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ name: newName.trim() })
                            });
                            showToast('Nom modifié ✏️');
                            await loadSyncedDevices();
                        } catch (e) {
                            showToast('Erreur lors du renommage', 'warning');
                        }
                    }
                });

                div.querySelector('.device-unlink-btn').addEventListener('click', () => {
                    disconnectDevice(device);
                });

                syncedDevicesList.appendChild(div);
            });
        }

        // APRÈS (corrigé)
        async function sbFetch(path, opts = {}) {
            const { headers: extraHeaders, ...restOpts } = opts;  // ← sépare headers du reste
            const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    ...extraHeaders   // merge proprement
                },
                ...restOpts   // spread SANS la clé headers
            });
            if (!r.ok) {
                const errText = await r.text();
                console.error(`Supabase API Error on ${path}: ${r.status}`, errText);
                throw new Error(`API Error: ${r.status}`);
            }
            return r;
        }

        async function loadFriends() {
            try {
                const r = await sbFetch(`friend_follows?follower_id=eq.${getSyncId()}&select=followed_id,followed_name,is_hidden`);
                friends = await r.json();
            } catch (e) { friends = []; }
        }

        let previousFriendsFilmsMap = null;

        async function loadFriendsFilms() {
            const newMap = {};
            const activeFriends = friends.filter(f => !f.is_hidden);
            if (activeFriends.length === 0) {
                window.globalFriendsFilmsMap = {};
                return;
            }
            const query = activeFriends.map(f => `user_id.eq.${f.followed_id}`).join(',');
            try {
                const r = await sbFetch(`favorites?or=(${query})&select=user_id,films`);
                const rows = await r.json();

                rows.forEach(row => {
                    const friend = friends.find(f => f.followed_id === row.user_id);
                    const name = friend ? (friend.followed_name || row.user_id.substring(0, 6).toUpperCase()) : '?';
                    (row.films || []).forEach(filmId => {
                        if (!newMap[filmId]) newMap[filmId] = [];
                        if (!newMap[filmId].includes(name)) newMap[filmId].push(name);
                    });
                });

                // Detect new favorites if we already had a map
                if (previousFriendsFilmsMap !== null) {
                    const newAdds = new Set();
                    for (const filmId in newMap) {
                        const currentNames = newMap[filmId];
                        const oldNames = previousFriendsFilmsMap[filmId] || [];
                        const addedNames = currentNames.filter(n => !oldNames.includes(n));

                        addedNames.forEach(name => {
                            newAdds.add(name);
                        });
                    }

                    if (newAdds.size > 0) {
                        const namesArr = Array.from(newAdds);
                        const namesStr = namesArr.length > 2
                            ? `${namesArr.slice(0, 2).join(', ')} et d'autres`
                            : namesArr.join(' et ');
                        showToast(`${namesStr} a ajouté un nouveau favori ! 🍿`);

                        // If we are currently filtering by friend favorites, refresh the view
                        const currentFavTab = document.querySelector('.fav-tab.active')?.dataset.tab;
                        if (document.getElementById('filter-favorites').checked && currentFavTab === 'amis') {
                            document.getElementById('search-title').dispatchEvent(new Event('input'));
                        }
                    }
                }

                window.globalFriendsFilmsMap = newMap;
                previousFriendsFilmsMap = JSON.parse(JSON.stringify(newMap)); // deep copy

            } catch (e) { console.warn('Erreur films amis:', e); }
        }

        function renderFriendBadges() {
            document.querySelectorAll('.film-card').forEach(card => {
                const filmId = card.dataset.filmId;
                const old = card.querySelector('.friend-badge');
                if (old) old.remove();
                if (filmId && window.globalFriendsFilmsMap[filmId] && window.globalFriendsFilmsMap[filmId].length > 0) {
                    const names = window.globalFriendsFilmsMap[filmId];
                    const badge = document.createElement('span');
                    badge.className = 'friend-badge';
                    badge.title = names.join(', ');
                    badge.innerHTML = `👥 ${names.length > 1 ? names.length + ' amis' : escapeHtml(names[0])}`;
                    const favoriteBtn = card.querySelector('.favorite-btn');
                    if (favoriteBtn) favoriteBtn.insertAdjacentElement('afterend', badge);
                }
            });
        }

        function renderFriendsList() {
            if (friends.length === 0) {
                friendsList.innerHTML = '<p class="friends-empty">Aucun ami ajouté pour l\'instant.</p>';
                return;
            }
            friendsList.innerHTML = '';
            friends.forEach(f => {
                const name = f.followed_name || f.followed_id.substring(0, 6).toUpperCase();
                const code = f.followed_id.substring(0, 6).toUpperCase();
                const filmCount = Object.values(window.globalFriendsFilmsMap).filter(arr => arr.includes(name)).length;
                const isHidden = f.is_hidden || false;

                const item = document.createElement('div');
                item.className = `friend-item ${isHidden ? 'is-hidden' : ''}`;
                item.innerHTML = `
                    <div class="friend-avatar">${escapeHtml(name.substring(0, 2).toUpperCase())}</div>
                    <div class="friend-info">
                        <div class="friend-name">
                            ${escapeHtml(name)}
                            <button class="friend-action-btn edit-btn" title="Modifier le nom">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <div class="friend-meta">Code : ${escapeHtml(code)} · ${filmCount} favori${filmCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="friend-action-btn hide-btn" title="${isHidden ? 'Afficher' : 'Masquer'}">
                            ${isHidden
                        ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg>`
                    }
                        </button>
                        <button class="friend-action-btn remove-btn" title="Supprimer">×</button>
                    </div>
                `;

                item.querySelector('.edit-btn').addEventListener('click', () => editFriendName(f.followed_id, f.followed_name));
                item.querySelector('.hide-btn').addEventListener('click', () => toggleHideFriend(f.followed_id, isHidden));
                item.querySelector('.remove-btn').addEventListener('click', () => removeFriend(f.followed_id));
                friendsList.appendChild(item);
            });
        }

        async function toggleHideFriend(followedId, currentHidden) {
            try {
                await sbFetch(`friend_follows?follower_id=eq.${getSyncId()}&followed_id=eq.${followedId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ is_hidden: !currentHidden })
                });
                const friend = friends.find(f => f.followed_id === followedId);
                if (friend) friend.is_hidden = !currentHidden;
                await loadFriendsFilms();
                renderFriendsList();
                renderFriendBadges();
                showToast(!currentHidden ? 'Ami masqué' : 'Ami affiché');

                // Re-filter if on friends tab
                const currentFavTab = document.querySelector('.fav-tab.active')?.dataset.tab;
                if (document.getElementById('filter-favorites').checked && currentFavTab === 'amis') {
                    document.getElementById('search-title').dispatchEvent(new Event('input'));
                }
            } catch (e) { showToast('Erreur visibilité', 'warning'); }
        }

        async function editFriendName(followedId, currentName) {
            const newName = prompt("Nouveau nom pour cet ami :", currentName || "");
            if (newName === null) return;
            const finalName = newName.trim();
            try {
                await sbFetch(`friend_follows?follower_id=eq.${getSyncId()}&followed_id=eq.${followedId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ followed_name: finalName || null })
                });
                const friend = friends.find(f => f.followed_id === followedId);
                if (friend) friend.followed_name = finalName || null;
                await loadFriendsFilms();
                renderFriendsList();
                renderFriendBadges();
                showToast('Nom mis à jour !');
            } catch (e) { showToast('Erreur modification nom', 'warning'); }
        }

        async function addFriend(code, name) {
            try {
                const r = await sbFetch(`favorites?user_id=like.${code.toLowerCase()}*&select=user_id&limit=1`);
                const data = await r.json();
                if (!data || data.length === 0) { showToast('Code introuvable.', 'warning'); return; }
                const followedId = data[0].user_id;
                if (followedId === getSyncId()) { showToast('C\'est ton propre code !', 'warning'); return; }
                if (friends.some(f => f.followed_id === followedId)) { showToast('Déjà dans ta liste.', 'warning'); return; }

                // Si pas de nom saisi, récupérer automatiquement le nom public de l'ami
                let resolvedName = name || null;
                if (!resolvedName) {
                    try {
                        const rDev = await sbFetch(`sync_devices?sync_id=eq.${followedId}&order=last_seen.desc&limit=1&select=name`);
                        const devData = await rDev.json();
                        if (devData && devData.length > 0 && devData[0].name && devData[0].name !== 'Anonyme') {
                            resolvedName = devData[0].name;
                        }
                    } catch (_) { /* silence – le nom restera null */ }
                }

                await sbFetch('friend_follows', {
                    method: 'POST',
                    headers: { 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ follower_id: getSyncId(), followed_id: followedId, followed_name: resolvedName })
                });
                friends.push({ followed_id: followedId, followed_name: resolvedName });
                await loadFriendsFilms();
                renderFriendsList();
                renderFriendBadges();
                showToast(`${resolvedName || code} ajouté ! 🎉`);
                friendCodeInput.value = '';
                friendNameInput.value = '';
                // Trigger global filter if tab is active
                const currentFavTab = document.querySelector('.fav-tab.active')?.dataset.tab;
                if (document.getElementById('filter-favorites').checked && currentFavTab === 'amis') {
                    // This is slightly a hack, but firing an input event on search-title will trigger filterFilms()
                    const ev = new Event('input');
                    document.getElementById('search-title').dispatchEvent(ev);
                }
            } catch (e) {
                console.error(e);
                showToast(`Erreur d'ajout: ${e.message}`, 'warning');
                alert(`Erreur Supabase: ${e.message}\nVerifie que les Policies RLS autorisent INSERT/SELECT pour cette table.`);
            }
        }

        async function removeFriend(followedId) {
            try {
                await sbFetch(`friend_follows?follower_id=eq.${getSyncId()}&followed_id=eq.${followedId}`, { method: 'DELETE' });
                friends = friends.filter(f => f.followed_id !== followedId);
                await loadFriendsFilms();
                renderFriendsList();
                renderFriendBadges();
                showToast('Ami supprimé');

                const currentFavTab = document.querySelector('.fav-tab.active')?.dataset.tab;
                if (document.getElementById('filter-favorites').checked && currentFavTab === 'amis') {
                    const ev = new Event('input');
                    document.getElementById('search-title').dispatchEvent(ev);
                }
            } catch (e) { console.warn('Erreur suppression ami:', e); }
        }

        // ── Recherche par nom ─────────────────────────────────────────────────
        async function addFriendById(syncId, name) {
            if (syncId === getSyncId()) { showToast('C\'est toi !', 'warning'); return; }
            if (friends.some(f => f.followed_id === syncId)) { showToast('Déjà dans ta liste.', 'warning'); return; }
            try {
                await sbFetch('friend_follows', {
                    method: 'POST',
                    headers: { 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ follower_id: getSyncId(), followed_id: syncId, followed_name: name })
                });
                friends.push({ followed_id: syncId, followed_name: name });
                await loadFriendsFilms();
                renderFriendsList();
                renderFriendBadges();
                showToast(`${name} ajouté ! 🎉`);
                if (friendSearchInput) { friendSearchInput.value = ''; }
                if (friendSearchResults) { friendSearchResults.innerHTML = ''; }
                const currentFavTab = document.querySelector('.fav-tab.active')?.dataset.tab;
                if (document.getElementById('filter-favorites').checked && currentFavTab === 'amis') {
                    document.getElementById('search-title').dispatchEvent(new Event('input'));
                }
            } catch (e) {
                console.error(e);
                showToast('Erreur d\'ajout', 'warning');
            }
        }

        function renderSearchResults(results) {
            if (!friendSearchResults) return;
            if (results.length === 0) {
                friendSearchResults.innerHTML = '<p class="friends-empty">Aucun utilisateur trouvé.</p>';
                return;
            }
            friendSearchResults.innerHTML = '';
            results.forEach(user => {
                if (user.sync_id === getSyncId()) return; // skip self
                const alreadyAdded = friends.some(f => f.followed_id === user.sync_id);
                const initials = (user.name || '?').substring(0, 2).toUpperCase();

                const item = document.createElement('div');
                item.className = `friend-search-result${alreadyAdded ? ' already-added' : ''}`;
                item.innerHTML = `
                    <div class="friend-avatar">${escapeHtml(initials)}</div>
                    <span class="friend-search-name">${escapeHtml(user.name)}</span>
                    <button class="sync-link-btn friend-search-add-btn">${alreadyAdded ? 'Ajouté ✓' : 'Ajouter'}</button>
                `;
                if (!alreadyAdded) {
                    item.querySelector('.friend-search-add-btn').addEventListener('click', () => {
                        addFriendById(user.sync_id, user.name);
                    });
                }
                friendSearchResults.appendChild(item);
            });
        }

        let nameSearchDebounce = null;
        if (friendSearchInput) {
            friendSearchInput.addEventListener('input', function () {
                clearTimeout(nameSearchDebounce);
                const query = this.value.trim();
                if (query.length < 2) {
                    friendSearchResults.innerHTML = '';
                    return;
                }
                nameSearchDebounce = setTimeout(async () => {
                    try {
                        const r = await sbFetch(`sync_devices?name=ilike.*${encodeURIComponent(query)}*&select=sync_id,name&limit=8`);
                        const results = await r.json();
                        renderSearchResults(results);
                    } catch (e) {
                        friendSearchResults.innerHTML = '<p class="friends-empty">Erreur de recherche.</p>';
                    }
                }, 350);
            });
        }

        friendCodeInput.addEventListener('input', function () {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        friendAddBtn.addEventListener('click', () => {
            const code = friendCodeInput.value.trim().toUpperCase();
            const name = friendNameInput.value.trim();
            if (code.length !== 6) { showToast('Le code doit faire 6 caractères', 'warning'); return; }
            addFriend(code, name);
        });

        // ── Toggle mode Par code / Par nom ────────────────────────────────────
        document.querySelectorAll('.friend-mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.friend-mode-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const mode = tab.dataset.mode;
                document.getElementById('friend-add-by-code').style.display = mode === 'code' ? '' : 'none';
                document.getElementById('friend-add-by-name').style.display = mode === 'name' ? '' : 'none';
                if (mode === 'name' && friendSearchInput) {
                    friendSearchInput.focus();
                }
            });
        });

        syncFavoritesBtn.addEventListener('click', () => {
            // We inject into the existing sync button listener logic so it refreshes the list
            renderFriendsList();
            registerDevice();
            loadSyncedDevices();
        });

        // Modal Tabs Logic
        document.querySelectorAll('.sync-modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sync-modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.sync-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });

        // Initialisation au chargement de la page
        registerDevice().then(() => loadSyncedDevices());

        loadFriends().then(async () => {
            await loadFriendsFilms();
            renderFriendBadges();

            // Start polling every 30 seconds
            setInterval(async () => {
                await loadFriends();
                await loadFriendsFilms();
                renderFriendBadges();
            }, 30000);
        });
    })();

