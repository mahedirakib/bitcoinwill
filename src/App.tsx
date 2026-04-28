import { useState, useEffect, useRef, lazy, Suspense, startTransition } from 'react'
import DevPlayground from './components/DevPlayground'
import type { InstructionData } from './features/will-creator/WillCreatorWizard'
import { SettingsProvider } from './state/settings'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { PageLoading } from './components/Loading'
import { AppShell, type NavView } from './components/AppShell'
import { Home } from './pages/Home'
import type { PlanInput, PlanOutput } from './lib/bitcoin/types'

type AppView = NavView | 'dev'
const DEV_VIEW_ENABLED = import.meta.env.DEV

const loadWillCreatorWizard = () => import('./features/will-creator/WillCreatorWizard')
const loadLearnPage = () => import('./pages/Learn')
const loadInstructionsPage = () => import('./pages/Instructions')
const loadProtocolPage = () => import('./pages/Protocol')
const loadWhitepaperPage = () => import('./pages/Whitepaper')

const WillCreatorWizard = lazy(async () => {
  const module = await loadWillCreatorWizard()
  return { default: module.WillCreatorWizard }
})
const Learn = lazy(loadLearnPage)
const Instructions = lazy(loadInstructionsPage)
const Protocol = lazy(loadProtocolPage)
const Whitepaper = lazy(loadWhitepaperPage)

const preloadedViews = new Set<AppView>()
const VIEW_PRELOADERS: Partial<Record<AppView, () => Promise<unknown>>> = {
  create: loadWillCreatorWizard,
  learn: loadLearnPage,
  instructions: loadInstructionsPage,
  recover: loadInstructionsPage,
  protocol: loadProtocolPage,
  whitepaper: loadWhitepaperPage,
}

const preloadView = (view: AppView) => {
  const loader = VIEW_PRELOADERS[view]
  if (!loader || preloadedViews.has(view)) return

  preloadedViews.add(view)
  void loader().catch(() => {
    preloadedViews.delete(view)
  })
}

const normalizeAppPath = (pathname: string): string => {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  let path = pathname

  if (normalizedBase && normalizedBase !== '/' && pathname.startsWith(normalizedBase)) {
    path = pathname.slice(normalizedBase.length) || '/'
  }

  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }

  return path || '/'
}

const viewFromPath = (pathname: string): AppView => {
  const path = normalizeAppPath(pathname)
  if (path === '/dev') return DEV_VIEW_ENABLED ? 'dev' : 'home'
  if (path === '/protocol') return 'protocol'
  if (path === '/whitepaper') return 'whitepaper'
  if (path === '/learn') return 'learn'
  if (path === '/instructions') return 'instructions'
  if (path === '/create') return 'create'
  if (path === '/recover') return 'recover'
  if (path === '/vaults') return 'vaults'
  return 'home'
}

const pathFromView = (view: AppView): string => {
  if (view === 'dev') return DEV_VIEW_ENABLED ? '/dev' : '/'
  if (view === 'home') return '/'
  return `/${view}`
}

const TITLES: Record<NavView, { title: string; subtitle?: string }> = {
  home:         { title: 'Home',          subtitle: 'Non-custodial Bitcoin inheritance planning' },
  create:       { title: 'Create plan' },
  recover:      { title: 'Recover',       subtitle: 'Inspect a vault or broadcast a recovery transaction' },
  vaults:       { title: 'My vaults' },
  learn:        { title: 'Learn' },
  protocol:     { title: 'Protocol' },
  instructions: { title: 'Instructions' },
  whitepaper:   { title: 'TIP Whitepaper' },
}

const AppContent = () => {
  const [activeView, setActiveView] = useState<AppView>(() => viewFromPath(window.location.pathname))
  const historyActionRef = useRef<'push' | 'replace'>('replace')
  const [instructionData, setInstructionData] = useState<InstructionData | undefined>(undefined)
  const [forceQaCrash, setForceQaCrash] = useState(false)

  if (forceQaCrash) {
    throw new Error('Forced QA crash to validate ErrorBoundary fallback UI.')
  }

  const navigateTo = (view: AppView, action: 'push' | 'replace' = 'push') => {
    historyActionRef.current = action
    preloadView(view)
    startTransition(() => {
      setActiveView(view)
    })
  }

  useEffect(() => {
    const handlePopstate = () => setActiveView(viewFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  useEffect(() => {
    const currentPath = normalizeAppPath(window.location.pathname)
    const nextPath = pathFromView(activeView)
    const historyAction = historyActionRef.current
    if (currentPath !== nextPath) {
      const base = import.meta.env.BASE_URL || '/'
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
      const fullPath = `${normalizedBase}${nextPath === '/' ? '' : nextPath}` || '/'
      if (historyAction === 'replace') {
        window.history.replaceState(null, '', fullPath)
      } else {
        window.history.pushState(null, '', fullPath)
      }
    }
    historyActionRef.current = 'push'
  }, [activeView])

  if (activeView === 'dev' && DEV_VIEW_ENABLED) return <DevPlayground />

  const meta = TITLES[activeView as NavView] ?? TITLES.home

  return (
    <AppShell
      active={activeView as NavView}
      onNavigate={(v) => navigateTo(v)}
      topbar={meta}
    >
      <Suspense fallback={<PageLoading />}>
        {activeView === 'home' && <Home onNavigate={(v) => navigateTo(v)} />}

        {activeView === 'create' && (
          <WillCreatorWizard
            onCancel={() => navigateTo('home', 'replace')}
            onViewInstructions={(data) => {
              setInstructionData(data as { plan: PlanInput; result: PlanOutput; created_at?: string })
              navigateTo('instructions')
            }}
          />
        )}

        {activeView === 'learn' && (
          <Learn onBack={() => navigateTo('home', 'replace')} />
        )}

        {activeView === 'protocol' && (
          <Protocol
            onBack={() => navigateTo('home', 'replace')}
            onOpenWhitepaper={() => navigateTo('whitepaper')}
          />
        )}

        {activeView === 'whitepaper' && (
          <Whitepaper onBack={() => navigateTo('home', 'replace')} />
        )}

        {(activeView === 'instructions' || activeView === 'recover') && (
          <Instructions
            initialData={instructionData}
            onBack={() => {
              setInstructionData(undefined)
              navigateTo('home', 'replace')
            }}
          />
        )}

        {activeView === 'vaults' && (
          <div className="mx-auto max-w-2xl panel p-8 text-center">
            <h2 className="text-lg font-semibold">My vaults</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vaults you create or import will appear here. Saved vaults stay on your device.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => navigateTo('create')}
                className="btn-accent"
              >
                Create your first vault
              </button>
            </div>
          </div>
        )}
      </Suspense>

      {DEV_VIEW_ENABLED && (
        <div className="mt-10 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={() => setForceQaCrash(true)}
            className="text-[11px] text-muted-foreground hover:text-danger"
          >
            Force ErrorBoundary (Dev QA)
          </button>
        </div>
      )}
    </AppShell>
  )
}

const App = () => (
  <ErrorBoundary>
    <ToastProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
      <KeyboardShortcutsHelp />
    </ToastProvider>
  </ErrorBoundary>
)

export default App
