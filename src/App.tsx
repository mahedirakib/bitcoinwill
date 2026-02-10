import { useState, useEffect, useRef } from 'react'
import { BookOpen, AlertCircle, FileText, ShieldAlert, Cpu, Menu, X, Users, Zap, History, ScrollText } from 'lucide-react'
import DevPlayground from './components/DevPlayground'
import { WillCreatorWizard } from './features/will-creator/WillCreatorWizard'
import Learn from './pages/Learn'
import Instructions from './pages/Instructions'
import Protocol from './pages/Protocol'
import Whitepaper from './pages/Whitepaper'
import { SettingsProvider, useSettings } from './state/settings'
import { NetworkSelector } from './components/NetworkSelector'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import type { PlanInput, PlanOutput } from './lib/bitcoin/types'
import logo from './assets/logo.png'

type AppView = 'home' | 'create' | 'recover' | 'dev' | 'learn' | 'instructions' | 'protocol' | 'whitepaper'

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
  if (path === '/dev') return 'dev'
  if (path === '/protocol') return 'protocol'
  if (path === '/whitepaper') return 'whitepaper'
  if (path === '/learn') return 'learn'
  if (path === '/instructions') return 'instructions'
  if (path === '/create') return 'create'
  return 'home'
}

const pathFromView = (view: AppView): string => {
  if (view === 'dev') return '/dev'
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
  const currentView: AppView = activeView
  const historyActionRef = useRef<'push' | 'replace'>('replace')
  const [instructionData, setInstructionData] = useState<{
    plan: PlanInput;
    result: PlanOutput;
    created_at?: string;
  } | undefined>(undefined)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { network } = useSettings()

  const navigateTo = (view: AppView, action: 'push' | 'replace' = 'push') => {
    historyActionRef.current = action
    setActiveView(view)
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

  if (activeView === 'dev') return <DevPlayground />;
  if (activeView === 'learn') return <Learn onBack={() => navigateTo('home', 'replace')} />;
  if (activeView === 'protocol') return <Protocol onBack={() => navigateTo('home', 'replace')} onOpenWhitepaper={() => openWhitepaper('protocol')} />;
  if (activeView === 'whitepaper') return <Whitepaper onBack={() => navigateTo(whitepaperBackView, 'replace')} />;
  if (activeView === 'instructions') return (
    <Instructions 
      initialData={instructionData}
      onBack={() => {
        setInstructionData(undefined);
        navigateTo('home', 'replace');
      }} 
    />
  );

  const navItems = [
    { label: 'Learn', view: 'learn' as const, icon: BookOpen },
    { label: 'Protocol', view: 'protocol' as const, icon: Cpu },
    { label: 'TIP Whitepaper', view: 'whitepaper' as const, icon: ScrollText },
    { label: 'Instructions', view: 'instructions' as const, icon: FileText },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-mesh">
      {/* Header */}
      <header className="h-20 md:h-24 px-6 md:px-8 flex justify-between items-center max-w-7xl mx-auto w-full relative z-50">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer group bg-transparent border-0 p-0 text-left" 
          aria-label="Go to home"
          onClick={() => {
            navigateTo('home', 'replace');
            setIsMenuOpen(false);
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src={logo} alt="Bitcoin Will Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain relative" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight">Bitcoin Will</span>
          {network === 'mainnet' && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 text-[10px] font-bold text-white rounded uppercase animate-pulse">
              Mainnet
            </span>
          )}
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <button 
              type="button"
              key={item.view}
              onClick={() => {
                if (item.view === 'whitepaper') {
                  openWhitepaper('home');
                  return;
                }
                navigateTo(item.view);
              }} 
              aria-current={currentView === item.view ? 'page' : undefined}
              className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
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
            className="p-2 text-foreground/70 hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-20 bg-background/95 backdrop-blur-md z-40 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <nav id="mobile-main-nav" className="flex flex-col p-8 gap-6">
              {navItems.map((item) => (
                <button 
                  type="button"
                  key={item.view}
                  onClick={() => {
                    if (item.view === 'whitepaper') {
                      openWhitepaper('home');
                      setIsMenuOpen(false);
                      return;
                    }
                    navigateTo(item.view);
                    setIsMenuOpen(false);
                  }} 
                  className="text-xl font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-4 py-4 border-b border-border/50 text-left"
                >
                  <item.icon className="w-6 h-6 text-primary" /> {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full">
        {activeView === 'home' && (
          <div className="space-y-20 md:space-y-32 max-w-5xl mx-auto py-12 md:py-20">
            {/* Hero */}
            <div className="text-center space-y-8 md:space-y-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <img src={logo} alt="Bitcoin Will Logo" className="w-24 h-24 md:w-40 md:h-40 object-contain relative drop-shadow-xl" />
              </div>
              <h1 className="text-4xl md:text-hero">
                A Simple Bitcoin <br className="hidden md:block" />
                <span className="text-primary">Inheritance Plan</span>
              </h1>
              <p className="text-lg md:text-2xl text-foreground/70 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                Create a non-custodial Bitcoin spending plan that unlocks funds after a delay. 
                <span className="text-foreground/90"> No accounts. No custody. No private keys.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-4 md:pt-8 w-full md:w-auto px-6">
                <button 
                  onClick={() => navigateTo('create')}
                  className="btn-primary w-full sm:w-auto"
                >
                  Create Spending Plan
                </button>
                <button 
                  onClick={() => navigateTo('learn')}
                  className="btn-secondary w-full sm:w-auto"
                >
                  How It Works
                </button>
              </div>
            </div>

            {/* Who is it for? */}
            <div className="grid md:grid-cols-3 gap-6 px-4">
              {[
                { 
                  title: 'For Holders', 
                  desc: 'Ensure your Bitcoin remains accessible to heirs without middlemen or legal red tape.',
                  icon: Users 
                },
                { 
                  title: 'Purely Native', 
                  desc: 'A deterministic plan that relies on Bitcoin-native scripts rather than company survival.',
                  icon: Zap 
                },
                { 
                  title: 'Simple Recovery', 
                  desc: 'Easy-to-follow instructions for beneficiaries to claim funds when the time is right.',
                  icon: History 
                }
              ].map((item, i) => (
                <div key={i} className="glass p-6 md:p-8 space-y-6 glass-hover group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-primary group-hover:translate-x-1 transition-transform duration-300">{item.title}</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* What this is NOT */}
            <div className="max-w-3xl mx-auto p-8 md:p-12 rounded-[2rem] border border-black/5 bg-muted/50 space-y-8 backdrop-blur-sm mx-4">
              <div className="flex items-center gap-3 text-foreground/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                <ShieldAlert className="w-4 h-4" /> Safety Protocol
              </div>
              <div className="grid sm:grid-cols-3 gap-8 md:gap-10">
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Wallet</p>
                  <p className="text-xs text-foreground/60 leading-relaxed font-medium">We never see, store, or manage your private keys.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Legal Will</p>
                  <p className="text-xs text-foreground/60 leading-relaxed font-medium">This is a technical recovery tool, not a legal document.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Custodian</p>
                  <p className="text-xs text-foreground/60 leading-relaxed font-medium">Your Bitcoin stays on the network, under your control.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'create' && (
          <div className="w-full px-4">
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
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 flex flex-col items-center gap-4 text-center text-sm text-foreground/60 border-t border-border mt-12">
        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs border border-border">
           <AlertCircle className="w-3 h-3 text-primary" />
           Current Environment: <span className="uppercase font-bold text-foreground/80">{network}</span>
        </div>
        <p>Built as an educational and practical Bitcoin-native tool.</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openWhitepaper('home')}
            className="hover:text-foreground/80 transition-colors underline underline-offset-4 decoration-black/5"
          >
            TIP Whitepaper
          </button>
          <span className="opacity-40">•</span>
          <p>No Tracking. No Cookies. Open Source Bitcoin Native Inheritance.</p>
        </div>
      </footer>
    </div>
  )
}

const App = () => (
  <ErrorBoundary>
    <ToastProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ToastProvider>
  </ErrorBoundary>
)

export default App
