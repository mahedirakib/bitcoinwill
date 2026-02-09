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
    <div className="min-h-screen flex flex-col bg-mesh">
      {/* Header */}
      <header className="p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveView('home')}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src="/logo.png" alt="Bitcoin Will Logo" className="w-10 h-10 object-contain relative" />
          </div>
          <span className="text-xl font-bold tracking-tight">Bitcoin Will</span>
          {network === 'mainnet' && (
            <span className="ml-2 px-2 py-0.5 bg-red-600 text-[10px] font-bold text-white rounded uppercase animate-pulse">
              Mainnet
            </span>
          )}
        </div>
        
        <nav className="flex items-center gap-8">
          <button onClick={() => setActiveView('learn')} className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Learn
          </button>
          <button onClick={() => setActiveView('protocol')} className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Protocol
          </button>
          <button onClick={() => setActiveView('instructions')} className="text-sm font-semibold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" /> Instructions
          </button>
          <div className="pl-4 border-l border-white/10">
            <NetworkSelector />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full">
        {activeView === 'home' && (
          <div className="space-y-32 max-w-5xl mx-auto py-20">
            {/* Hero */}
            <div className="text-center space-y-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <img src="/logo.png" alt="Bitcoin Will Logo" className="w-32 h-32 md:w-40 md:h-40 object-contain relative drop-shadow-2xl" />
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05]">
                A Simple Bitcoin <br />
                <span className="text-primary bg-clip-text">Inheritance Plan</span>
              </h1>
              <p className="text-xl md:text-2xl text-foreground/50 max-w-2xl mx-auto font-medium leading-relaxed">
                Create a non-custodial Bitcoin spending plan that unlocks funds after a delay. 
                <span className="text-foreground/80"> No accounts. No custody. No private keys.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <button 
                  onClick={() => setActiveView('create')}
                  className="btn-primary"
                >
                  Create Spending Plan
                </button>
                <button 
                  onClick={() => setActiveView('learn')}
                  className="btn-secondary"
                >
                  How It Works
                </button>
              </div>
            </div>

            {/* Who is it for? */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'For Holders', desc: 'Ensure your Bitcoin remains accessible to heirs without middlemen or legal red tape.' },
                { title: 'Purely Native', desc: 'A deterministic plan that relies on Bitcoin-native scripts rather than company survival.' },
                { title: 'Simple Recovery', desc: 'Easy-to-follow instructions for beneficiaries to claim funds when the time is right.' }
              ].map((item, i) => (
                <div key={i} className="glass p-8 space-y-4 glass-hover group">
                  <h3 className="text-lg font-bold text-primary group-hover:scale-105 transition-transform origin-left">{item.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* What this is NOT */}
            <div className="max-w-3xl mx-auto p-12 rounded-[2rem] border border-white/5 bg-white/5 space-y-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-foreground/30 font-bold uppercase tracking-[0.2em] text-[10px]">
                <ShieldAlert className="w-4 h-4" /> Safety Protocol
              </div>
              <div className="grid sm:grid-cols-3 gap-10">
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Wallet</p>
                  <p className="text-xs text-foreground/40 leading-relaxed font-medium">We never see, store, or manage your private keys.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Legal Will</p>
                  <p className="text-xs text-foreground/40 leading-relaxed font-medium">This is a technical recovery tool, not a legal document.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-sm tracking-tight">Not a Custodian</p>
                  <p className="text-xs text-foreground/40 leading-relaxed font-medium">Your Bitcoin stays on the network, under your control.</p>
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