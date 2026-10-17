import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings } from './db/db'
import type { Tournament } from './types'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/Calendar'
import Tournaments from './pages/Tournaments'
import Partners from './pages/Partners'
import RankingPage from './pages/Ranking'
import Finance from './pages/Finance'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import { TournamentModal } from './components/TournamentModal'
import { Onboarding } from './components/Onboarding'

export type TabId =
  | 'dashboard'
  | 'calendar'
  | 'tournaments'
  | 'partners'
  | 'ranking'
  | 'finance'
  | 'stats'
  | 'settings'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '◉' },
  { id: 'calendar', label: 'Calendrier', icon: '🗓' },
  { id: 'tournaments', label: 'Tournois', icon: '🏆' },
  { id: 'partners', label: 'Partenaires', icon: '👥' },
  { id: 'ranking', label: 'Classement', icon: '📈' },
  { id: 'finance', label: 'Finances', icon: '💰' },
  { id: 'stats', label: 'Statistiques', icon: '📊' },
  { id: 'settings', label: 'Paramètres', icon: '⚙' },
]

export default function App() {
  const [tab, setTabRaw] = useState<TabId>(() => (localStorage.getItem('pt.tab') as TabId) || 'dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string | undefined>()
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    localStorage.setItem('pt.tab', tab)
    window.scrollTo({ top: 0 })
  }, [tab])

  useEffect(() => {
    getSettings().then((s) => {
      if (!s.onboardingDone) setOnboarding(true)
    })
  }, [])

  const [editId, setEditId] = useState<string | undefined>(undefined)

  const openTournament = (date?: string) => {
    if (date) setModalDate(date)
    else setModalDate(undefined)
    setModalOpen(true)
  }
  const setTab = (t: TabId) => setTabRaw(t)

  const nextTournaments = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const all = await db.tournaments.toArray()
    return all
      .filter((t) => !['joue', 'annule'].includes(t.status) && t.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, []) as Tournament[] | undefined

  const page = (() => {
    switch (tab) {
      case 'calendar':
        return <CalendarPage onOpenCreate={openTournament} onGoTournaments={() => setTab('tournaments')} />
      case 'tournaments':
        return (
          <Tournaments
            onOpenCreate={() => openTournament()}
            onEdit={(t) => {
              setModalDate(undefined)
              setModalOpen(true)
              setEditId(t.id)
            }}
          />
        )
      case 'partners':
        return <Partners />
      case 'ranking':
        return <RankingPage />
      case 'finance':
        return <Finance />
      case 'stats':
        return <Stats />
      case 'settings':
        return <Settings />
      default:
        return (
          <Dashboard
            nextTournaments={nextTournaments ?? []}
            onOpenCreate={() => openTournament()}
            onGoCalendar={() => setTab('calendar')}
            onGoRanking={() => setTab('ranking')}
            onGoFinance={() => setTab('finance')}
            onGoPartners={() => setTab('partners')}
            onOpenTournament={(tid) => {
              setTab('tournaments')
              setEditId(tid)
              setModalOpen(true)
            }}
          />
        )
    }
  })()

  return (
    <div className="flex min-h-screen">
      {/* Navigation desktop */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-panel/70 p-4 md:flex">
        <div className="mb-6 mt-2 flex items-center gap-2 px-2">
          <span className="text-2xl">🎾</span>
          <span className="text-lg font-extrabold tracking-tight">
            Padel<span className="text-lime-400">Track</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === tb.id ? 'bg-lime-400/15 text-lime-300' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="mr-2" aria-hidden>
                {tb.icon.replace(' voyage', '')}
              </span>
              {tb.label}
            </button>
          ))}
        </nav>
        <button className="btn-primary w-full" onClick={() => openTournament()}>
          + Tournoi
        </button>
      </aside>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel/90 px-4 py-3 backdrop-blur md:px-8">
          <span className="text-base font-bold md:hidden">
            Padel<span className="text-lime-400">Track</span>
          </span>
          <span className="hidden text-sm text-slate-400 md:block">{TABS.find((tb) => tb.id === tab)?.label}</span>
          <button className="btn-primary !px-3 !py-2" onClick={() => openTournament()} aria-label="Ajouter un tournoi">
            + Ajouter un tournoi
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-28 pt-4 md:px-8 md:pb-10">{page}</main>
      </div>

      {/* Navigation mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navigation mobile"
      >
        {TABS.filter((tb) => tb.id !== 'settings').map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              tab === tb.id ? 'text-lime-300' : 'text-slate-400'
            }`}
            aria-current={tab === tb.id ? 'page' : undefined}
          >
            <span className="text-base" aria-hidden>
              {tb.icon.replace(' voyage', '')}
            </span>
            {tb.label.split(' ')[0]}
          </button>
        ))}
      </nav>

      {modalOpen && (
        <TournamentModal
          open={modalOpen}
          openDate={modalDate}
          editId={editId}
          onClose={() => {
            setModalOpen(false)
            setEditId(undefined)
          }}
        />
      )}
      {onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
    </div>
  )
}
