import { useState, useEffect, useRef, lazy, Suspense, startTransition, type MouseEvent as ReactMouseEvent } from 'react'
import { BookOpen, AlertCircle, FileText, ShieldAlert, Cpu, Menu, X, Users, Zap, History, ScrollText, ArrowRight } from 'lucide-react'
import DevPlayground from './components/DevPlayground'
import type { InstructionData } from './features/will-creator/WillCreatorWizard'
import { SettingsProvider, useSettings } from './state/settings'
import { NetworkSelector } from './components/NetworkSelector'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'
import { PageLoading } from './components/Loading'
import type { PlanInput, PlanOutput } from './lib/bitcoin/types'
import logo from './assets/logo.png'

type AppView = 'home' | 'create' | 'recover' | 'dev' | 'learn' | 'instructions' | 'protocol' | 'whitepaper'
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

const shouldHandleClientNavigation = (event: ReactMouseEvent<HTMLAnchorElement>): boolean => (
  event.button === 0 &&
  !event.defaultPrevented &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey
)

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

const withBase = (path: string): string => {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path === '/' ? '' : path
  const fullPath = `${normalizedBase}${normalizedPath}`
  return fullPath || '/'
}

const viewFromPath = (pathname: string): AppView => {
  const path = normalizeAppPath(pathname)
  if (path === '/dev') return DEV_VIEW_ENABLED ? 'dev' : 'home'
  if (path === '/protocol') return 'protocol'
  if (path === '/whitepaper') return 'whitepaper'
  if (path === '/learn') return 'learn'
  if (path === '/instructions') return 'instructions'
  if (path === '/create') return 'create'
  return 'home'
}

const pathFromView = (view: AppView): string => {
  if (view === 'dev') return DEV_VIEW_ENABLED ? '/dev' : '/'
  if (view === 'protocol') return '/protocol'
  if (view === 'whitepaper') return '/whitepaper'
  if (view === 'learn') return '/learn'
  if (view === 'instructions') return '/instructions'
  if (view === 'create') return '/create'
  return '/'
}

