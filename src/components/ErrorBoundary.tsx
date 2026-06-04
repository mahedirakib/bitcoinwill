import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

const withBase = (path = ''): string => {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, '')}`;
};

interface Props {
  children: ReactNode;
  /**
   * Optional fallback UI to render when an error is caught.
   * If omitted, the full-screen error UI is shown.
   */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="panel w-full max-w-md p-6 space-y-5 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-md bg-danger/10 p-2 text-danger">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="text-base font-semibold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. No funds are at risk, but the interface needs to restart.
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.assign(withBase())}
                className="btn-primary"
              >
                <Home className="h-4 w-4" /> Home
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                <RefreshCcw className="h-4 w-4" /> Reset
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Need help? Check the{' '}
              <a href={withBase('learn')} className="text-foreground underline underline-offset-2">
                learning center
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PageErrorFallbackProps {
  onRetry: () => void;
  onGoHome: () => void;
}

export const PageErrorFallback = ({ onRetry, onGoHome }: PageErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
    <div className="rounded-full bg-danger/10 p-3 text-danger">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <div className="space-y-1">
      <h2 className="text-base font-semibold">This page failed to load</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Something went wrong rendering this view. The rest of the app is unaffected.
      </p>
    </div>
    <div className="flex gap-2">
      <button type="button" onClick={onGoHome} className="btn-secondary">
        <Home className="h-4 w-4" /> Home
      </button>
      <button type="button" onClick={onRetry} className="btn-primary">
        <RefreshCcw className="h-4 w-4" /> Retry
      </button>
    </div>
  </div>
);
