import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Home as HomeIcon,
  Plus,
  KeyRound,
  FolderClosed,
  BookOpen,
  Cpu,
  FileText,
  ScrollText,
  Menu,
  X,
} from 'lucide-react';
import { NetworkSelector } from './NetworkSelector';
import { useSettings } from '@/state/settings';
import logo from '../assets/logo.svg';

export type NavView =
  | 'home'
  | 'create'
  | 'recover'
  | 'vaults'
  | 'learn'
  | 'protocol'
  | 'instructions'
  | 'whitepaper';

interface AppShellProps {
  active: NavView;
  onNavigate: (view: NavView) => void;
  topbar: { title: string; subtitle?: string; action?: ReactNode };
  children: ReactNode;
}

const PRIMARY: { id: NavView; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'create', label: 'Create plan', icon: Plus },
  { id: 'recover', label: 'Recover', icon: KeyRound },
  { id: 'vaults', label: 'My vaults', icon: FolderClosed },
];

const REFERENCE: { id: NavView; label: string; icon: typeof HomeIcon }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'protocol', label: 'Protocol', icon: Cpu },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'whitepaper', label: 'Whitepaper', icon: ScrollText },
];

export const AppShell = ({ active, onNavigate, topbar, children }: AppShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { network } = useSettings();
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const navItem = (item: { id: NavView; label: string; icon: typeof HomeIcon }) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id);
          setMobileOpen(false);
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
          isActive
            ? 'border-border bg-muted font-semibold text-foreground'
            : 'border-transparent font-medium text-foreground/70 hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
      </button>
    );
  };

  useEffect(() => {
    if (!mobileOpen) return;

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      lastFocusedRef.current?.focus();
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="mb-5 flex items-center gap-2.5 px-2">
        <img src={logo} alt="" className="h-6 w-6" />
        <span className="text-sm font-semibold tracking-tight">Bitcoin Will</span>
        {network === 'mainnet' && (
          <span className="ml-auto rounded-sm bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
            Live
          </span>
        )}
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {PRIMARY.map(navItem)}
      </nav>

      <div className="mt-5">
        <div className="section-eyebrow mb-1.5 px-3">Reference</div>
        <nav aria-label="Reference" className="flex flex-col gap-0.5">
          {REFERENCE.map(navItem)}
        </nav>
      </div>

      <div className="mt-auto border-t border-border pt-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <span className="text-xs text-muted-foreground">Network</span>
          <NetworkSelector />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[120] rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white focus:not-sr-only"
      >
        Skip to content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-border bg-background px-3 py-5 lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          ref={drawerRef}
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-64 flex-shrink-0 flex-col border-r border-border bg-background px-3 py-5">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-2 rounded-md p-1.5 text-foreground/60 hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-4 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="rounded-md p-1.5 text-foreground/70 hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight">{topbar.title}</h1>
              {topbar.subtitle && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{topbar.subtitle}</p>
              )}
            </div>
          </div>
          {topbar.action && (
            <div className="flex flex-shrink-0 items-center gap-2">
              {topbar.action}
            </div>
          )}
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
