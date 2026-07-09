import { useState, useEffect, useRef, lazy, Suspense, startTransition } from 'react'
import { DevPlayground } from './components/DevPlayground'
import type { InstructionData } from './features/will-creator/WillCreatorWizard'
import { SettingsProvider } from './state/settings'
import { ErrorBoundary, PageErrorFallback } from './components/ErrorBoundary'
import { ToastProvider, useToast } from './components/Toast'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { PageLoading } from './components/Loading'
import { AppShell, type NavView } from './components/AppShell'
import { Home } from './pages/Home'
import type { SavedVault } from './lib/vaultStorage'

type AppView = NavView | 'dev' | 'settings'
const DEV_VIEW_ENABLED = import.meta.env.DEV

const loadWillCreatorWizard = () => import('./features/will-creator/WillCreatorWizard')
const loadLearnPage = () => import('./pages/Learn')
const loadInstructionsPage = () => import('./pages/Instructions')
const loadProtocolPage = () => import('./pages/Protocol')
const loadWhitepaperPage = () => import('./pages/Whitepaper')
const loadVaultsPage = () => import('./pages/Vaults')
const loadVaultDetailPage = () => import('./pages/VaultDetail')
const loadSettingsPage = () => import('./pages/Settings')

const WillCreatorWizard = lazy(async () => {
  const module = await loadWillCreatorWizard()
  return { default: module.WillCreatorWizard }
})
const Learn = lazy(loadLearnPage)
const Instructions = lazy(loadInstructionsPage)
const Protocol = lazy(loadProtocolPage)
const Whitepaper = lazy(loadWhitepaperPage)
const VaultsPage = lazy(async () => {
  const module = await loadVaultsPage()
  return { default: module.VaultsPage }
})
const VaultDetailPage = lazy(async () => {
  const module = await loadVaultDetailPage()
  return { default: module.VaultDetailPage }
})
const SettingsPage = lazy(async () => {
  const module = await loadSettingsPage()
  return { default: module.SettingsPage }
})

const preloadedViews = new Set<AppView>()
const VIEW_PRELOADERS: Partial<Record<AppView, () => Promise<unknown>>> = {
  create: loadWillCreatorWizard,
  learn: loadLearnPage,
  instructions: loadInstructionsPage,
  recover: loadInstructionsPage,
  protocol: loadProtocolPage,
  whitepaper: loadWhitepaperPage,
  vaults: loadVaultsPage,
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
  if (path === '/settings') return 'settings'
  return 'home'
}

const pathFromView = (view: AppView): string => {
  if (view === 'dev') return DEV_VIEW_ENABLED ? '/dev' : '/'
  if (view === 'home') return '/'
  if (view === 'settings') return '/settings'
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
  settings:     { title: 'Settings' },
}

