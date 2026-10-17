/* eslint-disable max-lines */
/**
 * Barèmes FFT officiels — transcodés depuis LE GUIDE DE LA COMPÉTITION PADEL, Chapitre II
 * « Classements – Barèmes & Assimilations ».
 *
 * Sources (consultées le 17/10/2026) :
 *  - Saison 2026 — MAJ février 2026, barèmes « à compter du 1er mars 2026 » :
 *    https://padelmagazine.fr/wp-content/uploads/2026/01/CHAPITRE-II-Classements-Baremes-Assimilations-2026.pdf
 *    (copie relayée de la publication FFT ; original fft-site.cdn.prismic.io)
 *  - Saison 2027 — publication juillet 2026, applicable à compter du 1er septembre 2026 :
 *    https://padelmagazine.fr/wp-content/uploads/2026/07/qwFzycWu5tZDdzGl_CHAPITREIIClassementsBaremesAssimilations2027.pdf
 *
 * Règles encodées :
 *  - P25 à P250 : grille par tranches de paires (4-8, 9-12, 13-16, 17-20, 21-24, 25-28, 29-32+),
 *    identique messieurs / dames / mixte.
 *  - P500 & P1000 (saison 2027) : grille unique, distincte messieurs / dames (plus de
 *    dépendance à la taille du tableau selon le guide juillet 2026).
 *  - P500 (saison 2026) : grille par tranches de paires.
 *  - P1500 & P2000 (saison 2026) : grilles 21-24 / 25-28 / 29-32+.
 *  - P2000 & P3000 (saison 2027) : grilles uniques.
 *  - P3000 saison 2026 : grille « Championnats de France Seniors par paires ».
 *
 * Non encodé (affiché « règle non vérifiée ») :
 *  - P1000 saison 2026 : la grille du guide février 2026 n'est pas extraite de façon fiable
 *    (tableau présenté en image dans le PDF officiel) ; aucune valeur inventée.
 *  - Barèmes antérieurs au 1er mars 2026 (saison 2025/26 antérieure) : non transcrits.
 *  - Championnats par équipes (P200/P300/P400, R1, N1, N2) : hors périmètre MVP.
 *
 * Les tournois mixtes n'existent que jusqu'en P250 (grille sans distinction messieurs/dames) ;
 * pour P25 à P250, la grille est donc la même quelle que soit l'épreuve (cf. tableau des cuts).
 */

export type Season = '2026' | '2027'

/** Bornes d'application des saisons (barèmes « à compter du 1er mars 2026 »). */
export const SEASON_BOUNDS: { season: Season; from: string; to: string }[] = [
  { season: '2026', from: '2026-03-01', to: '2026-08-31' },
  { season: '2027', from: '2026-09-01', to: '9999-12-31' },
]

/** Tranches de taille de tableau P25–P250/P500 (saison 2026, P25–P500 grisés identiques). */
export type Bracket = '4-8' | '9-12' | '13-16' | '17-20' | '21-24' | '25-28' | '29-32+'

export const BRACKETS: Bracket[] = ['4-8', '9-12', '13-16', '17-20', '21-24', '25-28', '29-32+']

export type GenderKey = 'messieurs' | 'dames'

/** Grille par tranches : rows[r] = points au rang r+1 pour chaque tranche. */
export interface GridBrackets {
  kind: 'brackets'
  brackets: Bracket[]
  /** 32 lignes (rang 1..32), null = pas de points au rang ; dernière ligne = « 32 et plus » */
  rows: (number | null)[][]
}

/** Grille unique (saison 2027 : P500 messieurs/dames, P1000, P2000, P3000). */
export interface GridUnique {
  kind: 'unique'
  /** 32 lignes rang 1..32 (ou Y lignes + terminale « 32 et plus ») */
  rows: number[]
  /** index (0-based) de la ligne terminale « N et plus » si la grille s'arrête avant 32 */
  capIndex?: number
  capLabel?: string
}

