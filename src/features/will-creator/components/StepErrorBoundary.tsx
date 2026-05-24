import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface StepErrorBoundaryProps {
  stepName: string;
  children: ReactNode;
  onReset?: () => void;
  onBack?: () => void;
}

interface StepErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StepErrorBoundary extends Component<StepErrorBoundaryProps, StepErrorBoundaryState> {
  constructor(props: StepErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StepErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.stepName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-danger">
                Something went wrong in {this.props.stepName}
              </h3>
              <p className="text-xs text-danger/80">
                An unexpected error occurred. Your inputs are preserved — you can try again.
              </p>
              {this.state.error && (
                <pre className="rounded bg-white p-2 font-mono text-[11px] text-danger break-all">
                  {this.state.error.message}
                </pre>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={this.handleReset} className="btn-primary">
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            {this.props.onBack && (
              <button type="button" onClick={this.props.onBack} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
