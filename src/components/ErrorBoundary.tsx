import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

const withBase = (path = ''): string => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, '')}`;
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="glass max-w-md p-8 space-y-6 border-red-500/20">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-red-500/10 p-4 rounded-full">
                <AlertTriangle className="text-red-500 w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-foreground/60 text-sm">
                An unexpected error occurred. No funds are at risk, but the interface needs to restart.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.assign(withBase())}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Home
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
            </div>
            
            <p className="text-[10px] text-foreground/40">
              Need help? Check the <a href={withBase('learn')} className="underline">Learning Center</a>.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
