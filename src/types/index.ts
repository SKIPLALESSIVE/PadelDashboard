// Types métier PadelTrack

export type TCategory = 'P25' | 'P50' | 'P100' | 'P250' | 'P500' | 'P1000' | 'P1500' | 'P2000' | 'P3000'

export const CATEGORIES: Record<TCategory, string> = {
  P3000: 'P3000',
  P2000: 'P2000',
  P1500: 'P1500',
  P1000: 'P1000',
  P500: 'P500',
  P250: 'P250',
  P100: 'P100',
  P50: 'P50',
  P25: 'P25',
}

export type TGender = 'messieurs' | 'dames' | 'mixte'

export type TournamentStatus =
  | 'envisage'
  | 'a_confirmer'
  | 'liste_attente'
  | 'inscrit'
  | 'joue'
  | 'annule'

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  envisage: 'Envisagé',
  a_confirmer: 'À confirmer',
  liste_attente: 'Liste d\u2019attente',
  inscrit: 'Inscrit',
  joue: 'Joué',
  annule: 'Annulé',
}

export const STATUS_ORDER: TournamentStatus[] = [
  'envisage',
  'a_confirmer',
  'liste_attente',
  'inscrit',
  'joue',
  'annule',
]

export type TPosition = 'droite' | 'gauche' | 'alternee' | 'inconnue'

export const POSITION_LABELS: Record<TPosition, string> = {
  droite: 'Droite',
  gauche: 'Gauche',
  alternee: 'Alternée',
  inconnue: 'Inconnue',
}

export type ExpenseKind =
  | 'inscription'
  | 'transport'
  | 'piste'
  | 'balles'
  | 'repas'
  | 'hebergement'
  | 'autre'

export const EXPENSE_KINDS: { id: ExpenseKind; label: string }[] = [
  { id: 'inscription', label: 'Inscription' },
  { id: 'transport', label: 'Transport' },
  { id: 'piste', label: 'Location de piste' },
  { id: 'balles', label: 'Balles' },
  { id: 'repas', label: 'Repas' },
  { id: 'hebergement', label: 'Hébergement' },
  { id: 'autre', label: 'Autre' },
]

export type ExpenseMode = 'prevu' | 'paye'

/** Une dépense en centimes entiers. mode 'prevu' | 'paye' (jamais additionnés). */
export interface Expense {
  id: string
  kind: ExpenseKind
  mode: ExpenseMode
  /** montant en centimes */
  amount: number
  /** date de paiement optionnelle */
  paidOn?: string // ISO yyyy-MM-dd
}

export type PointComputedStatus =
  | 'ok' // calcul fiable
  | 'override' // override manuel (avec valeur calculée conservée)
  | 'impossible' // calcul impossible (données manquantes ou règle non vérifiée)

export interface FftResult {
  status: PointComputedStatus
  /** points obtenus si 'ok' ou 'override' */
  points?: number
  /** valeur calculée (avant override) conservée */
  computedPoints?: number
  /** libellé du barème appliqué (saison, grille, source) */
  grilleLabel?: string
  /** motif si 'impossible' */
  reason?: string
}

export interface Tournament {
  id: string
  name: string
  /** ISO yyyy-MM-dd */
  date: string
  /** ISO yyyy-MM-dd optional (plage) */
  endDate?: string
  /** horaire facultatif 'HH:mm' */
  time?: string
  category: TCategory | ''
  gender: TGender
  club: string
  city: string
  link?: string
  note?: string
  partnerId?: string
  position: TPosition
  status: TournamentStatus
  /** nombre effectif de paires du tableau */
  pairs?: number
  /** place finale de la paire (le rang d'ex æquo retenu par la FFT) */
  place?: number
  matchesPlayed?: number
  wins?: number
  losses?: number
 fftResult?: FftResult
  expenses: Expense[]
  createdAt: string
  updatedAt: string
}

export interface Partner {
  id: string
  name: string
  /** classement connu : rang + date de connaissance + tableau */
  rankingRank?: number
  rankingDate?: string
  rankingTable?: 'messieurs' | 'dames' | 'NC'
  strongHand?: 'droite' | 'gauche'
  usualPosition: 'droite' | 'gauche' | 'flexible'
  phone?: string
  email?: string
  notes?: string
  favorite?: boolean
  createdAt: string
  updatedAt: string
}

export type AvailabilityState = 'disponible' | 'indisponible' | 'a_confirmer' | ''

export interface Availability {
  /** ISO yyyy-MM-dd, PK */
  date: string
  state: AvailabilityState
  note?: string
}

export type NonTournamentKind =
  | 'entrainement'
  | 'cours'
  | 'amical'
  | 'repos'
  | 'stage'
  | 'deplacement'

export const EVENT_KINDS: { id: NonTournamentKind; label: string; emoji: string }[] = [
  { id: 'entrainement', label: 'Entraînement', emoji: '🏏' },
  { id: 'cours', label: 'Cours', emoji: '🎓' },
  { id: 'amical', label: 'Match amical', emoji: '🤝' },
  { id: 'repos', label: 'Repos', emoji: '😴' },
  { id: 'stage', label: 'Stage', emoji: '🏔' },
  { id: 'deplacement', label: 'Déplacement', emoji: '🚗' },
]

export interface CalendarEvent {
  id: string
  /** ISO yyyy-MM-dd */
  date: string
  kind: NonTournamentKind
  label: string
  note?: string
  time?: string
  /** coût de la séance en centimes (cours, entraînement payant, partie, stage…) */
  cost?: number
  /** la séance est-elle payée ? sinon = prévu (dans le budget mais non réglé) */
  paid?: boolean
}

export interface OfficialRanking {
  id: string
  /** date du mois (yyyy-MM-dd, ex. 1er mardi du mois) */
  date: string
  rank: number
  points: number
  /** provenance : saisie manuelle (ex. Ten'Up) */
  source: 'saisie_manuelle'
  note?: string
}

export interface Settings {
  id: string // toujours 'app'
  playerName: string
  /** année de naissance ? pas indispensable MVP */
  budgetMonthly: number // centimes, 0 = non paramétré
  budgetYear: number
  onboardingDone: boolean
  /** année sélectionnée par défaut (2026 | 2027) */
  viewYear: number
  /** code du dernier onglet ouvert */
  lastTab?: string
}

export type ExportFormatVersion = 1

export interface Backup {
  format: 'padeltrack-backup'
  version: ExportFormatVersion
  exportedAt: string
  settings: Settings
  tournaments: Tournament[]
  partners: Partner[]
  availabilities: Availability[]
  events: CalendarEvent[]
  officialRankings: OfficialRanking[]
}