export interface CategoryRule {
  season: Season
  category: string
  /** grille applicable et ses variants gender */
  grid:
    | { kind: 'brackets'; brackets: Bracket[]; rows: (number | null)[][] }
    | { kind: 'unique'; messieurs: GridUnique; dames: GridUnique }
  source: string
}

/* ------------------------------------------------------------------ */
/* SAISON 2026 (à compter du 01/03/2026) — guide MAJ février 2026      */
/* ------------------------------------------------------------------ */

export const S2026: CategoryRule[] = [
  {
    season: '2026',
    category: 'P25',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        //        4-8  9-12 13-16 17-20 21-24 25-28 29-32+
        /* 1 */ [25, 25, 25, 25, 25, 25, 25],
        /* 2 */ [20, 20, 20, 22, 22, 22, 22],
        /* 3 */ [15, 16, 17, 19, 19, 19, 19],
        /* 4 */ [9, 14, 15, 17, 17, 17, 17],
        /* 5 */ [6, 10, 14, 15, 15, 15, 15],
        /* 6 */ [4, 8, 13, 13, 13, 13, 13],
        /* 7 */ [2, 7, 12, 12, 12, 12, 12],
        /* 8 */ [1, 6, 11, 11, 11, 11, 11],
        /* 9 */ [null, 4, 8, 9, 9, 9, 8],
        /*10 */ [null, 3, 7, 8, 8, 8, 7],
        /*11 */ [null, 2, 6, 7, 7, 7, 6],
        /*12 */ [null, 1, 5, 6, 6, 6, 5],
        /*13 */ [null, null, 4, 5, 5, 5, 4],
        /*14 */ [null, null, 3, 4, 5, 5, 4],
        /*15 */ [null, null, 2, 3, 5, 5, 4],
        /*16 */ [null, null, 1, 2, 5, 5, 4],
        /*17 */ [null, null, null, 1, 4, 4, 3],
        /*18 */ [null, null, null, 1, 4, 4, 3],
        /*19 */ [null, null, null, 1, 3, 3, 3],
        /*20 */ [null, null, null, 1, 3, 3, 3],
        /*21 */ [null, null, null, null, 2, 2, 2],
        /*22 */ [null, null, null, null, 2, 2, 2],
        /*23 */ [null, null, null, null, 1, 2, 2],
        /*24 */ [null, null, null, null, 1, 2, 2],
        /*25 */ [null, null, null, null, null, 1, 1],
        /*26 */ [null, null, null, null, null, 1, 1],
        /*27 */ [null, null, null, null, null, 1, 1],
        /*28 */ [null, null, null, null, null, 1, 1],
        /*29 */ [null, null, null, null, null, null, 1],
        /*30 */ [null, null, null, null, null, null, 1],
        /*31 */ [null, null, null, null, null, null, 1],
        /*32+*/ [null, null, null, null, null, null, 1],
      ],
    },
  },
  {
    season: '2026',
    category: 'P50',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [50, 50, 50, 50, 50, 50, 50],
        [40, 40, 40, 43, 43, 43, 43],
        [30, 33, 35, 38, 38, 38, 38],
        [20, 28, 30, 35, 35, 35, 35],
        [13, 20, 25, 30, 30, 30, 30],
        [5, 15, 23, 28, 28, 28, 29],
        [3, 10, 20, 25, 25, 25, 28],
        [1, 5, 15, 23, 23, 23, 27],
        [null, 3, 13, 18, 19, 19, 23],
        [null, 2, 11, 15, 18, 18, 22],
        [null, 1, 9, 13, 17, 17, 21],
        [null, 1, 8, 12, 16, 16, 20],
        [null, null, 5, 10, 15, 15, 19],
        [null, null, 3, 9, 14, 14, 18],
        [null, null, 2, 8, 13, 13, 17],
        [null, null, 1, 6, 12, 12, 16],
        [null, null, null, 5, 10, 10, 14],
        [null, null, null, 3, 9, 9, 13],
        [null, null, null, 2, 8, 8, 13],
        [null, null, null, 1, 6, 7, 12],
        [null, null, null, null, 5, 6, 12],
        [null, null, null, null, 3, 5, 11],
        [null, null, null, null, 2, 4, 11],
        [null, null, null, null, 1, 3, 10],
        [null, null, null, null, null, 2, 9],
        [null, null, null, null, null, 2, 8],
        [null, null, null, null, null, 1, 7],
        [null, null, null, null, null, 1, 6],
        [null, null, null, null, null, null, 5],
        [null, null, null, null, null, null, 4],
        [null, null, null, null, null, null, 3],
        [null, null, null, null, null, null, 2],
      ],
    },
  },
  {
    season: '2026',
    category: 'P100',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [100, 100, 100, 100, 100, 100, 100],
        [80, 80, 80, 85, 85, 85, 85],
        [60, 65, 70, 75, 75, 75, 75],
        [40, 55, 60, 70, 70, 70, 70],
        [25, 40, 50, 60, 60, 60, 60],
        [10, 30, 45, 55, 55, 55, 58],
        [5, 20, 40, 50, 50, 50, 56],
        [1, 10, 30, 45, 45, 45, 54],
        [null, 5, 25, 35, 38, 38, 45],
        [null, 3, 21, 30, 36, 36, 43],
        [null, 2, 18, 25, 34, 34, 41],
        [null, 1, 15, 23, 32, 32, 39],
        [null, null, 10, 20, 30, 30, 37],
        [null, null, 5, 18, 28, 28, 35],
        [null, null, 3, 15, 26, 26, 33],
        [null, null, 1, 12, 24, 24, 31],
        [null, null, null, 10, 20, 20, 27],
        [null, null, null, 5, 18, 18, 26],
        [null, null, null, 3, 15, 16, 25],
        [null, null, null, 1, 12, 14, 24],
        [null, null, null, null, 10, 12, 23],
        [null, null, null, null, 5, 10, 22],
        [null, null, null, null, 3, 8, 21],
        [null, null, null, null, 1, 6, 20],
        [null, null, null, null, null, 4, 17],
        [null, null, null, null, null, 3, 15],
        [null, null, null, null, null, 2, 13],
        [null, null, null, null, null, 1, 11],
        [null, null, null, null, null, null, 9],
        [null, null, null, null, null, null, 7],
        [null, null, null, null, null, null, 5],
        [null, null, null, null, null, null, 3],
      ],
    },
  },
  {
    season: '2026',
    category: 'P250',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [250, 250, 250, 250, 250, 250, 250],
        [200, 200, 200, 213, 213, 213, 213],
        [150, 165, 175, 188, 188, 188, 188],
        [100, 140, 150, 175, 175, 175, 175],
        [63, 100, 125, 150, 150, 150, 150],
        [25, 75, 115, 138, 138, 138, 145],
        [13, 50, 100, 125, 125, 125, 140],
        [3, 25, 75, 113, 113, 113, 135],
        [null, 13, 63, 88, 95, 95, 113],
        [null, 8, 53, 75, 90, 90, 108],
        [null, 5, 45, 63, 85, 85, 103],
        [null, 3, 38, 58, 80, 80, 98],
        [null, null, 25, 50, 75, 75, 93],
        [null, null, 13, 45, 70, 70, 88],
        [null, null, 8, 38, 65, 65, 83],
        [null, null, 3, 30, 60, 60, 78],
        [null, null, null, 25, 50, 50, 68],
        [null, null, null, 13, 45, 45, 65],
        [null, null, null, 8, 38, 40, 63],
        [null, null, null, 3, 30, 35, 60],
        [null, null, null, null, 25, 30, 58],
        [null, null, null, null, 13, 25, 55],
        [null, null, null, null, 8, 20, 53],
        [null, null, null, null, 3, 15, 50],
        [null, null, null, null, null, 10, 43],
        [null, null, null, null, null, 8, 38],
        [null, null, null, null, null, 5, 33],
        [null, null, null, null, null, 3, 28],
        [null, null, null, null, null, null, 23],
        [null, null, null, null, null, null, 18],
        [null, null, null, null, null, null, 13],
        [null, null, null, null, null, null, 8],
      ],
    },
  },
  {
    season: '2026',
    category: 'P500',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [500, 500, 500, 500, 500, 500, 500],
        [400, 400, 400, 425, 425, 425, 425],
        [300, 325, 350, 375, 375, 375, 375],
        [200, 275, 300, 350, 350, 350, 350],
        [125, 200, 250, 300, 300, 300, 300],
        [50, 150, 225, 275, 275, 275, 290],
        [25, 100, 200, 250, 250, 250, 280],
        [5, 50, 150, 225, 225, 225, 270],
        [null, 25, 125, 175, 190, 190, 225],
        [null, 15, 105, 150, 180, 180, 215],
        [null, 10, 90, 125, 170, 170, 205],
        [null, 5, 75, 115, 160, 160, 195],
        [null, null, 50, 100, 150, 150, 185],
        [null, null, 25, 90, 140, 140, 175],
        [null, null, 15, 75, 130, 130, 165],
        [null, null, 5, 60, 120, 120, 155],
        [null, null, null, 50, 100, 100, 135],
        [null, null, null, 25, 90, 90, 130],
        [null, null, null, 15, 75, 80, 125],
        [null, null, null, 5, 60, 70, 120],
        [null, null, null, null, 50, 60, 115],
        [null, null, null, null, 25, 50, 110],
        [null, null, null, null, 15, 40, 105],
        [null, null, null, null, 5, 30, 100],
        [null, null, null, null, null, 20, 85],
        [null, null, null, null, null, 15, 75],
        [null, null, null, null, null, 10, 65],
        [null, null, null, null, null, 5, 55],
        [null, null, null, null, null, null, 45],
        [null, null, null, null, null, null, 35],
        [null, null, null, null, null, null, 25],
        [null, null, null, null, null, null, 15],
      ],
    },
  },
  {
    season: '2026',
    category: 'P1000',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 : grille P1000 non vérifiée (tableau image non exploitable dans le PDF officiel)',
    grid: { kind: 'brackets', brackets: BRACKETS, rows: [] },
  },
  {
    season: '2026',
    category: 'P1500',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: ['21-24', '25-28', '29-32+'],
      rows: [
        [1500, 1500, 1500],
        [1125, 1200, 1200],
        [1050, 1125, 1125],
        [975, 1050, 1080],
        [900, 975, 1050],
        [825, 900, 975],
        [750, 825, 945],
        [705, 795, 900],
        [645, 750, 870],
        [600, 720, 825],
        [555, 675, 795],
        [495, 645, 750],
        [450, 600, 720],
        [420, 570, 675],
        [375, 525, 645],
        [345, 495, 600],
        [300, 450, 570],
        [270, 420, 525],
        [225, 375, 495],
        [180, 345, 450],
        [150, 300, 420],
        [75, 270, 375],
        [45, 225, 345],
        [15, 180, 300],
        [null, 150, 270],
        [null, 75, 225],
        [null, 45, 180],
        [null, 15, 150],
        [null, null, 120],
        [null, null, 75],
        [null, null, 45],
        [null, null, 15],
      ],
    },
  },
  {
    season: '2026',
    category: 'P2000',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 (à compter du 01/03/2026)',
    grid: {
      kind: 'brackets',
      brackets: ['21-24', '25-28', '29-32+'],
      rows: [
        [2000, 2000, 2000],
        [1500, 1600, 1600],
        [1400, 1500, 1500],
        [1300, 1400, 1440],
        [1200, 1300, 1400],
        [1100, 1200, 1300],
        [1000, 1100, 1260],
        [940, 1060, 1200],
        [860, 1000, 1160],
        [800, 960, 1100],
        [740, 900, 1060],
        [660, 860, 1000],
        [600, 800, 960],
        [560, 760, 900],
        [500, 700, 860],
        [460, 660, 800],
        [400, 600, 760],
        [360, 560, 700],
        [300, 500, 660],
        [240, 460, 600],
        [200, 400, 560],
        [100, 360, 500],
        [60, 300, 460],
        [20, 240, 400],
        [null, 200, 360],
        [null, 100, 300],
        [null, 60, 240],
        [null, 20, 200],
        [null, null, 160],
        [null, null, 100],
        [null, null, 60],
        [null, null, 20],
      ],
    },
  },
  {
    season: '2026',
    category: 'P3000',
    source: 'Guide compétition padel — Chapitre II, MAJ février 2026 : Championnats de France Seniors par paires (le dernier match de classement du dimanche n’ayant pas été disputé, toutes les paires sont classées en position haute)',
    grid: {
      kind: 'unique',
      // Rangs selectifs 1,2,3,5,7,9,11,... — rangs pairs intermédiaires ex æquo classement haut
      messieurs: uniqueWithGaps([3000, 2400, 2160, 1770, 1590, 1320, 1200, 1080, 960, 810, 750, 690, 630, 480, 420, 360, 315], [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31], 32),
      dames: uniqueWithGaps([3000, 2400, 2160, 1770, 1590, 1320, 1200, 1080, 960, 810, 750, 690, 630, 480, 420, 360, 315], [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31], 32),
    },
  },
]

