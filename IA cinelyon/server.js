// ═══════════════════════════════════════════════════════════
//  CHATBOT CINELYON — Serveur Node.js
//  IA : Groq (gratuit) — https://console.groq.com/keys
//
//  INSTALLATION :
//    npm install express cors node-fetch
//
//  VARIABLES D'ENVIRONNEMENT à définir :
//    GROQ_API_KEY  → ta clé Groq (gratuit sur console.groq.com)
//
//  LANCEMENT LOCAL :
//    GROQ_API_KEY=gsk_xxxx node server.js
//
//  DÉPLOIEMENT :
//    Railway  → variable d'env GROQ_API_KEY dans le dashboard
//    Vercel   → même chose dans Settings > Environment Variables
//    Render   → idem
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors()); // Autorise cinelyon.fr à appeler ce serveur
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile'; // Gratuit, très capable

// ── CACHE DES SÉANCES (rafraîchi toutes les heures) ──────────
let seancesCache    = null;
let dernierChargement = 0;
const TTL_CACHE     = 60 * 60 * 1000; // 1 heure en ms

async function chargerSeances() {
  const maintenant = Date.now();
  if (seancesCache && maintenant - dernierChargement < TTL_CACHE) {
    return seancesCache; // Retourne le cache si encore frais
  }

  try {
    // cinelyon.fr est une PWA — on récupère les données
    // depuis l'API publique qu'elle utilise (Superhero-like JSON via CDN)
    // En pratique ton pote peut remplacer cette URL par son vrai endpoint API
    const resp = await fetch('https://www.cinelyon.fr/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CineLyon-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    // Si cinelyon.fr expose un endpoint JSON, mets son URL ici :
    // const resp = await fetch('https://www.cinelyon.fr/api/seances');
    // const data = await resp.json();

    // En attendant, on extrait les films depuis le HTML
    const html = await resp.text();

    // Extraction basique des films depuis le HTML (balises <h3> avec liens /film/)
    const filmMatches = [...html.matchAll(/<h3[^>]*>\s*<a[^>]+href="\/film\/([^"]+)"[^>]*>([^<]+)<\/a>/g)];
    const films = filmMatches.map(m => ({
      slug: m[1],
      titre: m[2].trim()
    }));

    // Extraction des cinémas mentionnés
    const cinemaMatches = [...html.matchAll(/Cinéma\s+[\w\s-]+|Pathé\s+\w+|UGC\s+\w+|Lumière\s+\w+|CGR\s+\w+/g)];
    const cinemas = [...new Set(cinemaMatches.map(m => m[0].trim()))];

    seancesCache = { films, cinemas, chargeLe: new Date().toISOString() };
    dernierChargement = maintenant;

    console.log(`✅ ${films.length} films chargés depuis cinelyon.fr`);
    return seancesCache;

  } catch (err) {
    console.error('Erreur chargement cinelyon.fr:', err.message);
    // Retourne les données en cache même périmées plutôt que rien
    return seancesCache || { films: [], cinemas: [], chargeLe: null };
  }
}

// ── GUARDRAILS ────────────────────────────────────────────────
const HORS_SUJET = [
  'politique', 'religion', 'sexe', 'violence', 'drogue',
  'ignore', 'oublie', 'jailbreak', 'prompt', 'instruction',
  'roleplay', 'imagine que tu', 'tu es maintenant', 'sans restriction'
];

// ── ROUTE PRINCIPALE : POST /api/chat ─────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = (req.body.message || '').trim();
    if (!userMessage) return res.status(400).json({ reply: 'Message vide.' });

    const msgMin = userMessage.toLowerCase();

    // Guardrail entrée
    if (HORS_SUJET.some(mot => msgMin.includes(mot))) {
      return res.json({ reply: "Je suis spécialisé dans les séances de cinéma à Lyon. Pose-moi une question sur les films, les horaires ou les cinémas lyonnais ! 🎬" });
    }

    // Chargement des données cinelyon
    const donnees = await chargerSeances();

    const listeFilms   = donnees.films.length > 0
      ? donnees.films.map(f => f.titre).join(', ')
      : 'données temporairement indisponibles';

    const listeCinemas = [
      'Pathé Bellecour', 'Pathé Carré de Soie', 'Pathé Vaise',
      'UGC Astoria', 'UGC Confluence', 'UGC Internationale', 'UGC Part-Dieu',
      'Lumière Bellecour', 'Lumière La Fourmi', 'Lumière Terreaux',
      'Institut Lumière', 'Cinéma Comoedia', 'CGR Brignais',
      'Ciné Toboggan', 'Ciné Meyzieu', 'Ciné Saint-Denis',
      'Cinéma Opéra', 'Cinéma Gérard-Philipe', 'Les Amphis'
    ].join(', ');

    // System prompt
    const systemPrompt = `Tu es CinéBot, l'assistant officiel de CinéLyon (cinelyon.fr).
Tu aides les utilisateurs à trouver des séances de cinéma à Lyon et ses alentours.

<ROLE>
Tu réponds UNIQUEMENT aux questions liées au cinéma à Lyon :
- Films actuellement à l'affiche
- Horaires et séances
- Cinémas de Lyon (salles, adresses, formats disponibles)
- Recommandations de films selon les goûts
- Infos pratiques (tarifs habituels, réservation, formats IMAX/4DX/Dolby)
Pour tout autre sujet : "Je suis spécialisé dans le cinéma lyonnais, je ne peux pas t'aider sur ce sujet. 🎬"
</ROLE>

<DONNÉES_ACTUELLES>
Films actuellement à l'affiche sur cinelyon.fr :
${listeFilms}

Cinémas disponibles à Lyon :
${listeCinemas}

Fonctionnalités du site cinelyon.fr :
- Filtres par genre, réalisateur, cinéma, jour et horaire
- Formats spéciaux : IMAX, 4DX, Dolby, ICE, 3D
- Avant-premières disponibles
- Favoris et synchronisation entre amis
- Pour les horaires précis et la réservation → renvoie vers cinelyon.fr
</DONNÉES_ACTUELLES>

<FORMAT>
- Réponses courtes et directes (3-5 phrases max)
- Utilise des emojis cinéma avec modération 🎬🍿🎥
- Toujours terminer en invitant à visiter cinelyon.fr pour réserver
- Ton chaleureux et enthousiaste, comme un ami cinéphile
</FORMAT>`;

    // Appel Groq
    const groqResp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:      GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  }
        ],
        max_tokens:  400,
        temperature: 0.7
      })
    });

    const data = await groqResp.json();

    if (!groqResp.ok) {
      throw new Error(data.error?.message || `Groq error ${groqResp.status}`);
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Réponse vide de Groq');

    res.json({ reply });

  } catch (err) {
    console.error('Erreur /api/chat:', err.message);
    res.status(500).json({
      reply: '😕 Désolé, le service est temporairement indisponible. Consulte directement cinelyon.fr !'
    });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'CinéLyon Chatbot' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CinéLyon Chatbot actif sur le port ${PORT}`);
  if (!GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY manquante ! Définis la variable d\'environnement.');
  }
});