const AppContent = () => {
  const [activeView, setActiveView] = useState<AppView>(() => viewFromPath(window.location.pathname))
  const [whitepaperBackView, setWhitepaperBackView] = useState<AppView>('home')
  const [forceQaCrash, setForceQaCrash] = useState(false)
  const currentView: AppView = activeView
  const historyActionRef = useRef<'push' | 'replace'>('replace')
  const [instructionData, setInstructionData] = useState<InstructionData | undefined>(undefined)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { network } = useSettings()

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

  const openWhitepaper = (fromView: AppView = 'home') => {
    setWhitepaperBackView(fromView)
    navigateTo('whitepaper')
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
      if (historyAction === 'replace') {
        window.history.replaceState(null, '', withBase(nextPath))
      } else {
        window.history.pushState(null, '', withBase(nextPath))
      }
    }
    historyActionRef.current = 'push'
  }, [activeView])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [activeView])

  if (activeView === 'dev' && DEV_VIEW_ENABLED) return <DevPlayground />;
  if (activeView === 'learn') return (
    <Suspense fallback={<PageLoading />}>
      <Learn onBack={() => navigateTo('home', 'replace')} />
    </Suspense>
  );
  if (activeView === 'protocol') return (
    <Suspense fallback={<PageLoading />}>
      <Protocol onBack={() => navigateTo('home', 'replace')} onOpenWhitepaper={() => openWhitepaper('protocol')} />
    </Suspense>
  );
  if (activeView === 'whitepaper') return (
    <Suspense fallback={<PageLoading />}>
      <Whitepaper onBack={() => navigateTo(whitepaperBackView, 'replace')} />
    </Suspense>
  );
  if (activeView === 'instructions') return (
    <Suspense fallback={<PageLoading />}>
      <Instructions 
        initialData={instructionData}
        onBack={() => {
          setInstructionData(undefined);
          navigateTo('home', 'replace');
        }} 
      />
    </Suspense>
  );

  const navItems = [
    { label: 'Learn', view: 'learn' as const, icon: BookOpen },
    { label: 'Protocol', view: 'protocol' as const, icon: Cpu },
    { label: 'TIP Whitepaper', view: 'whitepaper' as const, icon: ScrollText },
    { label: 'Instructions', view: 'instructions' as const, icon: FileText },
  ]

  const homeHighlights = [
    {
      title: 'For Holders',
      desc: 'Keep inheritance planning under your control instead of relying on a custodian or service provider.',
      icon: Users,
    },
    {
      title: 'Purely Native',
      desc: 'The plan is enforced by Bitcoin script rules, not by company uptime or legal red tape.',
      icon: Zap,
    },
    {
      title: 'Simple Recovery',
      desc: 'Export recovery instructions that a beneficiary can use when the required delay has actually passed.',
      icon: History,
    },
  ]

  const protocolSteps = [
    'Choose the owner key, beneficiary key, and a delay.',
    'Fund the generated vault address with your own wallet.',
    'If the funds remain unmoved long enough, the beneficiary path becomes valid.',
  ]

  const beforeYouStart = [
    {
      title: 'Bring Public Keys',
      desc: 'Have the owner and beneficiary public keys ready before you begin. The app never asks for private keys.',
    },
    {
      title: 'Pick a Delay',
      desc: 'Start with a delay you can realistically monitor and reset. For most people, days or weeks are easier than months.',
    },
    {
      title: 'Store the Kit Offline',
      desc: 'After generation, download the recovery kit and beneficiary instructions to durable offline storage.',
    },
  ]

  const showFooter = currentView !== 'create' && currentView !== 'instructions'

  return (
    <div className="min-h-screen flex flex-col bg-mesh">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[120] rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background focus:not-sr-only"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-black/5 bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:h-24 md:px-8">
          <a
            href={withBase('/')}
            className="group flex items-center gap-3 text-left"
            aria-label="Go to home"
            onClick={(event) => {
              if (!shouldHandleClientNavigation(event)) return;
              event.preventDefault();
              navigateTo('home', 'replace');
              setIsMenuOpen(false);
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
              <img src={logo} alt="Bitcoin Will" className="relative h-8 w-8 object-contain md:h-10 md:w-10" />
            </div>
            <span className="text-lg font-bold tracking-tight md:text-xl">Bitcoin Will</span>
            {network === 'mainnet' && (
              <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white animate-pulse">
                Mainnet
              </span>
            )}
          </a>
        
        {/* Desktop Nav */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.view}
              href={withBase(pathFromView(item.view))}
              onClick={(event) => {
                if (!shouldHandleClientNavigation(event)) return;
                event.preventDefault();
                if (item.view === 'whitepaper') {
                  openWhitepaper('home');
                  return;
                }
                navigateTo(item.view);
              }}
              onMouseEnter={() => preloadView(item.view)}
              onFocus={() => preloadView(item.view)}
              aria-current={currentView === item.view ? 'page' : undefined}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                currentView === item.view ? 'text-foreground' : 'text-foreground/70 hover:text-primary'
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </a>
          ))}
          <div className="pl-4 border-l border-black/5">
            <NetworkSelector />
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <NetworkSelector />
          <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-main-nav"
            className="rounded-xl p-2 text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-x-0 bottom-0 top-20 bg-background/95 backdrop-blur-md z-40 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <nav id="mobile-main-nav" aria-label="Mobile" className="flex flex-col p-8 gap-6">
              {navItems.map((item) => (
                <a
                  key={item.view}
                  href={withBase(pathFromView(item.view))}
                  onClick={(event) => {
                    if (!shouldHandleClientNavigation(event)) return;
                    event.preventDefault();
                    if (item.view === 'whitepaper') {
                      openWhitepaper('home');
                      setIsMenuOpen(false);
                      return;
                    }
                    navigateTo(item.view);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-4 border-b border-border/50 py-4 text-left text-xl font-bold text-foreground/80 transition-colors hover:text-primary"
                >
                  <item.icon className="w-6 h-6 text-primary" /> {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full px-6 pb-16 pt-8 md:px-8 md:pb-20 md:pt-10">
        {activeView === 'home' && (
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 md:gap-20">
            <section className="grid gap-12 md:min-h-[calc(100vh-14rem)] md:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] md:items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                  Bitcoin-Native Inheritance Planning
                </p>

                <div className="space-y-5">
                  <h1 className="max-w-[10ch] text-[clamp(3.35rem,9vw,6.8rem)] font-black leading-[0.92] tracking-tight">
                    Create a Bitcoin <span className="text-primary">Inheritance Plan</span>
                  </h1>
                  <p className="max-w-xl text-lg font-medium leading-relaxed text-foreground/72 md:text-xl">
                    Plan for inheritance without custody, accounts, or private-key uploads. Bitcoin Will generates a script-based spending plan you can inspect, export, and keep offline.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <a
                    href={withBase('/create')}
                    onClick={(event) => {
                      if (!shouldHandleClientNavigation(event)) return;
                      event.preventDefault();
                      navigateTo('create');
                    }}
                    onMouseEnter={() => preloadView('create')}
                    onFocus={() => preloadView('create')}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Create Spending Plan <ArrowRight className="h-5 w-5" />
                  </a>
                  <a
                    href={withBase('/learn')}
                    onClick={(event) => {
                      if (!shouldHandleClientNavigation(event)) return;
                      event.preventDefault();
                      navigateTo('learn');
                    }}
                    onMouseEnter={() => preloadView('learn')}
                    onFocus={() => preloadView('learn')}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Learn How It Works
                  </a>
                </div>

                <div className="grid gap-4 border-t border-border/80 pt-6 sm:grid-cols-3">
                  {homeHighlights.map((item) => (
                    <div key={item.title} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <h2 className="text-sm font-extrabold tracking-tight">{item.title}</h2>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/68">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <section className="glass rounded-[2rem] border-primary/10 bg-white/80 p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-foreground/55">Protocol Flow</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    TIP
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  {protocolSteps.map((step, index) => (
                    <div key={step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                          {index + 1}
                        </div>
                        {index < protocolSteps.length - 1 && <div className="mt-2 h-full w-px bg-border" />}
                      </div>
                      <div className="pb-6 pt-1">
                        <p className="text-base font-semibold leading-relaxed text-foreground/80">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 border-t border-border/75 pt-6 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/45">No Custody</p>
                    <p className="text-sm font-semibold text-foreground/80">You keep control of the keys and funding wallet.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/45">Offline Exports</p>
                    <p className="text-sm font-semibold text-foreground/80">Download recovery kits and beneficiary instructions for long-term storage.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/45">Open Review</p>
                    <p className="text-sm font-semibold text-foreground/80">Inspect the script, address, and recovery path before funding anything.</p>
                  </div>
                </div>
              </section>
            </section>

            <section className="grid gap-8 border-y border-border/80 py-6 md:grid-cols-3">
              {beforeYouStart.map((item) => (
                <div key={item.title} className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/90">Before You Start</p>
                  <p className="text-lg font-semibold tracking-tight">{item.title}</p>
                  <p className="text-sm leading-relaxed text-foreground/68">{item.desc}</p>
                </div>
              ))}
            </section>

            <section className="rounded-[2rem] border border-black/5 bg-white/72 p-8 md:p-10">
              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.24em] text-foreground/45">
                <ShieldAlert className="h-4 w-4 text-primary" /> Safety Protocol
              </div>
              <div className="mt-6 grid gap-8 md:grid-cols-3 md:gap-10">
                <div className="space-y-2">
                  <p className="text-base font-extrabold tracking-tight">Not a Wallet</p>
                  <p className="text-sm leading-relaxed text-foreground/65">We never see, store, or manage your private keys.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-extrabold tracking-tight">Not a Legal Will</p>
                  <p className="text-sm leading-relaxed text-foreground/65">This is technical recovery tooling. Estate law still needs its own plan.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-extrabold tracking-tight">Not a Custodian</p>
                  <p className="text-sm leading-relaxed text-foreground/65">Your Bitcoin stays on the network, under your control, until the script rules allow recovery.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeView === 'create' && (
          <Suspense fallback={<PageLoading />}>
            <div className="mx-auto w-full max-w-7xl">
              <WillCreatorWizard 
                onCancel={() => navigateTo('home', 'replace')} 
                onViewInstructions={(data) => {
                  setInstructionData(data as {
                    plan: PlanInput;
                    result: PlanOutput;
                    created_at?: string;
                  });
                  navigateTo('instructions');
                }}
              />
            </div>
          </Suspense>
        )}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="mt-12 border-t border-border/80 px-8 py-8 text-center text-sm text-foreground/60">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs">
              <AlertCircle className="h-3 w-3 text-primary" />
              Current Environment: <span className="font-bold uppercase text-foreground/80">{network}</span>
            </div>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => setForceQaCrash(true)}
                className="rounded-full border border-red-500/20 px-3 py-1 text-[11px] text-red-600 transition-colors hover:bg-red-500/5"
              >
                Force ErrorBoundary (Dev QA)
              </button>
            )}
            <p>Built as an educational and practical Bitcoin-native tool.</p>
            <div className="flex items-center gap-3">
              <a
                href={withBase('/whitepaper')}
                onClick={(event) => {
                  if (!shouldHandleClientNavigation(event)) return;
                  event.preventDefault();
                  openWhitepaper('home');
                }}
                className="underline underline-offset-4 decoration-black/5 transition-colors hover:text-foreground/80"
              >
                TIP Whitepaper
              </a>
              <span className="opacity-40">•</span>
              <p>No Tracking. No Cookies. Open Source Bitcoin Native Inheritance.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
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
