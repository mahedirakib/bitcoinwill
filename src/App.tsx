import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, FileText, ShieldAlert, Cpu } from 'lucide-react'
import DevPlayground from './components/DevPlayground'
import { WillCreatorWizard } from './features/will-creator/WillCreatorWizard'
import Learn from './pages/Learn'
import Instructions from './pages/Instructions'
import Protocol from './pages/Protocol'
import { SettingsProvider, useSettings } from './state/settings'
import { NetworkSelector } from './components/NetworkSelector'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import type { PlanInput, PlanOutput } from './lib/bitcoin/types'

const AppContent = () => {
  const [activeView, setActiveView] = useState<'home' | 'create' | 'recover' | 'dev' | 'learn' | 'instructions' | 'protocol'>('home')
  const [instructionData, setInstructionData] = useState<{
    plan: PlanInput;
    result: PlanOutput;
    created_at?: string;
  } | undefined>(undefined)
  const { network } = useSettings()

  useEffect(() => {
    if (window.location.pathname === '/dev') setActiveView('dev')
    if (window.location.pathname === '/protocol') setActiveView('protocol')
  }, [])

  if (activeView === 'dev') return <DevPlayground />;
  if (activeView === 'learn') return <Learn onBack={() => setActiveView('home')} />;
  if (activeView === 'protocol') return <Protocol onBack={() => setActiveView('home')} />;
  if (activeView === 'instructions') return (
    <Instructions 
      initialData={instructionData}
      onBack={() => {
        setInstructionData(undefined);
        setActiveView('home');
      }} 
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setActiveView('home')}
        >
          <img src="/logo.png" alt="Bitcoin Will Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold tracking-tight">Bitcoin Will</span>
          {network === 'mainnet' && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 text-[10px] font-bold text-white rounded uppercase animate-pulse">
              Mainnet
            </span>
          )}
        </div>
        
        <nav className="flex items-center gap-6">
          <button onClick={() => setActiveView('learn')} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Learn
          </button>
          <button onClick={() => setActiveView('protocol')} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Protocol
          </button>
          <button onClick={() => setActiveView('instructions')} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" /> Instructions
          </button>
          <NetworkSelector />
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full">
        {activeView === 'home' && (
          <div className="space-y-24 max-w-5xl mx-auto py-12">
            {/* Hero */}
            <div className="text-center space-y-8 flex flex-col items-center">
              <img src="/logo.png" alt="Bitcoin Will Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" />
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                A Simple Bitcoin <br />
                <span className="text-primary">Inheritance Plan</span>
              </h1>
              <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
                Create a non-custodial Bitcoin spending plan that unlocks funds after a delay. 
                No accounts. No custody. No private keys.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <button 
                  onClick={() => setActiveView('create')}
                  className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all"
                >
                  Create a Spending Plan
                </button>
                <button 
                  onClick={() => setActiveView('learn')}
                  className="glass px-10 py-4 rounded-xl font-bold text-lg hover:border-primary/50 transition-all"
                >
                  Learn How It Works
                </button>
              </div>
            </div>

            {/* Who is it for? */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass p-8 space-y-4">
                <h3 className="text-lg font-bold text-primary">For Holders</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  People who want to ensure their Bitcoin remains accessible to their heirs without using a middleman.
                </p>
              </div>
              <div className="glass p-8 space-y-4">
                <h3 className="text-lg font-bold text-primary">Simple Recovery</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  A deterministic plan that relies on math rather than the survival of a specific company or service.
                </p>
              </div>
              <div className="glass p-8 space-y-4">
                <h3 className="text-lg font-bold text-primary">No Red Tape</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Skip the lawyers, custodians, and expensive smart contract platforms. Purely Bitcoin-native.
                </p>
              </div>
            </div>

            {/* What this is NOT */}
            <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-white/5 bg-white/5 space-y-6">
              <div className="flex items-center gap-2 text-foreground/40 font-bold uppercase tracking-widest text-xs">
                <ShieldAlert className="w-4 h-4" /> What this is NOT
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="font-bold text-sm">Not a Wallet</p>
                  <p className="text-xs text-foreground/40">We never see or store your private keys.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Not a Legal Will</p>
                  <p className="text-xs text-foreground/40">This is a technical tool, not a legal document.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Not a Custodian</p>
                  <p className="text-xs text-foreground/40">We do not hold or manage your Bitcoin.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'create' && (
          <WillCreatorWizard 
            onCancel={() => setActiveView('home')} 
            onViewInstructions={(data) => {
              setInstructionData(data as {
                plan: PlanInput;
                result: PlanOutput;
                created_at?: string;
              });
              setActiveView('instructions');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 flex flex-col items-center gap-4 text-center text-sm text-foreground/40 border-t border-border mt-12">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-xs border border-white/5">
           <AlertCircle className="w-3 h-3 text-primary" />
           Current Environment: <span className="uppercase font-bold text-foreground/60">{network}</span>
        </div>
        <p>Built as an educational and practical Bitcoin-native tool.</p>
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/mahedirakib/bitcoinwill/blob/main/whitepaper.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground/80 transition-colors underline underline-offset-4 decoration-white/5"
          >
            Protocol Whitepaper
          </a>
          <span className="opacity-20">•</span>
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