/* ------------------------------------------------------------------ */
/* SAISON 2027 (à compter du 01/09/2026) — guide publication juillet 2026 */
/* ------------------------------------------------------------------ */

export const S2027: CategoryRule[] = [
  {
    season: '2027',
    category: 'P25',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [25, 25, 25, 25, 25, 25, 25],
        [20, 20, 20, 22, 22, 22, 22],
        [15, 16, 17, 19, 19, 19, 19],
        [9, 14, 15, 17, 17, 17, 17],
        [6, 10, 14, 15, 15, 15, 15],
        [4, 8, 13, 13, 13, 13, 14],
        [2, 7, 12, 12, 12, 12, 13],
        [1, 6, 11, 11, 11, 11, 12],
        [null, 4, 8, 9, 9, 8, 10],
        [null, 3, 7, 8, 8, 7, 9],
        [null, 2, 6, 7, 7, 6, 8],
        [null, 1, 5, 6, 6, 5, 7],
        [null, null, 4, 5, 5, 4, 6],
        [null, null, 3, 4, 5, 4, 5],
        [null, null, 2, 3, 5, 4, 4],
        [null, null, 1, 2, 5, 4, 3],
        [null, null, null, 1, 4, 3, 2],
        [null, null, null, 1, 4, 3, 2],
        [null, null, null, 1, 3, 3, 2],
        [null, null, null, 1, 3, 3, 2],
        [null, null, null, null, 2, 2, 2],
        [null, null, null, null, 2, 2, 2],
        [null, null, null, null, 1, 2, 2],
        [null, null, null, null, 1, 2, 1],
        [null, null, null, null, null, 1, 1],
        [null, null, null, null, null, 1, 1],
        [null, null, null, null, null, 1, 1],
        [null, null, null, null, null, 1, 1],
        [null, null, null, null, null, null, 1],
        [null, null, null, null, null, null, 1],
        [null, null, null, null, null, null, 1],
        [null, null, null, null, null, null, 1],
      ],
    },
  },
  {
    season: '2027',
    category: 'P50',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [50, 50, 50, 50, 50, 50, 50],
        [40, 40, 40, 43, 43, 43, 43],
        [30, 33, 35, 38, 38, 38, 38],
        [20, 28, 30, 35, 35, 35, 35],
        [13, 20, 25, 30, 30, 30, 30],
        [5, 15, 23, 28, 28, 28, 29],
        [3, 10, 20, 25, 25, 25, 28],
        [1, 5, 15, 23, 23, 23, 27],
        [null, 3, 13, 18, 19, 19, 23],
        [null, 2, 11, 15, 18, 18, 22],
        [null, 1, 9, 13, 17, 17, 21],
        [null, 1, 8, 12, 16, 16, 20],
        [null, null, 5, 10, 15, 15, 19],
        [null, null, 3, 9, 14, 14, 18],
        [null, null, 2, 8, 13, 13, 17],
        [null, null, 1, 6, 12, 12, 16],
        [null, null, null, 5, 10, 10, 14],
        [null, null, null, 3, 9, 9, 13],
        [null, null, null, 2, 8, 8, 13],
        [null, null, null, 1, 6, 7, 12],
        [null, null, null, null, 5, 6, 12],
        [null, null, null, null, 3, 5, 11],
        [null, null, null, null, 2, 4, 11],
        [null, null, null, null, 1, 3, 10],
        [null, null, null, null, null, 2, 9],
        [null, null, null, null, null, 2, 8],
        [null, null, null, null, null, 1, 7],
        [null, null, null, null, null, 1, 6],
        [null, null, null, null, null, null, 5],
        [null, null, null, null, null, null, 4],
        [null, null, null, null, null, null, 3],
        [null, null, null, null, null, null, 2],
      ],
    },
  },
  {
    season: '2027',
    category: 'P100',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [100, 100, 100, 100, 100, 100, 100],
        [80, 80, 80, 85, 85, 85, 85],
        [60, 65, 70, 75, 75, 75, 75],
        [40, 55, 60, 70, 70, 70, 70],
        [25, 40, 50, 60, 60, 60, 60],
        [10, 30, 45, 55, 55, 55, 58],
        [5, 20, 40, 50, 50, 50, 56],
        [1, 10, 30, 45, 45, 45, 54],
        [null, 5, 25, 35, 38, 38, 45],
        [null, 3, 21, 30, 36, 36, 43],
        [null, 2, 18, 25, 34, 34, 41],
        [null, 1, 15, 23, 32, 32, 39],
        [null, null, 10, 20, 30, 30, 37],
        [null, null, 5, 18, 28, 28, 35],
        [null, null, 3, 15, 26, 26, 33],
        [null, null, 1, 12, 24, 24, 31],
        [null, null, null, 10, 20, 20, 27],
        [null, null, null, 5, 18, 18, 26],
        [null, null, null, 3, 15, 16, 25],
        [null, null, null, 1, 12, 14, 24],
        [null, null, null, null, 10, 12, 23],
        [null, null, null, null, 5, 10, 22],
        [null, null, null, null, 3, 8, 21],
        [null, null, null, null, 1, 6, 20],
        [null, null, null, null, null, 4, 17],
        [null, null, null, null, null, 3, 15],
        [null, null, null, null, null, 2, 13],
        [null, null, null, null, null, 1, 11],
        [null, null, null, null, null, null, 9],
        [null, null, null, null, null, null, 7],
        [null, null, null, null, null, null, 5],
        [null, null, null, null, null, null, 3],
      ],
    },
  },
  {
    season: '2027',
    category: 'P250',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'brackets',
      brackets: BRACKETS,
      rows: [
        [250, 250, 250, 250, 250, 250, 250],
        [200, 200, 200, 213, 213, 213, 213],
        [150, 165, 175, 188, 188, 188, 188],
        [100, 140, 150, 175, 175, 175, 175],
        [63, 100, 125, 150, 150, 150, 150],
        [25, 75, 115, 138, 138, 138, 145],
        [13, 50, 100, 125, 125, 125, 140],
        [3, 25, 75, 113, 113, 113, 135],
        [null, 13, 63, 88, 95, 95, 113],
        [null, 8, 53, 75, 90, 90, 108],
        [null, 5, 45, 63, 85, 85, 103],
        [null, 3, 38, 58, 80, 80, 98],
        [null, null, 25, 50, 75, 75, 93],
        [null, null, 13, 45, 70, 70, 88],
        [null, null, 8, 38, 65, 65, 83],
        [null, null, 3, 30, 60, 60, 78],
        [null, null, null, 25, 50, 50, 68],
        [null, null, null, 13, 45, 45, 65],
        [null, null, null, 8, 38, 40, 63],
        [null, null, null, 3, 30, 35, 60],
        [null, null, null, null, 25, 30, 58],
        [null, null, null, null, 13, 25, 55],
        [null, null, null, null, 8, 20, 53],
        [null, null, null, null, 3, 15, 50],
        [null, null, null, null, null, 10, 43],
        [null, null, null, null, null, 8, 38],
        [null, null, null, null, null, 5, 33],
        [null, null, null, null, null, 3, 28],
        [null, null, null, null, null, null, 23],
        [null, null, null, null, null, null, 18],
        [null, null, null, null, null, null, 13],
        [null, null, null, null, null, null, 8],
      ],
    },
  },
  {
    season: '2027',
    category: 'P500',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027) : grille unique par tableau (messieurs / dames)',
    grid: {
      kind: 'unique',
      messieurs: {
        kind: 'unique',
        rows: [
          500, 425, 375, 350, 300, 290, 280, 270, 225, 215, 205, 195, 185, 175, 165, 155, 135, 130, 125, 120, 115, 110, 105, 100, 85, 75, 65, 55, 45, 35, 25, 15,
        ],
      },
      dames: {
        kind: 'unique',
        rows: [
          500, 425, 375, 350, 300, 275, 250, 225, 190, 180, 170, 160, 150, 140, 130, 120, 100, 90, 80, 70, 60, 50, 40, 30, 20,
        ],
        capIndex: 24,
        capLabel: '25 et plus',
      },
    },
  },
  {
    season: '2027',
    category: 'P1000',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027) : grille unique par tableau (messieurs / dames)',
    grid: {
      kind: 'unique',
      messieurs: {
        kind: 'unique',
        rows: [
          1000, 850, 750, 700, 600, 580, 560, 540, 450, 430, 410, 390, 370, 350, 330, 310, 270, 260, 250, 240, 230, 220, 210, 200, 170, 150, 130, 110, 90, 70, 50, 30,
        ],
      },
      dames: {
        kind: 'unique',
        rows: [1000, 850, 750, 700, 600, 550, 500, 450, 380, 360, 340, 320, 300, 280, 260, 240, 200, 180, 160, 140, 120, 100, 80, 60, 40],
        capIndex: 24,
        capLabel: '25 et plus',
      },
    },
  },
  {
    season: '2027',
    category: 'P2000',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'unique',
      messieurs: {
        kind: 'unique',
        rows: [
          2000, 1700, 1500, 1400, 1200, 1160, 1120, 1080, 900, 860, 820, 780, 740, 700, 660, 620, 540, 520, 500, 480, 460, 440, 420, 400, 340, 300, 260, 220, 180, 140, 100, 60,
        ],
      },
      dames: {
        kind: 'unique',
        rows: [
          2000, 1700, 1500, 1400, 1200, 1160, 1120, 1080, 900, 860, 820, 780, 740, 700, 660, 620, 540, 520, 500, 480, 460, 440, 420, 400, 340, 300, 260, 220, 180, 140, 100, 60,
        ],
      },
    },
  },
  {
    season: '2027',
    category: 'P3000',
    source: 'Guide compétition padel — Chapitre II, publication juillet 2026 (saison 2027)',
    grid: {
      kind: 'unique',
      messieurs: {
        kind: 'unique',
        rows: [
          3000, 2550, 2250, 2100, 1800, 1740, 1680, 1620, 1350, 1290, 1230, 1170, 1110, 1050, 990, 930, 810, 780, 750, 720, 690, 660, 630, 600, 510, 450, 390, 330, 270, 210, 150, 90,
        ],
      },
      dames: {
        kind: 'unique',
        rows: [
          3000, 2550, 2250, 2100, 1800, 1740, 1680, 1620, 1350, 1290, 1230, 1170, 1110, 1050, 990, 930, 810, 780, 750, 720, 690, 660, 630, 600, 510, 450, 390, 330, 270, 210, 150, 90,
        ],
      },
    },
  },
]

