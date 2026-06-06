export const KNOWN_DIRECTORS = [
  // Américains
  "Stanley Kubrick", "Martin Scorsese", "Quentin Tarantino",
  "Christopher Nolan", "Alfred Hitchcock", "Steven Spielberg",
  "Francis Ford Coppola", "David Lynch", "Woody Allen",
  "Wes Anderson", "Paul Thomas Anderson", "David Fincher",
  "Ridley Scott", "James Cameron", "Sofia Coppola",
  // Européens
  "Jean-Luc Godard", "François Truffaut", "Jacques Tati",
  "Claude Chabrol", "Eric Rohmer", "Agnès Varda",
  "Ingmar Bergman", "Federico Fellini", "Michelangelo Antonioni",
  "Luchino Visconti", "Roberto Rossellini", "Pedro Almodóvar",
  "Luis Buñuel", "Werner Herzog", "Wim Wenders",
  "Rainer Werner Fassbinder", "Michael Haneke", "Lars von Trier",
  "Jacques Audiard", "Robert Bresson", "Jean Renoir",
  // Asiatiques
  "Akira Kurosawa", "Hayao Miyazaki", "Wong Kar-wai",
  "Park Chan-wook", "Bong Joon-ho", "Yasujirō Ozu",
  "Satyajit Ray", "Hou Hsiao-hsien", "Edward Yang",
  // Autres
  "Andrei Tarkovsky", "Krzysztof Kieślowski", "Abbas Kiarostami",
  "John Ford", "Orson Welles", "Billy Wilder",
  "Roman Polanski", "Terrence Malick", "Joachim Trier",
  "Céline Sciamma", "Gaspar Noé"
];

export const COLORS = {
  background: "#0D0D0D",
  accent: "#E8400C",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA"
};

export const INSTAGRAM = {
  imageSize: 1080,
  maxSlides: 10,
  waitBeforePublish: 10000 // 10s entre création et publication carousel
};

export const SCORING = {
  halfLifeYears: 25,
  minScore: 0.01,
  knownDirectorScore: 1.0,
  unknownDirectorScore: 0.6,
  topFilmsToKeep: 40,
  // Score pour les films à l'affiche demain :
  // - repriseScore : film classique (année < année courante) → priorité maximale
  // - nouveauteScore : nouveauté de l'année courante → priorité modérée
  repriseScore: 2.0,
  nouveauteScore: 0.85,
  avantPremiereBonus: 3.0,
};

export const CINEMA_ADDRESSES: Record<string, string> = {
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
  "Lumière Fourmi": "68 Rue Pierre Corneille, 69003 Lyon",
  "Lumière Terreaux": "40 Rue du Pdt Édouard Herriot, 69001 Lyon",
  "Institut Lumière": "25 Rue du Premier-Film, 69008 Lyon",
  "Le Comoedia": "13 Av. Berthelot, 69007 Lyon",
  "Cinéma Les Amphis": "12 Rue Pierre Cot, 69120 Vaulx-en-Velin",
  "Cinéma Gerard-Philipe": "12 Av. Jean Cagne, 69200 Vénissieux",
  "Cinéma Opéra": "6 Rue Joseph Serlin, 69001 Lyon"
};