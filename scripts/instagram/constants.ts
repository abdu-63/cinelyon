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
  topFilmsToKeep: 10
};