/** Construction d'une grille avec rangs « selectifs » (Championnats de France Seniors P3000) :
 *  les paires ex æquo classées entre deux rangs connus prennent le rang le moins avantageux. */
export function uniqueWithGaps(values: number[], ranks: number[], size: number): GridUnique {
  const rows: number[] = []
  let k = 0
  for (let r = 1; r <= size; r++) {
    if (k + 1 < ranks.length && r === ranks[k + 1]) {
      rows.push(values[k])
      k++
    } else {
      rows.push(values[0])
    }
  }
  return { kind: 'unique', rows }
}

/* ------------------------------------------------------------------ */
/* Cuts (limitations de classement) — information                       */
/* ------------------------------------------------------------------ */

export type CutInfo = { category: string; season: Season; messieurs?: string; dames?: string; mixte?: string }

export const CUTS: CutInfo[] = [
  { category: 'P25', season: '2027', messieurs: 'Interdit au top 30.000 inclus', dames: 'Interdit au top 3.000 inclus', mixte: 'Interdit top 30.000 M inclus / top 3.000 D inclus' },
  { category: 'P50', season: '2027', messieurs: 'Interdit au top 10.000 inclus', dames: 'Interdit au top 1.000 inclus', mixte: 'Interdit top 10.000 M inclus / top 1.000 D inclus' },
  { category: 'P100', season: '2027', messieurs: 'Interdit au top 5.000 inclus', dames: 'Interdit au top 500 inclus', mixte: 'Interdit top 5.000 M inclus / top 500 D inclus' },
  { category: 'P250', season: '2027', messieurs: 'Interdit au top 1.000 inclus', dames: 'Interdit au top 100 inclus', mixte: 'Pas de limitation' },
  { category: 'P25', season: '2026', messieurs: 'Interdit au top 30.000 inclus', dames: 'Interdit au top 3.000 inclus', mixte: 'Interdit top 30.000 M inclus / top 3.000 D inclus' },
  { category: 'P50', season: '2026', messieurs: 'Interdit au top 10.000 inclus', dames: 'Interdit au top 1.000 inclus', mixte: 'Interdit top 10.000 M inclus / top 1.000 D inclus' },
  { category: 'P100', season: '2026', messieurs: 'Interdit au top 3.000 inclus', dames: 'Interdit au top 300 inclus', mixte: 'Interdit top 3.000 M inclus / top 300 D inclus' },
  { category: 'P250', season: '2026', messieurs: 'Interdit au top 800 inclus', dames: 'Interdit au top 100 inclus', mixte: 'Interdit top 800 M inclus / top 100 D inclus' },
]

export function rulesBySeason(season: Season): CategoryRule[] {
  return season === '2026' ? S2026 : S2027
}

export function ruleFor(season: Season, category: string): CategoryRule | undefined {
  return rulesBySeason(season).find((r) => r.category === category)
}

export const SOURCE_DOC = {
  doc2026: 'LE GUIDE DE LA COMPÉTITION PADEL — Chapitre II (MAJ février 2026), barèmes applicables à partir du 01/03/2026',
  doc2027: 'LE GUIDE DE LA COMPÉTITION PADEL — Chapitre II (publication juillet 2026), saison 2027 applicable à partir du 01/09/2026',
  seasonNote: 'Saison sportive 2027 : du 01/09/2026 au 31/08/2027. Le classement est publié le 1er mardi de chaque mois et retient les 12 meilleurs résultats sur les 12 derniers mois.',
}