const AppContent = () => {
  const { showToast } = useToast()
  const [activeView, setActiveView] = useState<AppView>(() => viewFromPath(window.location.pathname))
  const historyActionRef = useRef<'push' | 'replace'>('replace')
  const [instructionData, setInstructionData] = useState<InstructionData | undefined>(undefined)
  const [selectedVault, setSelectedVault] = useState<SavedVault | null>(null)
  const [forceQaCrash, setForceQaCrash] = useState(false)

  if (forceQaCrash) {
    throw new Error('Forced QA crash to validate ErrorBoundary fallback UI.')
  }

  const navigateTo = (view: AppView, action: 'push' | 'replace' = 'push') => {
    historyActionRef.current = action
    if (view !== 'instructions') {
      setInstructionData(undefined)
    }
    // Always clear the selected vault here. `handleViewVault` re-sets it after
    // navigating so the detail renders; this ensures the "My vaults" nav item
    // reliably shows the list instead of a stale detail, and that browser Back
    // out of a detail doesn't leave a stale selection behind.
    setSelectedVault(null)
    preloadView(view)
    startTransition(() => {
      setActiveView(view)
    })
  }

  const handleViewVault = (vault: SavedVault) => {
    navigateTo('vaults')
    setSelectedVault(vault)
  }

  const handleViewVaultInstructions = (vault: SavedVault) => {
    setInstructionData({
      plan: vault.plan,
      result: vault.result,
      created_at: vault.createdAt,
    })
    setSelectedVault(null)
    navigateTo('instructions')
  }

  useEffect(() => {
    const handlePopstate = () => {
      const nextView = viewFromPath(window.location.pathname)
      if (nextView !== 'instructions') {
        setInstructionData(undefined)
      }
      if (nextView !== 'vaults') {
        setSelectedVault(null)
      }
      setActiveView(nextView)
    }
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  const meta = TITLES[activeView as NavView] ?? TITLES.home

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

    // Update document title
    const title = meta.title
    document.title = title === 'Home' ? 'Bitcoin Will' : `${title} · Bitcoin Will`
  }, [activeView, meta.title])

  if (activeView === 'dev' && DEV_VIEW_ENABLED) return <DevPlayground />

  return (
    <AppShell
      active={activeView as NavView}
      onNavigate={(v) => navigateTo(v)}
      topbar={meta}
    >
      <Suspense fallback={<PageLoading />}>
        {activeView === 'home' && (
          <ErrorBoundary
            key="home"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('home', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <Home
              onNavigate={(v) => navigateTo(v)}
              onViewVault={handleViewVault}
            />
          </ErrorBoundary>
        )}

        {activeView === 'create' && (
          <ErrorBoundary
            key="create"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('create', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <WillCreatorWizard
              onCancel={() => navigateTo('home', 'replace')}
              onViewInstructions={(data) => {
                setInstructionData(data)
                navigateTo('instructions')
              }}
            />
          </ErrorBoundary>
        )}

        {activeView === 'learn' && (
          <ErrorBoundary
            key="learn"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('learn', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <Learn onBack={() => navigateTo('home', 'replace')} />
          </ErrorBoundary>
        )}

        {activeView === 'protocol' && (
          <ErrorBoundary
            key="protocol"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('protocol', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <Protocol
              onBack={() => navigateTo('home', 'replace')}
              onOpenWhitepaper={() => navigateTo('whitepaper')}
            />
          </ErrorBoundary>
        )}

        {activeView === 'whitepaper' && (
          <ErrorBoundary
            key="whitepaper"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('whitepaper', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <Whitepaper onBack={() => navigateTo('home', 'replace')} />
          </ErrorBoundary>
        )}

        {(activeView === 'instructions' || activeView === 'recover') && (
          <ErrorBoundary
            key="instructions"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('home', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <Instructions
              initialData={instructionData}
              onBack={() => {
                setInstructionData(undefined)
                navigateTo('home', 'replace')
              }}
            />
          </ErrorBoundary>
        )}

        {activeView === 'vaults' && !selectedVault && (
          <ErrorBoundary
            key="vaults-list"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('vaults', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <VaultsPage
              onNavigate={(v) => navigateTo(v)}
              onViewVault={handleViewVault}
            />
          </ErrorBoundary>
        )}

        {activeView === 'vaults' && selectedVault && (
          <ErrorBoundary
            key={`vault-detail-${selectedVault.id}`}
            fallback={
              <PageErrorFallback
                onRetry={() => setSelectedVault(null)}
                onGoHome={() => {
                  setSelectedVault(null)
                  navigateTo('home', 'replace')
                }}
              />
            }
          >
            <VaultDetailPage
              vault={selectedVault}
              onBack={() => setSelectedVault(null)}
              onViewInstructions={handleViewVaultInstructions}
              onDelete={() => {
                setSelectedVault(null)
                showToast('Vault removed')
              }}
            />
          </ErrorBoundary>
        )}

        {activeView === 'settings' && (
          <ErrorBoundary
            key="settings"
            fallback={
              <PageErrorFallback
                onRetry={() => navigateTo('settings', 'replace')}
                onGoHome={() => navigateTo('home', 'replace')}
              />
            }
          >
            <SettingsPage onNavigate={(v) => navigateTo(v)} />
          </ErrorBoundary>
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

export const App = () => (
  <ErrorBoundary>
    <ToastProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
      <KeyboardShortcutsHelp />
    </ToastProvider>
  </ErrorBoundary>
)
